`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 9: 品質保証

## 目的

本タスク（issue #1112 出席人数バッジ 3 段階色強調）の品質ゲートを定義し、local 実行結果を記録する。typecheck / HEX 不在検証 / `verify-design-tokens` gate / 既存テスト非回帰 / link 整合を対象とする。

## 9.1 品質検証コマンドと期待結果

| # | 検証 | コマンド | 期待結果 |
|---|------|---------|---------|
| Q-1 | 型チェック | `pnpm --filter @ubm-hyogo/web typecheck` | PASS。`attendanceLevel` の戻り型 `AttendanceLevel`、`ATTENDANCE_LEVEL_THRESHOLDS` の `as const`、`data-attendance-level` の値型が整合 |
| Q-2 | lint | `mise exec -- pnpm lint`（必要に応じ `pnpm lint --fix`） | 違反 0。import 追加（`attendanceLevel`）・未使用なし・整形整合 |
| Q-3 | HEX 不在 grep（追加 CSS） | `rg -n "#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#" apps/web/src/styles/globals.css` の**追加行**部分 | 追加行に 0 ヒット（`var(--token)` と `oklch()` 直値のみ使用） |
| Q-4 | design-tokens gate | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS。禁止対象（HEX / `bg-[#xxx]` / `text-[#xxx]`）の新規混入なし |
| Q-5 | targeted test 非回帰 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` | 全 PASS。既存 6 ケース（MeetingTimeline）+ 既存 meetingStats ケースが drift せず、追加 A-1..A-7 / B-1..B-3 が GREEN |
| Q-6 | link / 参照整合 | 仕様書内パス・トークン名（`--status-neutral-bg` / `--status-success-bg` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--ubm-color-text-secondary`）が `tokens.css` に実在 | 全トークンが `apps/web/src/styles/tokens.css` に存在（design-tokens.md 不変） |

## 9.2 HEX 不在検証の詳細（Q-3）

追加する `globals.css` の出席バッジ強調規則は以下のみを使う:

- 背景: `var(--status-neutral-bg)` / `var(--ubm-color-accent-soft)` / `var(--status-success-bg)`
- 文字色: `var(--ubm-color-text-secondary)` / `var(--ubm-color-accent-ink)` / `var(--ubm-color-ok)`

追加行に `#`（HEX）/ `bg-[#...]` / `text-[#...]` を**一切含まない**。

## 9.3 既存テスト非回帰の保証（Q-5）

- `MeetingTimeline.spec.tsx` 既存 6 ケース（empty / click / testid / 人数表示 / 0 名 / getAttendanceCount 優先）は assertion 不変。追加は B-1..B-3 のみ。
- `meetingStats.spec.ts` 既存ケース不変。追加は A-1..A-7 のみ。
- `attendanceLabel` / `data-testid`（`meeting-attendance-count-...`）/ `ui-badge` className を変更しないため、既存の表示・配線アサーションは drift しない。

## 9.4 verify-design-tokens gate の整合（Q-4）

| 項目 | 確認 |
|------|------|
| 新規トークン追加 | なし（既存トークンのみ参照） |
| `design-tokens.md` 変更 | なし（不変） |
| HEX / ブラケット任意値色 | なし |
| `oklch()` 直値 | 新規追加なし |

→ `verify-design-tokens` は PASS。

## 9.5 local 実行結果

| 検証 | 結果 |
| --- | --- |
| focused Vitest | 2 files / 20 tests PASS |
| web typecheck | PASS |
| web verify-design-tokens | PASS |
| 追加 CSS の HEX / bracket arbitrary color grep | 追加行 0 件 |

`pnpm --filter @ubm-hyogo/web lint` は全 web lint を含むため後段で実行対象に残す。今回の実装範囲は focused test / typecheck / design-token gate で local PASS を確認済み。
