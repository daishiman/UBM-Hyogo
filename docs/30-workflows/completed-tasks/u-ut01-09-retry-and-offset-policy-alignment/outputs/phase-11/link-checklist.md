# Phase 11 Link Checklist

> 本 workflow が依存するリンク（内部 / 外部 / mirror parity）の到達性チェック。

---

## 1. Workflow 内リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md` ... `phase-13.md` | OK（Phase 1-13 揃い） |
| `index.md` | `outputs/phase-XX/<file>.md` | OK（Phase 1-12 outputs 全配置） |
| `artifacts.json` | 各 phase outputs | OK（artifacts.json と physical files 整合） |
| `phase-11.md` | `outputs/phase-11/main.md` | OK |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | OK |
| `phase-11.md` | `outputs/phase-11/link-checklist.md` | OK |
| 各 phase outputs | `../phase-02/canonical-retry-offset-decision.md` | OK |
| Phase 5 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | OK |

## 2. 外部参照（上流 / 既存実装）

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| Phase 1, 2, 8 | `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` | OK（canonical input） |
| Phase 1, 2, 8, 9 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` | OK |
| Phase 1, 2, 8 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` | OK |
| Phase 1, 2, 5 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | OK（L49 `DEFAULT_MAX_RETRIES = 5` 確認） |
| Phase 1, 2, 5 | `apps/api/migrations/0002_sync_logs_locks.sql` | OK（`processed_offset` 不在確認） |

## 3. mirror parity

| 対象 | 確認方法 | 状態 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/` | 正本利用、mirror 不在 | N/A |
| `.claude/skills/aiworkflow-requirements/` | 正本利用、mirror 不在 | N/A |

## 4. drift 検出

| 項目 | 結果 |
| --- | --- |
| Phase 間で canonical 値の drift | 0 件 |
| artifacts.json と物理 outputs の drift | 0 件 |
| index.md と phase-XX.md の drift | 0 件 |

## 5. 結論

すべて到達可能、drift 0 件。Phase 11 観点 B / C を PASS とする。
