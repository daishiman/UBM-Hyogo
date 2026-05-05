# Phase 11 link checklist

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 参照リンク確認

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md`〜`phase-13.md` | PASS（13 files exist） |
| `artifacts.json` | `outputs/phase-02/naming-canonical.md` | PASS |
| `artifacts.json` | `outputs/phase-02/column-mapping-matrix.md` | PASS |
| `artifacts.json` | `outputs/phase-02/backward-compatibility-strategy.md` | PASS |
| `artifacts.json` | `outputs/phase-02/handoff-to-ut04-ut09.md` | PASS |
| `artifacts.json` | `outputs/phase-04/test-strategy.md` | PASS |
| `artifacts.json` | `outputs/phase-07/ac-matrix.md` | PASS |
| `artifacts.json` | `outputs/phase-10/go-no-go.md` | PASS |
| `artifacts.json` | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | PASS |
| `artifacts.json` | `outputs/phase-12/main.md` / required 6 supporting files | PASS |
| Phase 12 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | PASS |
| Phase 2 / 4 / 11 | `apps/api/migrations/0002_sync_logs_locks.sql` | PASS |

## Mirror / index parity

| 確認項目 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| root `artifacts.json` が唯一の ledger | `outputs/artifacts.json` なしを明記 | `test ! -f outputs/artifacts.json` = PASS | PASS |
| `.claude` skill references | 必要 reference が辿れる | `task-specification-creator` / `aiworkflow-requirements` / `automation-30` references readable | PASS |
| aiworkflow index 更新 | Phase 12 summary に diff plan がある | resource-map / quick-reference diff present | PASS |

## 完了条件

- [x] Broken link が 0 件
- [x] Broken がある場合は Phase 12 compliance check で FAIL として扱う
