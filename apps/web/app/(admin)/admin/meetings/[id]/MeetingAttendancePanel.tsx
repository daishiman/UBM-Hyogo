"use client";
// /admin/meetings/[id] attendance UI: 候補別 register button + duplicate toast.
import { useState } from "react";

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
  const [registered, setRegistered] = useState<Set<string>>(
    new Set(detail.attendees.map((a) => a.memberId)),
  );
  const [toast, setToast] = useState<string | null>(null);

  const onRegister = async (memberId: string) => {
    if (registered.has(memberId)) {
      setToast("既に出席登録済み");
      return;
    }
    setRegistered((s) => new Set(s).add(memberId));
    const r = await fetch(
      `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendance`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId }),
      },
    );
    if (r.status === 409) {
      setToast("既に出席登録済み");
      setRegistered((s) => new Set(s).add(memberId));
      return;
    }
    if (!r.ok) {
      setToast(`登録に失敗 (${r.status})`);
      return;
    }
    setRegistered((s) => new Set(s).add(memberId));
    setToast("出席を登録しました");
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
                onClick={() => onRegister(c.memberId)}
              >
                出席登録
              </button>
            </li>
          ))}
      </ul>
    </section>
  );
}
