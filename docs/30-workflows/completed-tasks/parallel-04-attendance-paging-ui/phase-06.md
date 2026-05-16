# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | completed |

## 目的

T1-T5 をコードに落とすための具体的手順を、後続実装者がそのまま実装できる粒度で記述する。

## T1: `me-types.ts` への型追加

**対象**: `apps/web/src/lib/api/me-types.ts`

```ts
export interface MeAttendanceRecord {
  readonly sessionId: string;
  readonly title: string;
  readonly heldOn: string;
}

export interface MeAttendanceMeta {
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}

export interface MeAttendancePageResponse {
  readonly records: ReadonlyArray<MeAttendanceRecord>;
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}
```

`MemberProfile` interface の `attendance` / `attendanceMeta` フィールドが既に存在しない場合は併せて追加。

## T2: `AttendanceList.tsx` 新規作成

**対象**: `apps/web/app/profile/_components/AttendanceList.tsx`

骨格:

```tsx
"use client";

import { useState } from "react";
import type { MemberProfile, MeAttendancePageResponse } from "@/lib/api/me-types";

export interface AttendanceListProps {
  readonly attendance: MemberProfile["attendance"];
  readonly attendanceMeta?: MemberProfile["attendanceMeta"];
}

type Item = MemberProfile["attendance"][number];

export function AttendanceList({ attendance, attendanceMeta }: AttendanceListProps): JSX.Element {
  const [items, setItems] = useState<Item[]>(() => [...attendance]);
  const [cursor, setCursor] = useState<string | null>(attendanceMeta?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState<boolean>(attendanceMeta?.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/attendance?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as MeAttendancePageResponse;
      setItems((prev) => [...prev, ...body.records]);
      setCursor(body.nextCursor);
      setHasMore(body.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-[var(--ubm-color-text-muted)]">まだ参加履歴がありません</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.sessionId}>
            <span>{item.heldOn}</span> — <span>{item.title}</span>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-[var(--ubm-color-danger)]">{error}</p>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "読み込み中…" : "もっと見る"}
        </button>
      )}
    </div>
  );
}
```

JSDoc 先頭に `/** issue-372: cursor paging UI */` を含める。

## T3: `profile/page.tsx` 配線

**対象**: `apps/web/app/profile/page.tsx`

- 既存 `fetchAuthed<MemberProfile>("/me/profile")` の戻り値から `attendance` / `attendanceMeta` を取り出す
- `<AttendanceList attendance={profile.attendance} attendanceMeta={profile.attendanceMeta} />` を render
- `export const dynamic = "force-dynamic"` を確認（既存維持）

## T4: 単体テスト

**対象**: `apps/web/app/profile/_components/AttendanceList.spec.tsx`

ケース:
1. 初期 props → items / cursor / hasMore が正しく初期化
2. button click → `fetch` mock が `?cursor=xxx` を含む URL で呼ばれる
3. fetch 成功 → records が items に append、cursor 更新
4. `nextCursor: null` レスポンス → ボタン非表示
5. fetch 失敗 → `role="alert"` で error 表示、button 再 enable
6. loading 中 → button disabled / text="読み込み中…"
7. `items.length === 0` → empty message

`global.fetch` を `vi.fn()` でモック。`@testing-library/react` の `render` / `screen` / `fireEvent` を使用。

## T5: smoke test 確認

`apps/web/app/profile/page.spec.tsx`（既存）で AttendanceList が render されることを確認。assertion が不足していれば追加。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | 実装手順 |

## 完了条件

- [x] T1-T5 ごとに対象ファイル・差分方針・最終コード骨格が記述

## 次 Phase

- 次: 7 (テスト計画)
