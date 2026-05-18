"use client";
// 06c: MeetingPanel — 追加 form + 開催日一覧 + attendance 編集
// 不変条件 #15:
//   - candidates は server で isDeleted=true 除外済 (filterCandidates も同責務)
//   - 既出席メンバーは disabled
//   - 422 受信時は Toast でエラー表示
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMeeting,
  updateMeeting,
  addAttendance,
  removeAttendance,
} from "../../lib/admin/api";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  attendance?: Array<{
    memberId: string;
    assignedAt?: string;
    assignedBy?: string;
  }>;
}
export interface MeetingsListView {
  total: number;
  items: MeetingItem[];
}
export interface MemberCandidate {
  memberId: string;
  fullName: string;
}

interface MeetingMutationResponse {
  ok?: boolean;
}

const unwrapAdminResult = async <T,>(result: Promise<{
  ok: true;
  data: unknown;
} | {
  ok: false;
  status: number;
  error: string;
}>): Promise<T> => {
  const r = await result;
  if (!r.ok) throw new AdminMutationError(r.status, r.error);
  return r.data as T;
};

// 不変条件 #15: UI 側 filter 二重防御
export function filterCandidates<T extends { isDeleted?: boolean }>(members: T[]): T[] {
  return members.filter((m) => m.isDeleted !== true);
}

interface Props {
  readonly meetings: MeetingsListView;
  readonly candidates: MemberCandidate[];
}

