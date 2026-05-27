"use client";
import { useState } from "react";
import type { SessionAttendanceRowView } from "@ubm-hyogo/shared";
import { formatRate } from "../lib/format-attendance";
import { AttendanceDrilldownModal } from "./AttendanceDrilldownModal";

interface Props {
  readonly rows: readonly SessionAttendanceRowView[];
}

export function SessionAttendanceTable({ rows }: Props) {
  const [openSession, setOpenSession] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p data-testid="attendance-by-session-empty">セッションデータがありません</p>
    );
  }

  return (
    <>
      <table
        data-testid="attendance-by-session-table"
        className="attendance-session-table"
      >
        <thead>
          <tr>
            <th scope="col">開催日</th>
            <th scope="col">タイトル</th>
            <th scope="col">出席者数</th>
            <th scope="col">出席率</th>
            <th scope="col" aria-label="詳細" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sessionId} data-testid={`attendance-session-row-${row.sessionId}`}>
              <td>{row.heldOn}</td>
              <td>{row.title}</td>
              <td>{row.attendeeCount}</td>
              <td>{formatRate(row.rate)}</td>
              <td>
                <button
                  type="button"
                  onClick={() => setOpenSession(row.sessionId)}
                  aria-label={`${row.title} の出席詳細を開く`}
                >
                  詳細
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {openSession ? (
        <AttendanceDrilldownModal
          sessionId={openSession}
          onClose={() => setOpenSession(null)}
        />
      ) : null}
    </>
  );
}
