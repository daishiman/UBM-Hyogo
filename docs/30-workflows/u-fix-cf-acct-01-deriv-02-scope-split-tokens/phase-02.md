# Phase 2: 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-2/phase-2.md` |

## 目的
Token scope マトリクス、Secrets 命名規約、workflow job 分割設計、`scripts/cf.sh` の Token 引数化を確定する。

## 参照資料
- `outputs/phase-2/phase-2.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`

## 成果物
- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/workflow-job-split-design.md`

## 完了条件
- 6 Token の scope 表、Secrets 命名規約、workflow job 分割図、`scripts/cf.sh` 改修方針が確定。

## 実行タスク
- [ ] `backend-ci.yml` / `web-cd.yml` の現行 step と 6 Token matrix を対応付ける。

## 統合テスト連携
- アプリ統合テストなし。scope matrix は Phase 4/9 の static workflow check と Phase 11 runtime evidence に接続する。
