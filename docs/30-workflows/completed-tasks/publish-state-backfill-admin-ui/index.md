# publish-state-backfill-admin-ui — タスク仕様書（Phase 1-13）

> 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`（要件 root）。
> 元タスクファイル: `../task-member-publish-recovery-form-ops-and-admin-link/tasks/A-publish-state-backfill-admin-ui.md`（Task A）。
> 本ディレクトリは Task A を Phase 1-13 の実行可能なタスク仕様書へ展開したもの。

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| 実装区分 | **実装仕様書**（CONST_004 デフォルト。コード変更を伴う UI タスク） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION`（admin UI パネルを描画する。screenshot 取得は staging auth 必須 → user-gated） |
| workflow_state | `implemented_local_evidence_captured`（**実装は PR #1064 / commit `745c95115` で dev へマージ済み**。本仕様書は landed 実装の正本記述として作成） |
| verdict | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（staging authenticated screenshot / commit / push / PR は user-gated） |
| branch | `docs/task-a-publish-state-backfill-admin-ui-spec` |
| base | `dev` |
| coverage AC | 既定 workspace 閾値（Statements/Branches/Functions/Lines >=80%、`apps/web`）を適用 |

## スコープ

`admin/sync-status` 画面に「公開状態 backfill」操作パネル（dry-run 確認 → apply 昇格）を与え、
公開同意済みで `publish_state='member_only'` のまま滞留している会員を管理者が画面操作だけで救済できる状態にする。
**API endpoint・D1 schema・Google Form schema は変更しない**（救済 endpoint `POST /admin/sync/backfill-publish-state` は実装済み・変更不要）。

## P50 既存実装状態（重要 / Phase 1 Step 0）

本タスクは **既に実装され dev へマージ済み**である。Phase 1 で `git log` / `ls` により以下を確定した:

| 成果物 | 実パス | 状態 |
|--------|--------|------|
| zod schema + 型 + path 定数 | `apps/web/src/features/admin/diagnostics/backfill.ts` | 実装済み |
| 操作パネル（client component） | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | 実装済み |
| パネル単体テスト（TC-A1..A7） | `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | 実装済み |
| schema parse/reject テスト | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 実装済み（co-located） |
| page mount | `apps/web/app/(admin)/admin/sync-status/page.tsx:6,128` | 実装済み |
| 救済 endpoint（変更不要） | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` + `apps/api/src/index.ts:287` | 実装済み |

### 元タスクファイルとの乖離補正（実コードを正本とする）

| 項目 | 元タスクファイル A の記述 | 実コード（正本） |
|------|--------------------------|------------------|
| proxy path 定数 | `"/api/admin/sync/responses?fullSync=true-publish-state"`（文字列破損） | `BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state"` |
| schema テスト配置 | 新規 `diagnostics/__tests__/backfill.spec.ts` | 既存 `diagnostics/__tests__/sync-schemas.spec.ts` に co-locate |
| apply ガード | 記述なし | dry-run 先行必須（`canApply`）+ `globalThis.confirm` 確認 |
| 結果描画 | `<table>` | `<dl>` グリッド（`grid-cols-2 md:grid-cols-4`） |
| section title | 「公開状態 backfill（救済）」 | 「公開状態 backfill」 |

> 本仕様書は **実コードを正本**とし、上記乖離を補正済みで記述する（skill P50 / CONST_004 実態優先）。

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | `phase-1.md` |
| 2 | 設計 | `phase-2.md` |
| 3 | 設計レビュー | `phase-3.md` |
| 4 | テスト作成 | `phase-4.md` |
| 5 | 実装 | `phase-5.md` |
| 6 | テスト拡充 | `phase-6.md` |
| 7 | カバレッジ確認 | `phase-7.md` |
| 8 | リファクタリング | `phase-8.md` |
| 9 | 品質保証 | `phase-9.md` |
| 10 | 最終レビュー | `phase-10.md` |
| 11 | マニュアルテスト | `phase-11.md` |
| 12 | ドキュメント | `phase-12.md` |
| 13 | PR 作成 | `phase-13.md` |

## 受け入れ基準（親 phase-1 AC-A 群）

- **AC-A1**: 管理者が `admin/sync-status` から dry-run を実行し `scanned/candidates/skipped` の内訳を確認できる。
- **AC-A2**: 管理者が apply を実行し、同意済み×member_only が public へ昇格、`applied` 件数が表示される。
- **AC-A3**: apply は admin override / is_deleted を尊重しスキップする（endpoint 仕様の踏襲）。`skipped.*` を結果に可視化する。
- **AC-A4**: mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。

## ゲート

- Phase 1-3（設計）完了まで Phase 4 以降に進まない（CONST_001）。
- コミット・PR・push はユーザー指示まで実行禁止（CONST_002）。
- 1 サイクル完結スコープ（先送り無し、CONST_007）。
