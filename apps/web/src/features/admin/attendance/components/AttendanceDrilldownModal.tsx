"use client";
import { useEffect, useState } from "react";
import type { AttendanceSessionDetail } from "@ubm-hyogo/shared";
import { ZONE_LABEL } from "../lib/format-attendance";
import { isBrowser } from "@/lib/is-browser";

interface Props {
  readonly sessionId: string;
  readonly onClose: () => void;
}

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: AttendanceSessionDetail }
  | { kind: "error"; message: string };

export function AttendanceDrilldownModal({ sessionId, onClose }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/dashboard/attendance/sessions/${encodeURIComponent(sessionId)}/attendees`,
          { credentials: "same-origin" },
        );
        if (!res.ok) {
          if (!cancelled) setState({ kind: "error", message: `読み込みエラー (${res.status})` });
          return;
        }
        const data = (await res.json()) as AttendanceSessionDetail;
        if (!cancelled) setState({ kind: "ready", data });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : "unknown" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!isBrowser()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="attendance-drilldown-modal"
      role="dialog"
      aria-modal="true"
      aria-label="出席詳細"
      data-testid="attendance-drilldown-modal"
    >
      <div className="attendance-drilldown-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="attendance-drilldown-panel">
        <header>
          <h3>出席詳細</h3>
          <button type="button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        {state.kind === "loading" ? (
          <p data-testid="attendance-drilldown-loading">読み込み中…</p>
        ) : state.kind === "error" ? (
          <p data-testid="attendance-drilldown-error">{state.message}</p>
        ) : (
          <div data-testid="attendance-drilldown-content">
            <p>
              <strong>{state.data.title}</strong> ({state.data.heldOn})
            </p>
            <section>
              <h4>出席 ({state.data.attendees.length})</h4>
              <ul>
                {state.data.attendees.map((m) => (
                  <li key={m.memberId}>
                    {m.displayName || m.memberId} — {ZONE_LABEL[m.zone]}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4>欠席 ({state.data.absentees.length})</h4>
              <ul>
                {state.data.absentees.slice(0, 50).map((m) => (
                  <li key={m.memberId}>
                    {m.displayName || m.memberId} — {ZONE_LABEL[m.zone]}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
