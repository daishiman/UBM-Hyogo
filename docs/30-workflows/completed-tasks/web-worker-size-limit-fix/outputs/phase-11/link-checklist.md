# Link Checklist — web-worker-size-limit-fix（Phase 11 NON_VISUAL）

ワークフロー内の参照リンク健全性を記録する。状態は OK（参照先存在・整合）/ Broken（参照先不在・不整合）。

| 参照元 → 参照先 | 状態 |
| --- | --- |
| `index.md` → `phase-8-refactor.md` | OK |
| `index.md` → `phase-9-qa.md` | OK |
| `index.md` → `phase-10-final-review.md` | OK |
| `index.md` → `phase-11-manual-test.md` | OK |
| `index.md` → `outputs/phase-11/` | OK |
| `phase-8-refactor.md` → `phase-9-qa.md`（次Phase） | OK |
| `phase-9-qa.md` → `phase-10-final-review.md`（次Phase） | OK |
| `phase-10-final-review.md` → `phase-11-manual-test.md`（次Phase） | OK |
| `phase-11-manual-test.md` → `outputs/phase-11/main.md` | OK |
| `phase-11-manual-test.md` → `outputs/phase-11/manual-smoke-log.md` | OK |
| `phase-11-manual-test.md` → `outputs/phase-11/link-checklist.md` | OK |
| `phase-11-manual-test.md` → phase-12 strict 7 成果物 | OK |
| `outputs/phase-11/main.md` → `manual-smoke-log.md` / `link-checklist.md` | OK |
| `phase-9-qa.md` → `docs/00-getting-started-manual/specs/08-free-database.md` | OK |
| `phase-9-qa.md` → `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | OK |
| `index.md` → `docs/00-getting-started-manual/specs/08-free-database.md` | OK |

## phase-12 strict 7 参照先（健全性）

| strict 7 成果物 | 参照状態 |
| --- | --- |
| `outputs/phase-12/main.md` | OK（phase-12 で生成済） |
| `outputs/phase-12/implementation-guide.md` | OK |
| `outputs/phase-12/system-spec-update-summary.md` | OK |
| `outputs/phase-12/documentation-changelog.md` | OK |
| `outputs/phase-12/unassigned-task-detection.md` | OK |
| `outputs/phase-12/skill-feedback-report.md` | OK |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | OK |

## 備考

- 本サイクルは `implemented_local_evidence_captured`。phase-12 strict 7 の存在は phase-12 生成物に依存するため、実装後の最終確認時に再検証する。
- Broken 検出時は参照元の path を修正し、再度本表を更新する。
