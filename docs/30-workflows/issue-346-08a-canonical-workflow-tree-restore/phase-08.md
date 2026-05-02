# Phase 8: CI / 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 8 / 13 |
| Phase 名称 | CI / 品質ゲート |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 7 (受入条件マトリクス) |
| 次 Phase | 9 (セキュリティ / boundary 検証) |
| 状態 | completed |

## 目的

本タスクが docs-only であっても、aiworkflow-requirements 編集 + indexes 再生成という性質から CI 側 `verify-indexes-up-to-date` gate を必ず通過させる必要がある。本 Phase ではこの gate を中心に、markdown link check と aiworkflow-requirements indexes 再生成手順を確定する。

## 通過必須 CI gate

| # | gate | 根拠 | 実行コマンド | 期待観測 |
| --- | --- | --- | --- | --- |
| 1 | `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` | exit 0（drift 0） |
| 2 | markdown link check（または rg ベース fallback） | `docs/` 配下の broken link 防止 | `rg "08a-parallel-api-contract-repository-and-authorization-tests" docs/30-workflows/09[abc]-* docs/30-workflows/unassigned-task/` | 実在 canonical path への参照 |
| 3 | lefthook pre-commit / pre-push | `lefthook.yml` の正本 | （hook 自動実行） | hook PASS、`--no-verify` 不使用 |

## 任意通過 CI gate

| # | gate | 備考 |
| --- | --- | --- |
| A | `pnpm typecheck` | 本タスクは TS に触れないが、CI 全体が通ることを確認 |
| A | `pnpm lint` | 同上 |
| A | `pnpm test` | 同上（影響範囲なしのため失敗があれば既存問題） |

これらは本タスクの直接成果物ではないが、PR 作成時に CI 全体が green であることを確認する。

## indexes 再生成手順

```bash
# T2 完了後に必ず実行
mise exec -- pnpm indexes:rebuild

# drift 0 確認
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/ \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/verify-indexes.log

# 差分があれば commit に含める
git add .claude/skills/aiworkflow-requirements/indexes/
```

## CI 失敗時の対応

| 失敗事象 | 対応 |
| --- | --- |
| `verify-indexes-up-to-date` FAIL | `pnpm indexes:rebuild` をローカル再実行し差分を commit に含める |
| markdown link check FAIL | 該当 broken link を T3 / T4 の置換漏れとして再修正 |
| lefthook hook 誤検知 | CLAUDE.md の sync-merge ポリシーに従い hook 自体を改善（`--no-verify` 使用禁止） |

## docs-only タスクとしての CI 影響境界

- 本タスクは `apps/api` / `apps/web` のソースに触れないため、Cloudflare deploy / wrangler / D1 系 CI には影響しない。
- aiworkflow-requirements の indexes 再生成は CI 側 `verify-indexes-up-to-date` gate のみを介して PR check に反映される。
- coverage gate は本タスクで触れないため、coverage 低下による pre-push 失敗は発生しない設計。

## 完了条件

- 通過必須 gate 3 件が明確化
- indexes 再生成手順が runbook 化
- 失敗時対応表が整備
- `outputs/phase-08/main.md` に記録

## 成果物

- `outputs/phase-08/main.md`
