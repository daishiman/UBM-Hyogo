"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { AdminSectionCard, AdminStat } from "../_shared";
import {
  FetchAuthedError,
  useAdminMutation,
} from "@/features/admin/hooks/useAdminMutation";
import { useConfirmDialog } from "@/features/admin/hooks/useConfirmDialog";
import {
  addAttendance,
  importAttendance,
  updateMeeting,
} from "../../../../lib/admin/api";
import { MeetingCreateForm } from "./MeetingCreateForm";
import { MeetingTimeline } from "./MeetingTimeline";
import { MeetingAttendanceDrawer } from "./MeetingAttendanceDrawer";
import type { MemberCandidate } from "./MeetingAttendanceDrawer";
import { bulkFailureMessage } from "./bulk-attendance-message";
import { computeMeetingStats, type MeetingItem } from "./meetingStats";

export interface MeetingsListView {
  total: number;
  items: MeetingItem[];
}

interface MeetingMutationResponse {
  ok?: boolean;
}

const IMPORT_ATTENDANCE_MAX_ROWS = 500;

const unwrap = async <T,>(
  r: Promise<
    | { ok: true; data: unknown }
    | { ok: false; status: number; error: string }
  >,
): Promise<T> => {
  const result = await r;
  if (!result.ok) throw new FetchAuthedError(result.status, result.error);
  return result.data as T;
};

const getMessage = (e: unknown): string => {
  if (e instanceof FetchAuthedError) return e.bodyText;
  if (e instanceof Error) return e.message;
  return "unknown error";
};

// 不変条件 #15: UI 側 filter 二重防御
export function filterCandidates<T extends { isDeleted?: boolean }>(members: T[]): T[] {
  return members.filter((m) => m.isDeleted !== true);
}

interface Props {
  readonly initial: MeetingsListView;
  readonly candidates: ReadonlyArray<MemberCandidate>;
}

