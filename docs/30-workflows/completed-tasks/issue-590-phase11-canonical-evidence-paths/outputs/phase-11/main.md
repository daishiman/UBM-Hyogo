# Phase 11 Evidence Index

判定: `IMPLEMENTED_LOCAL_RUNTIME_PENDING / NON_VISUAL`

本タスクは schema / validator 導入であり、画面証跡は生成しない。親 Issue #549 の runtime observation は post-merge の別 gate で取得されるため、本タスクの Phase 11 は validator と manifest validation の local evidence に限定する。

## 必須 outputs

| file | status | 内容 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | present | 本 index |
| `outputs/phase-11/canonical-paths.json` | present | 本タスク自身の Phase 11 evidence manifest |
| `outputs/phase-11/evidence/typecheck.log` | executed-exit-0 | workspace typecheck 実行ログ |
| `outputs/phase-11/evidence/lint.log` | executed-exit-0 | workspace lint 実行ログ |
| `outputs/phase-11/evidence/schema-validation.log` | executed-exit-0 | schema validation 実行ログ |
| `outputs/phase-11/evidence/validator-test.log` | executed-exit-0 | node:test 実行ログ |
| `outputs/phase-11/evidence/phase11-paths.log` | executed-exit-0 | package script / existence gate 実行ログ |

## 実行結果

| command | exit | log |
| --- | --- | --- |
| `pnpm typecheck` | 0 | `outputs/phase-11/evidence/typecheck.log` |
| `pnpm lint` | 0 | `outputs/phase-11/evidence/lint.log` |
| `node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/phase11-evidence-canonical-paths.schema.json --data docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json` | 0 | `outputs/phase-11/evidence/schema-validation.log` |
| `node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` | 0 | `outputs/phase-11/evidence/validator-test.log` |
| `pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json --check-existence` | 0 | `outputs/phase-11/evidence/phase11-paths.log` |

## AC 境界

親 #549 の `canonical-paths.json` は schema に準拠する。`--check-existence` は本タスク自身の local evidence に対して実行し、親 #549 の post-merge runtime evidence には未取得を false green 化しない。
