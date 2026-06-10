# リファクタリングログ — admin-meeting-bulk-attendance-select

本仕様の正本は [phase-8-refactor.md](../../phase-8-refactor.md)。本書は対象/Before/After/採否を要約する（[Feedback RT-03]）。

## リファクタ判定サマリ

| # | 対象 | Before | After | 理由 | 採否 |
| --- | --- | --- | --- | --- | --- |
| 1 | 選択ロジック（AC-9） | checklist / modal が各自 `useState<Set>` + toggle + 絞込を持つ | 両 UI が `useBulkAttendanceSelection` を別 instance で共有 | 選択・絞込・全選択・stale 除去の単一定義。重複排除 | **採用（hook 集約）** |
| 2 | 失敗メッセージ（[WEEKGRD-02]） | Shell `onBulkAdd` 内でインライン整形 | `bulk-attendance-message.ts` の `bulkFailureMessage(summary)` 純関数 | unit test 可能化（100% 目標）・例外なし文字列返却・SRP | **採用（純関数分離）** |
| 3 | 不変条件 #10（mutation 標準） | — | Shell 内 `importAttendance` 直呼びを許容 | import は HTTP 200 で業務失敗（`committed:false`）を返し mutation 抽象に合わない。既存 `removeAttendance` も Shell raw 構築の前例 | **採用（Shell 直呼び・注記）** |
| 4 | 命名一貫性（[FB-SDK-07-4]） | — | PascalCase component / camelCase hook・関数 / `bulk-attendance-*` testid / `.spec` test | Phase 1 §5 実測規約に整合 | **確認のみ** |
| 5 | Checkbox 責務（SRP） | — | controlled presentational に限定（state を持たない） | 選択ロジックは hook 側。トークン準拠の薄い primitive | **確認のみ（現状維持）** |

## 不変条件 #10 設計判断注記

- 標準: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由。
- 本 API の特異性: 一括取込 endpoint は **HTTP 200 で業務的失敗（`committed:false`）を返す**（all-or-nothing）。`useAdminMutation` の HTTP ステータス基準の成否判定では 200 かつ未 commit（attended 不変・選択保持・内訳トースト）を表現できない。
- 結論: レスポンス本文の `committed` / `summary` を直接読む必要があるため `MeetingsClientShell` 内で `importAttendance` を直呼びする。legacy `@/lib/useAdminMutation` への新規参照は増やさない。

## 回帰確認コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```
