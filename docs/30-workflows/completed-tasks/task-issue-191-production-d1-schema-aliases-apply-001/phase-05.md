# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

このタスクの「実装」は production D1 への migration apply 操作と evidence/SSOT 更新であり、コード変更は伴わない。実行手順を runbook 形式で確定する。

## 実行タスク

- code change なし / production operation ありの実装境界を明記する。
- Phase 13 承認後 runbook と evidence 出力先を固定する。
- SSOT 更新対象と commit / PR の承認ゲートを分離する。

## 実装対象（コード変更なし / 操作と文書のみ）

| 区分 | 内容 | パス |
| --- | --- | --- |
| 操作 | production D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` |
| 操作 | apply 前後 evidence 取得 | Phase 11 evidence template に従う |
| 文書 | production apply 状態 marker 更新 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 文書 | active workflow 同期 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| 文書 | Phase 12 implementation guide | `outputs/phase-12/implementation-guide.md` |

## 事前準備（Phase 13 承認の前に揃える）

1. `op` CLI がローカルにインストールされ、`scripts/cf.sh` 経由で `CLOUDFLARE_API_TOKEN` が動的注入されることを `bash scripts/cf.sh whoami` で確認する。
2. `git status` clean / 作業ブランチが本タスク用 `docs/issue-359-...` であることを確認する。
3. `task-issue-191-schema-aliases-implementation-001` の Phase 12 が `completed` であり local migration が repository tests を PASS していることを再確認する。
4. `mise install && mise exec -- pnpm install` が完了していること（Node 24 / pnpm 10）。

## 実行 runbook（Phase 13 承認後に実行）

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

## SSOT 更新計画（Phase 12 で記述、Phase 13 でコミット）

| ファイル | 変更内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `schema_aliases` の production apply 状態を「unapplied」→「applied (2026-MM-DD)」へ更新 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本タスクを active → completed へ移動 |
| `docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/index.md` | workflow_state を `spec_created` → `completed` に更新（Phase 13 承認後） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| test strategy | `phase-04.md` | static / local / production checks |
| approval-gated pattern | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | user approval / runtime / PR gate |
| Cloudflare wrapper | `scripts/cf.sh` | CLI 実行経路 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| implementation plan | `phase-05.md` | Phase 13 runbook / SSOT update plan |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 9 | runbook の static prerequisites を検証 | `outputs/phase-11/static-checks.md` |
| Phase 13 | runbook を承認後に実行 | `outputs/phase-13/migrations-apply.log` |

## 完了条件

- [ ] 事前準備チェックリストが完成している
- [ ] runbook が `scripts/cf.sh` 経由のみで構成されている
- [ ] SSOT 更新対象 3 ファイルが特定されている
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 6: 異常系設計
