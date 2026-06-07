`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 5: 実装（GREEN）

## 目的

Phase 4 で RED にしたテストを GREEN へ遷移させる最小実装を定義し、同一サイクルで実コードへ反映した。ここに記す before/after は今回実装済みの正本コードである。

## 変更ファイル一覧

| 区分 | パス |
|------|------|
| 修正 | `apps/web/src/features/admin/components/_meetings/meetingStats.ts` |
| 修正 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` |
| 修正 | `apps/web/src/styles/globals.css` |
| 修正 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` |
| 修正 | `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` |

**新規ファイルは無し**（全て既存ファイルへの編集）。

## 1. `meetingStats.ts`（閾値定数・型・pure function の追加）

既存 export 群はそのまま。末尾に以下を追加する。

```ts
// after（追加分）
export const ATTENDANCE_LEVEL_THRESHOLDS = { high: 10 } as const;

export type AttendanceLevel = "none" | "normal" | "high";

export function attendanceLevel(count: number): AttendanceLevel {
  if (!Number.isFinite(count) || count <= 0) {
    return "none";
  }
  if (count >= ATTENDANCE_LEVEL_THRESHOLDS.high) {
    return "high";
  }
  return "normal";
}
```

- pure function: 入力 `count` のみに依存し副作用・例外を持たない。
- 防御順: 非有限（`NaN` 等）と `count<=0` を先に `"none"` へ畳む → `>= 10` を `"high"` → 残りを `"normal"`。これにより負数・NaN が `"normal"` や `"high"` に漏れない。

## 2. `MeetingTimeline.tsx`（バッジへの data 属性付与）

import に `attendanceLevel` を追加し、出席人数バッジ span（57 行付近）へ `data-attendance-level` を付与する。`attendanceCount` は既存 34 行で算出済みの値を使う。

```tsx
// before（import）
import { /* 既存 named imports */ } from "./meetingStats";

// after（import に attendanceLevel を追加）
import { /* 既存 named imports */, attendanceLevel } from "./meetingStats";
```

```tsx
// before（57 行付近のバッジ span）
<span className="ui-badge" data-testid={/* 既存 meeting-attendance-count-... */}>
  {attendanceLabel}
</span>

// after（data-attendance-level を追加）
<span
  className="ui-badge"
  data-testid={/* 既存 meeting-attendance-count-... */}
  data-attendance-level={attendanceLevel(attendanceCount)}
>
  {attendanceLabel}
</span>
```

- `className`（`ui-badge`）・`data-testid`・`attendanceLabel`（表示テキスト）は不変。追加するのは `data-attendance-level` 属性のみ。
- import の named import 列は既存の順序・要素を保持したまま `attendanceLevel` を追記する。

## 3. `globals.css`（`@layer components` への色強調ルール追加）

`.admin-timeline__heading` で scope し、共有 `.ui-badge` への波及を遮断する。採用トークンは全て `tokens.css` に既存（新規トークンなし）。

```css
/* after（@layer components 内に追加） */
.admin-timeline__heading .ui-badge[data-attendance-level] {
  border-radius: 6px;
  font-weight: 700;
  padding: 2px 8px;
}

.admin-timeline__heading .ui-badge[data-attendance-level="none"] {
  background: var(--status-neutral-bg);
  color: var(--ubm-color-text-secondary);
}

.admin-timeline__heading .ui-badge[data-attendance-level="normal"] {
  background: var(--ubm-color-accent-soft);
  color: var(--ubm-color-accent-ink);
}

.admin-timeline__heading .ui-badge[data-attendance-level="high"] {
  background: var(--status-success-bg);
  color: var(--ubm-color-ok);
}
```

- `oklch()` 直値（`high` の `color`）は `verify-design-tokens` gate で許容される。禁止対象は HEX（`#xxx`）/ `bg-[#xxx]` / `text-[#xxx]` のみ。先例: `.admin-tag-status-badge[data-status="confirmed"]`。
- `.admin-timeline__heading` で限定することで、admin 以外や他コンテキストの `.ui-badge` には影響しない（scope による波及遮断）。

## 4 / 5. テスト追記（Phase 4 のケースを実装）

- `__tests__/meetingStats.spec.ts`: A-1..A-7（0/1/9/10/25/-3/NaN）の境界テストを追加。既存テストは不変。
- `__tests__/MeetingTimeline.spec.tsx`: B-1..B-3（0/5/12 名で `data-attendance-level` が `none`/`normal`/`high`）を追加。既存 6 ケースは不変。

## 実装メモ

- **アクセシビリティ / モーション**: 本変更は色（background / color）の静的強調のみで animation・transition を持たない。したがって `prefers-reduced-motion` 対応は不要（AC-6 を満たす）。
- 色のコントラストは tokens.css 既存ペア（`--status-*-bg` ＋テキスト色）に準拠し、`high` のみテキストに OKLch 直値を用いて成功背景上で十分な可読性を確保する。
- IPC / Preload / canUseTool 等のブリッジ機構は本タスクと無関係であり、本フェーズで触れない。

## GREEN 確認

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts
```

期待: Phase 4 で RED だった 10 ケースを含め全 PASS（GREEN）。
