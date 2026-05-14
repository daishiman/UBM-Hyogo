# Documentation Changelog

| path | change |
|------|--------|
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/index.md` | 新規。workflow メタ情報・Phase 1-13 構成・不変条件 |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/artifacts.json` | 新規。implementation / evidence / phases inventory |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/artifacts.json` | 新規。root `artifacts.json` と同値同期 |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/phase-1.md` 〜 `phase-13.md` | 新規。Phase 1-13 実装仕様書 |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/main.md` | 新規。focused Vitest / api typecheck / api lint / grep gate evidence summary |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/*.txt` | 新規。Phase 11 local evidence |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/main.md` | 新規。Phase 12 サマリ |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/implementation-guide.md` | 新規。中学生レベル + 技術者向け（用語チェック 6 語） |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規。12 点 compliance |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/system-spec-update-summary.md` | 新規。aiworkflow-requirements 反映概要 |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/skill-feedback-report.md` | 新規。task-specification-creator skill feedback |
| `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/unassigned-task-detection.md` | 新規。新規未タスク 0 件 / no-op 判定 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | e2e-stage-2-2d-contract-stage-2 entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md` | 新規。artifact inventory |
| `.claude/skills/aiworkflow-requirements/changelog/20260510-e2e-stage-2-2d-contract.md` | 新規。正本同期 changelog |
| `docs/30-workflows/unassigned-task/e2e-stage-2-2d-contract-stage-2-001.md` | consumed trace へ更新 |
| `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 新規（251 行 / 23 tests）。route response envelope 型へ接続 |
| `apps/api/src/routes/admin/member-delete.ts` | `DeleteBodyZ` を named export 化 |
| `apps/api/src/routes/admin/requests.ts` | `ListRequestsQueryZ` と list/resolve response contract 型を export、route response に `satisfies` 接続 |
| `apps/api/src/routes/admin/audit.ts` | `ListAuditQueryZ` と list response contract 型を export、route response に `satisfies` 接続 |
| `apps/web/src/lib/admin/server-fetch.ts` | identity conflict fixture `conflictId` を API 実形式 `source__target` へ補正 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | `source__target` fixture id に合わせて assertions を補正 |
