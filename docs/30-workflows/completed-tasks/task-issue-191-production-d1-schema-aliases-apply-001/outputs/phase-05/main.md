# Phase 5: 実装計画 — 結果

## 実行日時
2026-05-02

## 実装境界

このタスクは **コード変更なし / production operation あり**。Phase 13 承認後にのみ production CLI を実行する。

## 実装対象（コード変更なし / 操作と文書のみ）

| 区分 | 内容 | パス |
| --- | --- | --- |
| 操作 | production D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` |
| 操作 | apply 前後 evidence 取得 | Phase 11 evidence template に従う |
| 文書 | production apply 状態 marker | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 文書 | active workflow 同期 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| 文書 | implementation guide | `outputs/phase-12/implementation-guide.md` |

## 事前準備（Phase 13 承認の前に揃える）

1. `bash scripts/cf.sh whoami` で `op` 経由 token 注入を確認
2. `git status` clean / 作業ブランチが本タスク用 `docs/issue-359-...`
3. 先行 `task-issue-191-schema-aliases-implementation-001` の Phase 12 が `completed`
4. `mise install && mise exec -- pnpm install` 完了

## 実行 runbook（Phase 13 承認後）

```bash
# 0. 認証確認
bash scripts/cf.sh whoami

# 1. apply 前 evidence
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-13/migrations-list-before.txt
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  | tee outputs/phase-13/tables-before.txt

# 2. apply 実行
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  2>&1 | tee outputs/phase-13/migrations-apply.log

# 3. apply 後 evidence
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA table_info(schema_aliases);" \
  | tee outputs/phase-13/pragma-table-info.txt
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA index_list(schema_aliases);" \
  | tee outputs/phase-13/pragma-index-list.txt
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-13/migrations-list-after.txt
```

## SSOT 更新計画

| ファイル | 変更 |
| --- | --- |
| `database-schema.md` | `schema_aliases` の production apply 状態を「production unapplied」→「production applied (yyyy-mm-dd)」へ更新（Phase 13 後） |
| `task-workflow-active.md` | 本タスクを active → completed へ移動（Phase 13 後） |
| `index.md` / `artifacts.json` | workflow_state を `spec_created` → `completed` に更新（Phase 13 後） |

## 完了判定

- [x] 事前準備チェックリスト完成
- [x] runbook が `scripts/cf.sh` 経由のみで構成
- [x] SSOT 更新対象 3 ファイル特定
