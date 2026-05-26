"use client";
// /admin/meetings/[id] attendance UI: 候補別 register button + duplicate toast.
// serial-05 step-06: 生 fetch を useAdminMutation に統一。
//   - 409 conflict は楽観 UI として registered Set に追加する
//   - 422 / 5xx は toast でユーザーに伝える
//   - 出席登録/解除は候補行内で完結し、DELETE race の 404 は解除済みとして収束させる
import { useState } from "react";
import { useAdminMutation } from "../../../../../src/features/admin/hooks/useAdminMutation";
import { FetchAuthedError } from "../../../../../src/lib/fetch/errors";
import { logger } from "../../../../../src/lib/logger";

interface Candidate {
  memberId: string;
  fullName: string;
  isDeleted?: boolean;
}
interface Detail {
  sessionId: string;
  title: string;
  heldOn: string;
  candidates: Candidate[];
  attendees: Array<{ memberId: string }>;
}

export function MeetingAttendancePanel({ detail }: { readonly detail: Detail }) {
  const attendanceLogger = logger.child({
    scope: "admin",
    component: "MeetingAttendancePanel",
  });
  const [registered, setRegistered] = useState<Set<string>>(
    new Set(detail.attendees.map((a) => a.memberId)),
  );
  const [toast, setToast] = useState<string | null>(null);

  const registerMutation = useAdminMutation<unknown>(
    `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
    "POST",
    { refreshOnSuccess: false },
  );
  const unregisterMutation = useAdminMutation<
    { readonly ok: true; readonly attended: false } | undefined
  >(
    `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
    "POST",
    {
      refreshOnSuccess: false,
      treat404AsSuccess: { toast: "既に解除済みです" },
    },
  );

  const onRegister = async (memberId: string) => {
    if (registered.has(memberId)) {
      setToast("既に出席登録済み");
      return;
    }
    try {
      await registerMutation.trigger({ memberId, attended: true });
      setRegistered((s) => new Set(s).add(memberId));
      setToast("出席を登録しました");
    } catch (e) {
      if (e instanceof FetchAuthedError) {
        if (e.status === 409) {
          setToast("既に出席登録済み");
          setRegistered((s) => new Set(s).add(memberId));
          return;
        }
        if (e.status === 422) {
          setToast("削除済み会員は登録できません");
          return;
        }
        if (e.status === 404) {
          setToast("開催日または会員が見つかりません");
          return;
        }
        setToast(`登録に失敗 (${e.status})`);
        return;
      }
      setToast(`登録に失敗 (unknown)`);
    }
  };

  const onUnregister = async (memberId: string) => {
    if (!registered.has(memberId)) {
      setToast("既に解除済みです");
      return;
    }
    try {
      const result = await unregisterMutation.trigger({ memberId, attended: false });
      setRegistered((s) => {
        const next = new Set(s);
        next.delete(memberId);
        return next;
      });
      if (result === undefined) {
        attendanceLogger.info({
          event: "attendance.unregister.already_removed",
          meetingId: detail.sessionId,
          memberId,
        });
      }
      setToast(result === undefined ? "既に解除済みです" : "出席を解除しました");
    } catch (e) {
      if (e instanceof FetchAuthedError) {
        attendanceLogger.error({
          event: "attendance.unregister.failed",
          meetingId: detail.sessionId,
          memberId,
          status: e.status,
          error: e,
        });
        setToast(`解除に失敗 (${e.status})`);
        return;
      }
      attendanceLogger.warn({
        event: "attendance.unregister.network",
        meetingId: detail.sessionId,
        memberId,
        error: e,
      });
      setToast(`解除に失敗 (unknown)`);
    }
  };

  return (
    <section aria-labelledby="meeting-detail-h">
      <h1 id="meeting-detail-h">
        {detail.heldOn} — {detail.title}
      </h1>
      {toast && (
        <p role="status" data-testid="toast">
          {toast}
        </p>
      )}
      <ul data-testid="admin-meetings-table">
        {detail.candidates
          .filter((c) => !c.isDeleted)
          .map((c) => (
            <li
              key={c.memberId}
              data-testid="attendance-candidate"
              data-member={c.memberId}
            >
              {c.fullName} ({c.memberId})
              <button
                type="button"
                data-testid="attendance-register"
                data-member={c.memberId}
                data-registered={registered.has(c.memberId) ? "true" : "false"}
                onClick={() => onRegister(c.memberId)}
              >
                {registered.has(c.memberId) ? "登録済" : "出席登録"}
              </button>
              {registered.has(c.memberId) && (
                <button
                  type="button"
                  data-testid="attendance-unregister"
                  data-member={c.memberId}
                  data-registered="true"
                  onClick={() => onUnregister(c.memberId)}
                >
                  出席解除
                </button>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}
