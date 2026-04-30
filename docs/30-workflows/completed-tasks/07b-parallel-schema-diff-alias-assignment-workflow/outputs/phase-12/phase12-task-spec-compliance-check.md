# Phase 12 Task Spec Compliance Check

## 必須 7 ファイル

| ファイル | 判定 | 根拠 |
| --- | --- | --- |
| `main.md` | PASS | 5 必須タスク + Task 6 を集約 |
| `implementation-guide.md` | PASS | Part 1 / Part 2、API、型、edge case、定数を記録 |
| `system-spec-update-summary.md` | PASS | aiworkflow-requirements 同期対象を記録 |
| `documentation-changelog.md` | PASS | workflow-local / global skill sync を分離 |
| `unassigned-task-detection.md` | PASS | `UT-07B-schema-alias-hardening-001` を formalize 済み |
| `skill-feedback-report.md` | PASS | task-specification-creator / aiworkflow-requirements feedback を記録 |
| `phase12-task-spec-compliance-check.md` | PASS | 本ファイル |

## Validator / 実測

| 項目 | 判定 | 証跡 |
| --- | --- | --- |
| root / outputs `artifacts.json` parity | PASS | `cmp` で差分なし |
| NON_VISUAL classification | PASS | `ui_routes: []`。Phase 11 は API smoke + Vitest 証跡 |
| unassigned task formalize | PASS | `UT-07B-schema-alias-hardening-001.md` / `UT-07B-alias-recommendation-i18n-001.md` |
| same-wave system spec sync | PASS | API / DB / lessons / artifact inventory / LOGS / indexes / task-workflow-active |
| 500 line budget | PASS | 07b DB contract を `database-schema-07b-schema-alias-assignment.md` へ分離し、親 `database-schema.md` は 500 行以内 |

## 不変条件 trace

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | OK | stableKey は schema_questions row 経由。候補生成は service 層 |
| #5 D1 直接アクセス禁止 | OK | apps/api 内 workflow / repository のみ |
| #10 無料枠内 | OK | batch=100 / CPU budget=25s。大規模実測は follow-up |
| #11 admin 機能存在は 403 | OK | requireAdmin 経由 |
| #14 schema 集約 | OK | schema 変更は `/admin/schema/*` / `schemaAliasAssign` に集約 |

その他不変条件（#2, #3, #4, #6, #7, #8, #9, #12, #13, #15）は本 workflow の責務外。

## AC trace

10 AC は Phase 7 `ac-matrix.md` で実装 / 異常系 / 不変条件へ対応付け済み。Phase 12 では追加で、実 DB schema 差分吸収、dryRun 副作用なし、collision 422、deleted member skip、audit action、follow-up hardening 境界を正本仕様へ同期した。
