# Phase 11 Manual Test Result

## Summary

Status: `implemented_local_evidence_captured / runtime_visual_pending_user_gate`.

durationMs のコード実装は本ブランチで完了済み。ここでは自動証跡（focused Vitest / typecheck / lint）と、
VISUAL の runtime screenshot 取得境界を記録する。実 PNG は admin 認証・`SYNC_ADMIN_TOKEN` runtime 構成・実 resync
実行が必要なため user-gated のまま残す。

## 証跡メタ（[Feedback 4] NON_VISUAL 補足ではなく VISUAL 宣言）

- **タスク種別**: VISUAL（結果 `<dl>` に `durationMs` 行を追加する UI 変更）
- **主証跡ソース（取得済み）**: 自動テスト
  - panel: `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx`（durationMs 行表示 / 欠落 fallback）
  - schema: `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（`SyncResultSchema` の durationMs 受理・`.strict()` 維持）
  - backend: `apps/api/src/jobs/__tests__/sync-forms-responses.*.spec.ts`（succeeded/failed/skipped 3 経路で durationMs 返却）
  - contract: `apps/api/src/routes/admin/responses-sync.contract.spec.ts`（durationMs 込み result 素通し）
- **runtime screenshot を今作らない理由**: admin 認証ブラウザ状態・`SYNC_ADMIN_TOKEN` runtime 構成・実 resync 実行がすべて必要で user-gated のため。

## Automated Evidence（local 取得済み）

| Command | Evidence | Result |
|---|---|---|
| `pnpm exec vitest run apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts --config vitest.config.ts` | command output | PASS（2 files / 22 tests） |
| `pnpm exec vitest run apps/api/src/jobs/sync-forms-responses.contract.spec.ts apps/api/src/routes/admin/responses-sync.contract.spec.ts --config vitest.d1.config.ts` | command output | PASS（2 files / 26 tests） |
| `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/api typecheck` | command output | PASS |
| `pnpm lint` | command output | PASS |

## Runtime Visual

Pending。必要 screenshot は `screenshot-plan.json`（`manual-form-resync-panel-result-with-duration.png`）に定義。capture は user-gated。
