# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 3 / 13 |
| 前提 | Phase 1（要件）/ Phase 2（設計）完了 |
| 判定 | **PASS**（Phase 4 へ進行可） |

## 目的

Phase 2 設計が AC-A1..A4・不変条件・既存実装と矛盾しないことをレビューし、Phase 4 開始条件を確定する。

## 実行タスク

1. AC-A1..A4、不変条件、既存実装との矛盾有無をレビューする。
2. simpler alternative を検討し、不採用理由を記録する。
3. 上流ブロッカーと Phase 4 開始条件を明確化する。
4. commit / push / PR / staging screenshot の user-gated 境界を再掲する。

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
|---|------|------|------|
| R-1 | endpoint/D1/Form schema 不変（親 AC-G2） | PASS | 変更対象は web のみ（`backfill.ts` / panel / page mount / 2 spec）。`apps/api` 差分 0 |
| R-2 | mutation 規約（AC-A4 / 不変条件 #10） | PASS | `@/features/admin/hooks/useAdminMutation` 経由。legacy `@/lib/useAdminMutation` 不参照 |
| R-3 | OKLch トークンのみ（不変条件 §2） | PASS | `text-[var(--ubm-color-*)]` / `--ubm-color-danger` のみ。HEX / `bg-[#...]` / inline style なし |
| R-4 | 新規 primitive を増やさない（不変条件 §3 / #9） | PASS | 既存 `Button` / `AdminSectionCard` のみ。`src/components/admin/` に `<input>` を増やさない |
| R-5 | apply の破壊性ガード | PASS | dry-run 先行（`canApply`）+ `confirm` + `isSubmittingRef` の 3 重 |
| R-6 | schema mismatch / HTTP error の分離 | PASS | `safeParse` 失敗 → `parseError`、HTTP error → `mutation.error`。両者結果非描画 |
| R-7 | AC-3 可視化（skipped 内訳） | PASS | `skipped.{alreadyPublic,adminExplicit,consentNotMet,deleted}` を `<dl>` 各行に描画 |
| R-8 | 認証経路依存（proxy Authorization 注入） | PASS（依存明記） | Task B に集約済み。本タスクは proxy を変更しない |

## simpler alternative 検討

| 案 | 結論 |
|----|------|
| dry-run / apply で hook を 2 つに分ける | 不採用。`endpointOverride` で 1 hook に集約でき state も単純化 |
| 結果を `<table>` で描画 | 不採用。`<dl>` グリッドで label/value 構造が semantics・レスポンシブ（`md:grid-cols-4`）に適合 |
| apply に dry-run 前提を課さない | 不採用。誤操作（候補 0 で apply）防止のため dry-run 先行を必須化 |

## MINOR 追跡

| MINOR ID | 指摘 | 解決Phase | 確認Phase |
|----------|------|-----------|-----------|
| （なし） | — | — | — |

## gate 重複明記（上流ブロッカー）

- **Phase 1（前提条件）**: 救済 endpoint 実装済み・proxy Authorization 注入は Task B 依存。
- **Phase 2（依存順序）**: Task B の proxy 変更が先行している前提。
- **Phase 3（NO-GO 条件）**: proxy が `Authorization` を server-only 注入していない場合、ブラウザ素 fetch は 401 で到達不能 → 実行時 NO-GO。本タスク単独では proxy を変更しない。

## Phase 4 開始条件

- [x] R-1..R-8 全 PASS。
- [x] MAJOR なし。
- [x] Phase 1-3（設計）完了 → Phase 4 着手可。

## Phase 13 blocked 条件

- commit / push / PR / staging screenshot はユーザー承認まで blocked（CONST_002）。

## 統合テスト連携

- 3 層整合（endpoint D1 spec / web schema spec / panel spec）を Phase 4 で具体ケース化する。

## 参照資料

| 参照 | パス |
|------|------|
| 要件定義 | `./phase-1.md` |
| 設計 | `./phase-2.md` |
| panel 実装 | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` |
| web schema | `apps/web/src/features/admin/diagnostics/backfill.ts` |

## 多角的チェック観点（AIが判断）

- `confirm` モック漏れで apply テストが flaky にならないか（Phase 4 で `vi.spyOn(globalThis, "confirm")`）。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| RV-1 | 不変条件適合レビュー | PASS |
| RV-2 | simpler alternative 検討 | 完了 |

## 成果物

- 本レビューファイル（判定 PASS / gate）。

## 完了条件

- [x] 全観点 PASS、MAJOR なし。
- [x] Phase 4 開始条件・Phase 13 blocked 条件を明記。

## タスク100%実行確認【必須】

- [x] PASS/MINOR/MAJOR の戻り先を明示。
- [x] simpler alternative を記録。

## 次Phase

Phase 4（テスト作成）。**設計フェーズ（1-3）完了。以降の Phase 4-13 はテスト/実装/品質/レビュー/ドキュメント。**
