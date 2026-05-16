# Phase 8: DRY 化 / 仕様間整合

## 重複チェック

| 既存資産 | 本タスクとの重複可能性 | 判定 |
| -------- | ---------------------- | ---- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | infra runbook 全般 | 重複なし。本タスクは migration test 専用 runbook で粒度が異なる |
| `.github/workflows/d1-migration-verify.yml` 既存 step | bats + staging dry-run | 重複なし。本タスクは PR comment step を追加するのみ |
| `docs/30-workflows/completed-tasks/02b-*` | initial schema test | 関連あり。本タスクで「02b は initial 専用」と境界を明示することで責任分離を強化 |
| `docs/30-workflows/runbooks/` 既存 runbook 群 | 命名規則 | 命名規則 `kebab-case.md` 維持。`d1-migration-test-guideline.md` は新規 |

## aiworkflow-requirements との整合

- 本タスクは `apps/api/migrations` の test 責任境界を文書化するだけで、システム正本仕様（API endpoint / DB schema）には影響しない
- `aiworkflow-requirements` の `references/` 配下に runbooks の reverse index が存在する場合、新 runbook を追記（Phase 12 で `system-spec-update-summary.md` に記録）

## 整合性 PASS 条件

- 既存 runbook と内容重複なし
- 既存 CI workflow の green/fail 判定ロジックを破壊しない
- D1 不変条件 #5 / test suffix policy / branch protection と矛盾なし

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 8 |
| status | completed |

## 目的

重複、正本分散、requirements drift を防ぐ。

## 実行タスク

- 独立 runbook を単一正本として維持する。
- aiworkflow-requirements の同期先を確定する。

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物/実行手順

Phase 12 の system-spec-update-summary と artifact inventory に同期先を引き渡す。

## 完了条件

- 同一ルールの重複記載がなく、同期先が具体化している。

## 統合テスト連携

`pnpm indexes:rebuild` と `rg` による参照確認で検証する。
