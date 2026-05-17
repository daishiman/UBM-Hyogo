"use client";
// 06b: 参加履歴（read-only）。
// issue-372: 直近 N 件 + cursor で「もっと見る」追加読み込みに対応する。
// hasMore=false の場合は従来通り一覧のみを表示する。

import { useState } from "react";
import type { MemberProfile } from "@ubm-hyogo/shared";
import type { MeAttendancePageResponse } from "../../../src/lib/api/me-types";

export interface AttendanceListProps {
  readonly attendance: MemberProfile["attendance"];
  readonly attendanceMeta?: MemberProfile["attendanceMeta"];
}

type Item = MemberProfile["attendance"][number];

export function AttendanceList({ attendance, attendanceMeta }: AttendanceListProps) {
  const [items, setItems] = useState<Item[]>(() => [...attendance]);
  const [cursor, setCursor] = useState<string | null>(
    attendanceMeta?.nextCursor ?? null,
  );
  const [hasMore, setHasMore] = useState<boolean>(
    attendanceMeta?.hasMore ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (!hasMore || !cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/me/attendance?cursor=${encodeURIComponent(cursor)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as MeAttendancePageResponse;
      setItems((prev) => [...prev, ...body.records]);
      setCursor(body.nextCursor);
      setHasMore(body.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <section aria-label="参加履歴">
        <h2>参加履歴</h2>
        <p data-state="empty">まだ参加履歴がありません。</p>
      </section>
    );
  }
  return (
    <section aria-label="参加履歴">
      <h2>参加履歴</h2>
      <ul>
        {items.map((item) => (
          <li key={item.sessionId}>
            <time dateTime={item.heldOn}>{item.heldOn}</time>
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          data-testid="attendance-load-more"
        >
          {loading ? "読み込み中…" : "もっと見る"}
        </button>
      )}
      {error && (
        <p role="alert" data-testid="attendance-load-error">
          {error}
        </p>
      )}
    </section>
  );
}