export function MeetingsClientShell({ initial, candidates }: Props) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingItem[]>(initial.items);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attended, setAttended] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        initial.items.map((m) => [
          m.sessionId,
          new Set((m.attendance ?? []).map((a) => a.memberId)),
        ]),
      ),
  );

  const meetingUpdateMutation = useAdminMutation<MeetingMutationResponse>(
    "/api/admin/meetings",
    "PATCH",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) => {
        const { sessionId, ...body } = payload as {
          sessionId: string;
          title?: string;
          heldOn?: string;
          note?: string | null;
          deletedAt?: string | null;
        };
        return unwrap<MeetingMutationResponse>(updateMeeting(sessionId, body));
      },
    },
  );
  const addAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
    "/api/admin/meetings/attendances",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) => {
        const { sessionId, memberId } = payload as {
          sessionId: string;
          memberId: string;
        };
        return unwrap<MeetingMutationResponse>(addAttendance(sessionId, memberId));
      },
    },
  );
  const removeAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
    "/api/admin/meetings/__sessionId__/attendance/__memberId__",
    "DELETE",
    {
      refreshOnSuccess: false,
      retry: { maxAttempts: 3 },
      idempotencyKey: () => crypto.randomUUID(),
    },
  );

  const confirm = useConfirmDialog(async (kind, _note, ctx) => {
    if (kind === "remove") {
      const { sessionId, memberId } = ctx as { sessionId: string; memberId: string };
      try {
        await removeAttendanceMutation.trigger(
          null,
          `/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
        );
      } catch (e) {
        if (e instanceof FetchAuthedError && e.status === 404) {
          setAttended((s) => {
            const next = { ...s };
            const cur = new Set(next[sessionId] ?? []);
            cur.delete(memberId);
            next[sessionId] = cur;
            return next;
          });
          setToast("既に出席解除されています");
          return;
        }
        setToast(`削除に失敗: ${getMessage(e)}`);
        throw e;
      }
      setAttended((s) => {
        const next = { ...s };
        const cur = new Set(next[sessionId] ?? []);
        cur.delete(memberId);
        next[sessionId] = cur;
        return next;
      });
      setToast("出席を削除しました");
    } else if (kind === "delete") {
      const { sessionId } = ctx as { sessionId: string };
      try {
        await meetingUpdateMutation.trigger({
          sessionId,
          deletedAt: new Date().toISOString(),
        });
      } catch (e) {
        setToast(`開催削除に失敗: ${getMessage(e)}`);
        throw e;
      }
      setMeetings((items) => items.filter((m) => m.sessionId !== sessionId));
      setToast("開催日を削除しました");
      router.refresh();
    }
  });

  const onAdd = async (sessionId: string, memberId: string) => {
    if (attended[sessionId]?.has(memberId)) {
      setToast("この会員は既に出席登録されています");
      return;
    }
    try {
      await addAttendanceMutation.trigger({ sessionId, memberId });
    } catch (e) {
      if (e instanceof FetchAuthedError && e.status === 422) {
        setToast("削除済み会員は登録できません");
      } else if (e instanceof FetchAuthedError && e.status === 409) {
        setToast("この会員は既に出席登録されています");
      } else {
        setToast(`登録に失敗: ${getMessage(e)}`);
      }
      return;
    }
    setAttended((s) => {
      const next = { ...s };
      const cur = new Set(next[sessionId] ?? []);
      cur.add(memberId);
      next[sessionId] = cur;
      return next;
    });
    setToast("出席を追加しました");
  };

  const onBulkAdd = async (
    sessionId: string,
    memberIds: ReadonlyArray<string>,
  ): Promise<boolean> => {
    const current = attended[sessionId] ?? new Set<string>();
    const fresh = [...new Set(memberIds)].filter((memberId) => !current.has(memberId));
    if (fresh.length === 0) {
      setToast("追加対象がありません");
      return false;
    }
    if (fresh.length > IMPORT_ATTENDANCE_MAX_ROWS) {
      setToast(`一度に追加できるのは ${IMPORT_ATTENDANCE_MAX_ROWS} 名までです`);
      return false;
    }

    let result: Awaited<ReturnType<typeof importAttendance>>;
    try {
      result = await importAttendance(sessionId, fresh);
    } catch (e) {
      setToast(`一括追加に失敗: ${getMessage(e)}`);
      return false;
    }
    if (!result.ok) {
      setToast(`一括追加に失敗: ${result.error}`);
      return false;
    }
    if (!result.data.committed) {
      setToast(bulkFailureMessage(result.data.summary));
      return false;
    }

    setAttended((state) => {
      const next = { ...state };
      const nextSet = new Set(next[sessionId] ?? []);
      for (const memberId of fresh) nextSet.add(memberId);
      next[sessionId] = nextSet;
      return next;
    });
    setToast(`${result.data.summary.ok} 名の出席を追加しました`);
    return true;
  };

  const onUpdate = async (
    sessionId: string,
    patch: { title: string; heldOn: string; note: string | null },
  ) => {
    if (!patch.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(patch.heldOn)) return;
    try {
      await meetingUpdateMutation.trigger({
        sessionId,
        title: patch.title.trim(),
        heldOn: patch.heldOn,
        note: patch.note,
      });
    } catch (e) {
      setToast(`開催更新に失敗: ${getMessage(e)}`);
      return;
    }
    setMeetings((items) =>
      items.map((m) =>
        m.sessionId === sessionId
          ? { ...m, title: patch.title.trim(), heldOn: patch.heldOn, note: patch.note }
          : m,
      ),
    );
    setToast("開催日を更新しました");
    router.refresh();
  };

  const stats = computeMeetingStats(
    meetings.map((m) => ({
      ...m,
      attendance: [...(attended[m.sessionId] ?? new Set<string>())].map((memberId) => ({
        memberId,
      })),
    })),
  );

  return (
    <>
      {toast && (
        <p
          role="status"
          data-testid="attendance-toast"
          className="admin-toast"
        >
          {toast}
        </p>
      )}
      <div
        role="group"
        aria-label="開催 KPI"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AdminStat label="開催数" value={stats.totalMeetings} />
        <AdminStat label="直近開催" value={stats.recentHeldOn ?? "—"} />
        <AdminStat label="累計出席" value={stats.totalAttendees} />
        <AdminStat label="平均出席" value={stats.avgAttendees} />
      </div>

      <MeetingCreateForm
        onCreated={(item) => setMeetings((prev) => [item, ...prev])}
        setToast={setToast}
      />

      <AdminSectionCard
        title={`開催日一覧 (${meetings.length} 件)`}
        description="各開催日を選択すると出席を記録・編集できます"
      >
        <MeetingTimeline
          items={meetings}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          getAttendanceCount={(m) => attended[m.sessionId]?.size ?? m.attendance?.length ?? 0}
          renderRowExtra={(m) =>
            selectedId === m.sessionId ? (
              <MeetingAttendanceDrawer
                meeting={m}
                candidates={candidates}
                attended={attended[m.sessionId] ?? new Set<string>()}
                onAddAttendance={(memberId) => onAdd(m.sessionId, memberId)}
                onBulkAddAttendance={(memberIds) => onBulkAdd(m.sessionId, memberIds)}
                onRemoveAttendance={(memberId) =>
                  confirm.openConfirm("remove", { sessionId: m.sessionId, memberId })
                }
                onUpdateMeeting={(patch) => onUpdate(m.sessionId, patch)}
                onSoftDelete={() =>
                  confirm.openConfirm("delete", { sessionId: m.sessionId })
                }
              />
            ) : null
          }
        />
      </AdminSectionCard>

      <ConfirmDialog
        open={confirm.open}
        title={
          confirm.kind === "remove"
            ? "出席を削除しますか？"
            : confirm.kind === "delete"
              ? "この開催日を削除しますか？"
              : ""
        }
        description={
          confirm.kind === "delete"
            ? "この操作は soft delete です。後で復元できません。"
            : undefined
        }
        confirmLabel="削除する"
        isDestructive
        submitting={confirm.submitting}
        validationError={confirm.validationError}
        onConfirm={confirm.submit}
        onCancel={confirm.closeConfirm}
      />
    </>
  );
}
