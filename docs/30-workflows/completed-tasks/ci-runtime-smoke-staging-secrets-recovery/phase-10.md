# Phase 10: 最終レビュー

## 受入条件チェックリスト

| 項目 | 確認 |
|------|------|
| `staging-runtime-smoke` Environment に必要 5 secret が登録された | user 操作後に `gh api .../secrets --jq '.secrets[].name' | sort` が 5 行 |
| `runtime-smoke-staging.yml` の error メッセージが current runbook path を指す | `grep "completed-tasks/ci-secret-alignment" .github/workflows/runtime-smoke-staging.yml` がヒット |
| `verify-workflow-doc-refs.sh` 実装済み・実行可能 | `bash scripts/ci/verify-workflow-doc-refs.sh` exit 0 |
| `verify-workflow-doc-refs.yml` 配置済み | `.github/workflows/verify-workflow-doc-refs.yml` 存在 |
| guard test 全 PASS | TC-01〜TC-07 |
| `actionlint` / `shellcheck` PASS | Phase 9 完了 |
| `runtime-smoke-staging` 再実行で smoke job 成功 | user-gated runtime evidence。`gh run watch` で smoke step exit 0 |

## スコープ外メモ

- runbook 自体を `completed-tasks/` から `docs/30-workflows/runbooks/` 配下へ昇格する将来移行は、今回の stale workflow reference 修復には不要。current path 同期で閉じる。
- `verify-workflow-doc-refs.sh` を Markdown 全体（`docs/**/*.md` 内クロスリンク）まで拡張する案は、今回の workflow YAML guard 契約外。未タスク化せず、必要になった時点で別途仕様化する。

## 判定

PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / GO to Phase 11 runtime evidence after user secret placement approval
