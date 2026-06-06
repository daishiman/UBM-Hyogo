# Phase 12 — Task Spec Compliance Check

> issue-1089-backfill-impact-preview の実装 close-out 証跡（root evidence / Task 12-6）。
> 本 workflow は Phase 1〜13 の仕様書作成後、同一 cycle で `apps/api` / `apps/web` 実装と focused tests まで完了した。

## 1. Summary verdict

- **verdict: PASS（implemented_local_runtime_pending）**
- issue #1089「全件 backfill 承認前の影響件数プレビュー」は現行コードへ実装済み。
- `ResponseSyncPreview` / `previewResponseSync` / `POST /admin/sync/responses?dryRun=true` / frontend preview schema / `ManualFormResyncPanel` staged UI を追加。
- runtime screenshot、staging deploy、`SYNC_ADMIN_TOKEN` 投入、commit、push、PR は user-gated。

## 2. Changed-files classification

| 分類 | パス | 種別 |
|------|------|------|
| backend implementation | `apps/api/src/jobs/sync-forms-responses.ts` | `ResponseSyncPreview` / `previewResponseSync` / shared helpers |
| backend route | `apps/api/src/routes/admin/responses-sync.ts` | `?dryRun=true` preview 分岐 |
| frontend schema | `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` |
| frontend UI | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | preview button / count panel / `canBackfill` gate |
| tests | backend 2 files + frontend 2 files | preview contract / route / schema / staged UI |
| docs | workflow root + `outputs/phase-12/*` | strict 7 / system spec sync / feedback |

## 3. `workflow_state` and phase status consistency

| 項目 | 値 |
|------|-----|
| `workflow_state` | `implemented_local_runtime_pending` |
| `implementation_mode` | `new` |
| `implementation_status` | `implemented_local` |
| Gate-A | passed（phase-3.md・4 条件評価 + D7 再判断 DD3） |
| Gate-B | passed（実装 + focused test + Phase 12 strict 7） |
| Gate-C | pending（runtime screenshot / staging deploy / `SYNC_ADMIN_TOKEN` / commit / PR = user-gated） |
| artifacts parity | root と `outputs/artifacts.json` を同期対象 |

## 4. Phase 11 evidence file inventory

| Path | status |
| --- | --- |
| `outputs/phase-11/manual-form-resync-panel-default.png` | present |
| `outputs/phase-11/manual-form-resync-panel-preview-result.png` | present |
| `outputs/phase-11/manual-form-resync-panel-backfill-confirm.png` | present |
| `outputs/phase-11/manual-form-resync-panel-preview-error.png` | present |

authenticated runtime screenshot は admin 認証と `SYNC_ADMIN_TOKEN` が必要なため pending。主証跡は static UI contract PNG、backend contract、route contract、frontend schema、UI component tests。focused backend/frontend tests（backend 2 files + frontend 2 files）は `apps/` 配下の実コードに対する証跡であり Phase 11 evidence file inventory（root 配下）の対象外。

## 5. Phase 12 strict 7 file inventory

| # | 成果物 | 状態 |
|---|--------|------|
| 1 | `main.md` | present |
| 2 | `implementation-guide.md` | present |
| 3 | `system-spec-update-summary.md` | present |
| 4 | `documentation-changelog.md` | present |
| 5 | `unassigned-task-detection.md` | present |
| 6 | `skill-feedback-report.md` | present |
| 7 | `phase12-task-spec-compliance-check.md` | present |

## 6. Skill/reference/system spec same-wave sync

- `aiworkflow-requirements` API 正本に `POST /admin/sync/responses?dryRun=true` を追加。
- `aiworkflow-requirements` changelog に本実装の same-wave sync を追加。
- `task-specification-creator` changelog に spec-created から implemented-local へ昇格する運用を記録。

## 7. Runtime or user-gated boundary

| 区分 | 項目 |
|------|------|
| user-gated | `SYNC_ADMIN_TOKEN` Cloudflare Secrets 投入 / authenticated runtime screenshot / staging deploy / commit / push / PR |
| 本 workflow で実施済 | code implementation / focused tests / Phase 12 strict 7 / system spec sync |

## 8. Archive/delete stale-reference gate

- 新規 workflow のため archive / delete 対象なし。
- 古い `spec_created` / `spec_only` 記述は本 Phase 12 で実装済みローカル状態へ補正する。
- 既存 source issue は CLOSED のまま扱い、Issue mutation は行わない。

## 9. Four-condition verdict

| 条件 | 評価 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | 実装済み状態と成果物台帳を同期し、`spec_created` 前提を排除 |
| 漏れなし | PASS | strict 7、API 正本、skill feedback、未タスク検出を物理ファイル化 |
| 整合性あり | PASS | dry-run は opt-in 追加で既存 `?fullSync` / `SyncResultSchema` を破壊しない |
| 依存関係整合 | PASS | `apps/web` は zod 再宣言のみで `apps/api` 直接 import なし。runtime screenshot は user-gated |

> **総合: 4 条件すべて充足。implemented_local_runtime_pending として close-out。**
