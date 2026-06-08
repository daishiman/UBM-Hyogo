`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 8: リファクタリング

## 目的

Phase 5（GREEN）で定義した実装に対し、重複排除・責務集約・navigation drift の不在を確認する。本タスクは新規 pure function + scoped CSS の**追加**が主であり、既存コードの大規模な構造変更は伴わない。リファクタリングは「設計判断の記録」と「最小限の整理」に留める。

## 8.1 リファクタリング項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 出席レベル判定ロジックの配置 | `MeetingTimeline.tsx` の JSX 内にインライン三項（`count >= 10 ? "high" : count > 0 ? "normal" : "none"`）で書く案 | `meetingStats.ts` の pure function `attendanceLevel(count)` に集約 | テスト容易性（DOM render なしで境界テスト可能）+ 閾値の単一 tuning point 化。表示層から判定ロジックを分離（責務分離） |
| 閾値の定義 | マジックナンバー `10` を関数本体に直書き | `ATTENDANCE_LEVEL_THRESHOLDS = { high: 10 } as const` 定数 1 箇所に集約 | 運用後の調整を 1 行変更に限定。AC-2（閾値が定数 1 箇所に集約）を満たす |
| 強調 CSS の scope | グローバル `.ui-badge[data-attendance-level]` で定義する案 | `.admin-timeline__heading .ui-badge[data-attendance-level]` に scope | 共有 `.ui-badge`（Badge.tsx 経由含む）への波及を遮断。新規 primitive を増やさない（AC-4） |
| レベル型 | 文字列リテラルを各所で重複記述 | `AttendanceLevel = "none" | "normal" | "high"` 型を 1 箇所で定義し関数戻り値・テスト期待値で共有 | 型の単一定義源化。typo・値ずれを型で防止 |
| CSS の色値 | 各レベルで HEX 直書きや `bg-[#xxx]` で記述する案 | `var(--status-neutral-bg)` 等の既存トークン経由（`high` の文字色も `var(--ubm-color-ok)`） | `verify-design-tokens` gate 整合 + トークン正本性（AC-3）。新規トークンを増やさない |

## 8.2 重複・drift の確認

| 観点 | 確認結果 |
|------|---------|
| ロジック重複 | `attendanceLevel` は `meetingStats.ts` の 1 箇所のみに存在。`MeetingTimeline.tsx` は import して呼ぶだけで判定式を再記述しない（重複ゼロ） |
| 閾値重複 | `10` の出現は `ATTENDANCE_LEVEL_THRESHOLDS.high` の 1 箇所のみ。CSS / コンポーネント / テストは定数または関数戻り値を参照（マジックナンバー散在なし） |
| 型重複 | `AttendanceLevel` 型を 1 箇所で定義。テスト期待値も同型を満たす文字列を使う |
| navigation drift | 本タスクはルーティング・ナビゲーション・リンク導線を変更しない。`/admin/meetings` への遷移・URL・リンク構造は不変（drift なし） |
| 既存テスト drift | `MeetingTimeline.spec.tsx` の既存 6 ケース、`meetingStats.spec.ts` の既存ケースは assertion を変更せず追加のみ。`attendanceLabel` / `data-testid` / `ui-badge` className が不変であることを既存ケースが引き続き検証 |

## 8.3 設計判断の記録

- **インライン三項を採らず pure function へ集約した理由**: `MeetingTimeline.tsx` の JSX に閾値判定を埋め込むと、(1) DOM render を経由しないと境界テストできず、(2) 閾値変更時に表示層を触る必要が生じる。`meetingStats.ts` の pure function 化により、境界テスト（A-1..A-7）が render なしで完結し、閾値は `ATTENDANCE_LEVEL_THRESHOLDS` の 1 行で調整できる。判定（meetingStats）/ 表示（MeetingTimeline）/ 配色（globals.css）の責務が三分される。
- **CSS を scope した理由**: 共有 `.ui-badge` 既定スタイルを変更せず、`.admin-timeline__heading` 配下の出席バッジにのみ強調を適用することで、他画面・他バッジへの意図しない波及を構造的に防ぐ。これにより新規 primitive を作らずに enhancement を閉じ込める。

## 8.4 リファクタリング後の整合

リファクタリング（= 配置・集約の設計判断）を反映しても、Phase 6 のテスト（A-1..A-7 / B-1..B-3）の期待値・既存 6 ケースは変わらない。本フェーズの整理は同一サイクルの実装に適用済みであり、Phase 6 テスト green を維持している。
