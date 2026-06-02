# Phase 12 サマリ — publish-state-backfill-admin-ui

## workflow_state

`implemented_local_evidence_captured`。Task A（公開状態 backfill 管理 UI）は PR #1064 / commit `745c95115` で dev へ実装・テスト済みでマージ済み。
本仕様書は landed 実装を Phase 1-13 の正本タスク仕様書として記述する（greenfield 新規実装ではない）。

## verdict

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local deterministic evidence と Phase 12 strict-7 は揃っており、staging authenticated screenshot / commit / push / PR のみ user-gated。

## スコープ

`admin/sync-status` 画面に「公開状態 backfill」操作パネル（dry-run 確認 → apply 昇格）を付与する **web の UI 導線のみ**。
実救済ロジックは既存 endpoint `POST /admin/sync/backfill-publish-state` に委ね、`apps/api` / D1 schema / Google Form schema は変更しない（差分 0 / 親 AC-G2）。
本レビューサイクルでは web panel の apply loading 表示のみを harden し、`activeMode` で in-flight 操作と直近結果 `mode` を分離した。

## 変更ファイル（web のみ）

- `apps/web/src/features/admin/diagnostics/backfill.ts`
- `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`
- `apps/web/app/(admin)/admin/sync-status/page.tsx`（mount）
- `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`（TC-A1..A7）
- `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（TC-B1..B4）

## key facts

| 項目 | 値 |
|------|-----|
| proxy path | `BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state"` |
| endpoint（変更不要） | `POST /admin/sync/backfill-publish-state`（`apps/api/src/routes/admin/sync-backfill-publish-state.ts`、mount `apps/api/src/index.ts:287`） |
| mutation | `@/features/admin/hooks/useAdminMutation`（不変条件 #10） |
| 色トークン | OKLch（`--ubm-color-*` / `--ubm-color-danger`）のみ（不変条件 §2） |
| apply ガード | dry-run 先行必須 + `confirm` + `isSubmittingRef` 3 重 |
| 受け入れ基準 | AC-A1..A4 充足 |

## Gate-A（spec_authoring）passed の根拠

- Phase 1-3（要件 / 設計 / 設計レビュー）を自作し、R-1..R-8 全 PASS。
- 元タスクファイルの corrupted endpoint path `?fullSync=true-publish-state` を実コード `/api/admin/sync/backfill-publish-state` へ補正済み（phase-1.md 記録）。
- AC-A1..A4 を番号付きで定義し、スコープ外（endpoint/D1/Form 不変）を固定。
- evidence: `outputs/phase-12/main.md`（本ファイル）。

## Gate-B（implementation_review）passed の根拠

- `backfill.ts` / `BackfillPublishStatePanel.client.tsx` / 2 spec / page mount が全て実在（`ls` 検証済み）。
- typecheck / lint / test が #1064 merge 前の実装 PR で green。本 wave ではその landed 実装を正本化し、追加 docs 検証を再実行する。
- mutation 規約（`useAdminMutation` 経由・legacy 不参照）/ OKLch トークン / apply ガードを実コードに一致させて記述。
- evidence: `outputs/phase-12/implementation-guide.md`。

## Gate-C（user_gated）pending

- staging authenticated screenshot 取得 / commit / push / PR 作成はユーザー承認まで blocked（CONST_002）。
- evidence: `phase-13.md`。