export function MeetingPanel({ meetings, candidates }: Props) {
  const router = useRouter();
  const meetingCreateMutation = useAdminMutation<MeetingMutationResponse>(
    "/api/admin/meetings",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) =>
        unwrapAdminResult<MeetingMutationResponse>(
          createMeeting(payload as { title: string; heldOn: string; note?: string | null }),
        ),
    },
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
        return unwrapAdminResult<MeetingMutationResponse>(updateMeeting(sessionId, body));
      },
    },
  );
  const attendanceMutation = useAdminMutation<MeetingMutationResponse>(
    "/api/admin/meetings/attendances",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) => {
        const { sessionId, memberId, attended: isAttended } = payload as {
          sessionId: string;
          memberId: string;
          attended: boolean;
        };
        return unwrapAdminResult<MeetingMutationResponse>(
          isAttended ? addAttendance(sessionId, memberId) : removeAttendance(sessionId, memberId),
        );
      },
    },
  );
  const initialAttended = () =>
    Object.fromEntries(
      meetings.items.map((m) => [
        m.sessionId,
        new Set((m.attendance ?? []).map((a) => a.memberId)),
      ]),
    );
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 各 session ごとに { memberId -> 既出席 } を維持（API初期値 + 楽観 UI）
  const [attended, setAttended] = useState<Record<string, Set<string>>>(initialAttended);
  const [pickedMember, setPickedMember] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, { title: string; heldOn: string; note: string }>>({});

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return;
    setBusy(true);
    let ok = true;
    try {
      await meetingCreateMutation.trigger({ title: title.trim(), heldOn, note: note.trim() || null });
    } catch (e) {
      ok = false;
      setToast(`開催追加に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setBusy(false);
    if (!ok) return;
    setToast("開催日を追加しました");
    setTitle("");
    setHeldOn("");
    setNote("");
    router.refresh();
  };

  const onAdd = async (sessionId: string) => {
    const memberId = pickedMember[sessionId];
    if (!memberId) return;
    if (attended[sessionId]?.has(memberId)) {
      setToast("この会員は既に出席登録されています");
      return;
    }
    try {
      await attendanceMutation.trigger(
        { sessionId, memberId, attended: true },
      );
    } catch (e) {
      if (e instanceof AdminMutationError && e.status === 422) setToast("削除済み会員は登録できません");
      else if (e instanceof AdminMutationError && e.status === 409) setToast("この会員は既に出席登録されています");
      else setToast(`登録に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
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

  const onUpdate = async (sessionId: string) => {
    const draft = editing[sessionId];
    if (!draft || !draft.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(draft.heldOn)) return;
    try {
      await meetingUpdateMutation.trigger(
        {
          sessionId,
          title: draft.title.trim(),
          heldOn: draft.heldOn,
          note: draft.note.trim() || null,
        },
      );
    } catch (e) {
      setToast(`開催更新に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
      return;
    }
    setToast("開催日を更新しました");
    router.refresh();
  };

  const onSoftDelete = async (sessionId: string) => {
    try {
      await meetingUpdateMutation.trigger(
        { sessionId, deletedAt: new Date().toISOString() },
      );
    } catch (e) {
      setToast(`開催削除に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
      return;
    }
    setToast("開催日を削除しました");
    router.refresh();
  };

  const onRemove = async (sessionId: string, memberId: string) => {
    try {
      await attendanceMutation.trigger(
        { sessionId, memberId, attended: false },
      );
    } catch (e) {
      setToast(`削除に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
      return;
    }
    setAttended((s) => {
      const next = { ...s };
      const cur = new Set(next[sessionId] ?? []);
      cur.delete(memberId);
      next[sessionId] = cur;
      return next;
    });
    setToast("出席を削除しました");
  };

  return (
    <section aria-labelledby="meetings-h">
      <h1 id="meetings-h">開催日 / 出席管理</h1>
      {toast && <p role="status" data-testid="attendance-toast">{toast}</p>}

      <form onSubmit={onCreate} aria-label="開催日追加">
        <h2>開催日を追加</h2>
        <FormField name="meeting-title" label="タイトル" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField name="meeting-heldOn" label="開催日 (YYYY-MM-DD)" required>
          <Input
            type="date"
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
            required
          />
        </FormField>
        <FormField name="meeting-note" label="メモ">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
        <button type="submit" disabled={busy}>追加</button>
      </form>

      <h2>開催日一覧 ({meetings.total} 件)</h2>
      {meetings.items.length === 0 ? (
        <EmptyState title="開催日はまだありません" />
      ) : null}
      <ul>
        {meetings.items.map((m) => {
          const here = attended[m.sessionId] ?? new Set<string>();
          const picked = pickedMember[m.sessionId] ?? "";
          const pickedAlreadyAttended = picked !== "" && here.has(picked);
          return (
            <li key={m.sessionId}>
              <article data-testid={`attendance-list-session-${m.sessionId}`}>
                <h3>{m.heldOn} — {m.title}</h3>
                {m.note && <p>{m.note}</p>}
                <details>
                  <summary>編集</summary>
                  <FormField name={`meeting-edit-title-${m.sessionId}`} label="タイトル">
                    <Input
                      value={editing[m.sessionId]?.title ?? m.title}
                      onChange={(e) =>
                        setEditing((s) => ({
                          ...s,
                          [m.sessionId]: {
                            title: e.target.value,
                            heldOn: s[m.sessionId]?.heldOn ?? m.heldOn,
                            note: s[m.sessionId]?.note ?? (m.note ?? ""),
                          },
                        }))
                      }
                    />
                  </FormField>
                  <FormField name={`meeting-edit-heldOn-${m.sessionId}`} label="開催日">
                    <Input
                      type="date"
                      value={editing[m.sessionId]?.heldOn ?? m.heldOn}
                      onChange={(e) =>
                        setEditing((s) => ({
                          ...s,
                          [m.sessionId]: {
                            title: s[m.sessionId]?.title ?? m.title,
                            heldOn: e.target.value,
                            note: s[m.sessionId]?.note ?? (m.note ?? ""),
                          },
                        }))
                      }
                    />
                  </FormField>
                  <FormField name={`meeting-edit-note-${m.sessionId}`} label="メモ">
                    <Input
                      value={editing[m.sessionId]?.note ?? (m.note ?? "")}
                      onChange={(e) =>
                        setEditing((s) => ({
                          ...s,
                          [m.sessionId]: {
                            title: s[m.sessionId]?.title ?? m.title,
                            heldOn: s[m.sessionId]?.heldOn ?? m.heldOn,
                            note: e.target.value,
                          },
                        }))
                      }
                    />
                  </FormField>
                  <button type="button" onClick={() => onUpdate(m.sessionId)}>
                    更新
                  </button>
                  <button type="button" onClick={() => onSoftDelete(m.sessionId)}>
                    開催日を削除
                  </button>
                </details>
                <div role="group" aria-label="出席追加">
                  <label>
                    会員を選択
                    <select
                      data-testid={`attendance-select-${m.sessionId}`}
                      value={picked}
                      onChange={(e) =>
                        setPickedMember((s) => ({ ...s, [m.sessionId]: e.target.value }))
                      }
                    >
                      <option value="">— 選択 —</option>
                      {candidates.map((c) => (
                        <option
                          key={c.memberId}
                          value={c.memberId}
                          disabled={here.has(c.memberId)}
                        >
                          {c.fullName} ({c.memberId})
                          {here.has(c.memberId) ? " — 出席済" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => onAdd(m.sessionId)}
                    disabled={!picked || pickedAlreadyAttended}
                    data-testid={`add-attendance-${m.sessionId}`}
                  >
                    出席を追加
                  </button>
                </div>
                {here.size > 0 && (
                  <div>
                    <h4>出席者</h4>
                    <ul>
                      {[...here].map((mid) => (
                        <li
                          key={mid}
                          data-testid={`attendance-attendee-${m.sessionId}`}
                          data-member={mid}
                        >
                          {mid}{" "}
                          <button
                            type="button"
                            data-testid={`remove-attendance-${m.sessionId}`}
                            data-member={mid}
                            onClick={() => onRemove(m.sessionId, mid)}
                          >
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
