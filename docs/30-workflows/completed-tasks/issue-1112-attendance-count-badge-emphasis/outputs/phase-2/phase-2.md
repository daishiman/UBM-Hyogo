# Phase 2 — 設計

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 2.1 要件レビュー（一次結論：4 条件）

| 条件 | 評価 |
| --- | --- |
| 価値性 | 運用者が複数開催回を一覧スキャンする際、出席の多寡を色で即判別でき認知コストを下げる。コストはバッジ 1 箇所の表示層変更のみで小さい |
| 実現性 | 5 ファイル編集（pure function + 属性 + scoped CSS + test ×2）。新規ファイル・新規トークン・新規 primitive ゼロ。1 サイクル完了可能（CONST_007） |
| 整合性 | 判定（`meetingStats.ts` pure function）/ 表示（`MeetingTimeline.tsx` 属性）/ 配色（`globals.css` scoped style）/ トークン（`tokens.css` 既存）の責務が分離。集計ロジックには触れない |
| 運用性 | 閾値は定数 1 箇所（`ATTENDANCE_LEVEL_THRESHOLDS`）で調整可能。pure function 化により境界テストが容易。`verify-design-tokens` gate と非干渉（新規トークン無し） |

### 真の論点

「多数出席」の閾値が未定義（親 Phase 10 §10.6 / issue 苦戦箇所）。**恣意的な絶対値だと強調が常時点灯／常時消灯し演出として機能しない**のが主問題。
→ 解決策: 閾値を pure function 内の**名前付き定数 1 箇所**に集約し、起点デフォルトを小規模会の実態に合わせて設定し、運用後の調整を 1 行変更で可能にする。

## 2.2 出席レベル判定の設計（`meetingStats.ts`）

```ts
/** 出席人数バッジの強調レベル。color emphasis の閾値はここに集約する（単一 tuning point）。 */
export const ATTENDANCE_LEVEL_THRESHOLDS = {
  /** この人数以上を「多数出席（high）」として強調する。小規模会の起点デフォルト=10。運用後はこの値のみ調整する。 */
  high: 10,
} as const;

export type AttendanceLevel = "none" | "normal" | "high";

/**
 * 出席人数を 3 段階の強調レベルへ写像する pure function。
 * - count <= 0 → "none"（未登録）
 * - count >= ATTENDANCE_LEVEL_THRESHOLDS.high → "high"（多数出席・強調）
 * - それ以外 → "normal"（通常）
 * 防御的に負数・NaN も "none" 側へ倒す（例外を投げない・WEEKGRD-02）。
 */
export function attendanceLevel(count: number): AttendanceLevel {
  if (!Number.isFinite(count) || count <= 0) return "none";
  if (count >= ATTENDANCE_LEVEL_THRESHOLDS.high) return "high";
  return "normal";
}
```

### 閾値根拠（high=10 の決定）

- UBM 兵庫支部会は小規模会（会員規模小・開催 12 回程度）。0 名（未登録）と少数（数名）と二桁（盛況回）の 3 段が運用者の関心に対応する。
- 絶対値 10 を起点デフォルトとし、`ATTENDANCE_LEVEL_THRESHOLDS.high` 1 箇所で調整可能にする。実出席分布が判明したら定数のみ変更すればよく、ロジック・CSS・テスト構造は不変。
- 相対閾値（開催平均比など）は本タスクでは採用しない。理由: 開催数が少ない段階では平均が不安定で、強調の点灯条件が読みにくくなる。絶対値の方が運用者にとって解釈が一意。

## 2.3 バッジ属性の設計（`MeetingTimeline.tsx`）

バッジ span（57 行付近）を以下へ変更する。`className` / `data-testid` / 表示テキスト（`attendanceLabel`）は不変。

```tsx
// 変更前
<span className="ui-badge" data-testid={`meeting-attendance-count-${m.sessionId}`}>
  {attendanceLabel}
</span>

// 変更後
<span
  className="ui-badge"
  data-attendance-level={attendanceLevel(attendanceCount)}
  data-testid={`meeting-attendance-count-${m.sessionId}`}
>
  {attendanceLabel}
</span>
```

- `attendanceCount` は既存 34 行（`getAttendanceCount?.(m) ?? m.attendance?.length ?? 0`）をそのまま入力に使う。
- import に `attendanceLevel` を `./meetingStats` から追加する（`MeetingItem` と同じ import 元）。

## 2.4 強調 CSS の設計（`globals.css` `@layer components`）

正本パターン `.admin-tag-status-badge[data-status]`（1124-1150 行）を踏襲し、**`.admin-timeline__heading` でスコープ**して共有 `.ui-badge`（Badge.tsx 経由含む）への波及を遮断する。

```css
/* 出席人数バッジ 強調（issue-1112）— .admin-timeline__heading にスコープし共有 .ui-badge へ波及させない */
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

### トークン採用表（すべて既存・新規追加なし）

| level | background token | color | 出典 |
| --- | --- | --- | --- |
| none（未登録） | `--status-neutral-bg` | `--ubm-color-text-secondary` | tokens.css 既存。控えめなニュートラル |
| normal（通常） | `--ubm-color-accent-soft` | `--ubm-color-accent-ink` | tokens.css 既存。既定のブランドアクセント |
| high（多数出席） | `--status-success-bg` | `--ubm-color-ok` | 既存 status token の組み合わせで盛況を成功色として強調 |

> `high` の文字色は実装と同じ `var(--ubm-color-ok)` を正本とする。HEX / `bg-[#xxx]` / `text-[#xxx]` / 新規 token は追加しない。

### スコープ判断（invariant #3 / 苦戦箇所対策）

- `.ui-badge` 自体には基底 CSS が無く、Badge.tsx は別途 tone class を当てる。共有 `.ui-badge` セレクタを無条件で変えると Badge primitive の全用途へ波及するリスクがある。
- そのため `.admin-timeline__heading` 子孫セレクタで囲い、**admin 開催日タイムラインのバッジだけ**に強調を適用する。新規 primitive・新規 class は生やさず、`data-attendance-level` 属性 variant に閉じる。

## 2.5 既存コンポーネント再利用可否（FB-SDK-07-1）

- 新規 UI コンポーネント / primitive はゼロ。既存 `.ui-badge` span に属性を足し、既存 `.admin-timeline__heading` スコープと既存トークンで構成する。再利用優先を満たす。

## 2.6 状態所有権・データフロー

```
m.attendance / getAttendanceCount  →（既存）attendanceCount: number
attendanceCount → attendanceLevel(count): "none"|"normal"|"high"   [meetingStats.ts: pure]
attendanceLevel → data-attendance-level 属性                        [MeetingTimeline.tsx: 表示]
data-attendance-level → 背景/文字色                                  [globals.css: 配色]
```

- 集計（attendance 件数）の所有権は既存ロジック。本タスクは「count → level → 色」の写像のみを追加し、集計には触れない。

## 2.7 prefers-reduced-motion（AC-6）

本タスクは色のみの静的変更で transition / animation を一切含まないため `prefers-reduced-motion` 対応は不要。Phase 5 実装メモにこの判断を明記する。
