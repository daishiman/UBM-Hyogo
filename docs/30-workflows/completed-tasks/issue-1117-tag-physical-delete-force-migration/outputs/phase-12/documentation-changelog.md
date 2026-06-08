# ドキュメント更新履歴 — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## 更新サマリー

Issue #1117（= issue-1070 followup-001）の参照付き tag 強制移行 + 物理削除を **implemented_local_evidence_captured** として作成・実装した。本サイクルで workflow spec、`apps/api` コード実装、focused D1 Vitest、正本 API spec 書き込み、aiworkflow ledger sync を完了した。staging runtime、production mutation、commit / push / PR は user-gated。

## 各 Step の結果（FB-BEFORE-QUIT-003: workflow-local / global skill sync を分離記録）

### workflow-local 同期（本サイクルで実施・spec 作成）

| Step | 対象 | 結果 |
| --- | --- | --- |
| Step 1-A | 正本 spec（`specs/01-api-schema.md`）同期 | **完了**。`?migrateTo` endpoint / error code 3 種 / audit action / 不変条件を `01-api-schema.md` へ反映 |
| Step 1-B | 実装状況記録 | **完了**。`apps/api` 4 ファイル + 正本 spec + aiworkflow references を本サイクルで更新 |
| Step 1-C | 検証記録 | **完了**。focused D1 Vitest / typecheck / lint を実測 |
| Step 2 | 依存関係整合（新規インターフェース追加） | **該当**。repository 関数 2 + error code 3 + audit action 1 + query param `migrateTo` を追加。issue-1070 既存契約との整合を `system-spec-update-summary.md` §Step 2 に記録 |

### global skill sync（本サイクル実施）

| 対象 | 結果 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | **完了**。`issue-1117-tag-physical-delete-force-migration` を active ledger へ登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1117-tag-physical-delete-force-migration-artifact-inventory.md` | **完了**。local implementation / evidence / user-gated 境界を新規登録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | **完了**。`pnpm indexes:rebuild` で再生成 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | **N/A**。現行 `generate-index.js` の生成対象外。必要導線は task-workflow-active + artifact inventory + topic/keyword index に配置 |
| `docs/30-workflows/LOGS.md` / SKILL-changelog | **N/A**。本変更は workflow 実装同期であり、skill template 自体の変更なし |

> implementation target が明確なため、skill close-out sync は本サイクルで実施した。commit / push / PR と external runtime のみ user-gated。

## 作成・更新ファイル（本サイクル）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-1117-tag-physical-delete-force-migration/index.md` | 作成 | workflow index（メタ・最適化・スコープ・フェーズ構成） |
| `.../artifacts.json` / `.../outputs/artifacts.json` | 作成 | artifacts（root / outputs superset） |
| `.../outputs/phase-1/phase-1.md` 〜 `phase-10/phase-10.md` | 作成 | Phase 1-10 spec |
| `.../outputs/phase-11/manual-test-result.md` | 作成 | NON_VISUAL 宣言 + focused D1 Vitest 実測 |
| `.../outputs/phase-12/main.md` | 作成 | Phase 12 概要 + Task 12-1〜12-6 実施状況 |
| `.../outputs/phase-12/implementation-guide.md` | 作成 | Part 1 概念 / Part 2 技術 |
| `.../outputs/phase-12/system-spec-update-summary.md` | 作成 | 正本 spec 同期差分（Step 1-A/1-B/1-C/Step 2） |
| `.../outputs/phase-12/documentation-changelog.md` | 作成 | 本ファイル |
| `.../outputs/phase-12/unassigned-task-detection.md` | 作成 | 未タスク検出（current 0 / baseline 参照） |
| `.../outputs/phase-12/skill-feedback-report.md` | 作成 | FB-I1117-001..005 |
| `.../outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成 | compliance check（canonical 9 見出し・別途確定） |
| `.../outputs/phase-12/force-migration-runbook.md` | 作成 | AC-6 runbook（移行前 snapshot + 強制移行 + 逆移行ロールバック） |
| `.../outputs/phase-13/phase-13.md` | 作成 | commit-pr-release 草案（pending_user_approval） |

## 実装済みファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | 更新 | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` |
| `apps/api/src/routes/admin/tags.ts` | 更新 | `?migrateTo` 分岐 + error code 3 種 + audit action `references_migrated` |
| `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 更新 | force-migration repository D1 cases |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 更新 | force-migration contract + AC-7 regression |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 更新 | `?migrateTo` endpoint + error code + audit action + 不変条件 |

## user-gated 残

staging runtime smoke・production tag 強制移行/物理削除 mutation・commit・push・PR・Issue state change は未実行。Issue #1117 は CLOSED 維持。
