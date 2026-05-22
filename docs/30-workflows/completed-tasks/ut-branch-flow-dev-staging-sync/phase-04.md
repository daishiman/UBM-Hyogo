# Phase 4: API / インターフェース

本タスクは外部 API を持たないが、参照する `gh api` エンドポイントと `git` コマンドを契約として明示する。

## GitHub API

| Endpoint | Method | 用途 |
|----------|--------|------|
| `repos/daishiman/UBM-Hyogo/branches/dev/protection` | PUT | force-push 一時許可 / 復元 |
| `repos/daishiman/UBM-Hyogo/branches/dev/protection` | GET | drift 確認 |

### Request body (force-push 許可)

```json
{
  "required_status_checks": {"strict": false, "contexts": ["ci", "Validate Build"]},
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": true,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
```

### Request body (復元)

`allow_force_pushes` を `false` にした以外は上記と同一。

## git コマンド契約

| コマンド | 期待結果 |
|---------|---------|
| `git fetch origin` | `origin/main`, `origin/dev` 最新化 |
| `git push origin origin/main:refs/heads/dev --force` | `+ <old>...<main HEAD> origin/main -> dev (forced update)` |
| `git rev-list --left-right --count origin/main...origin/dev` | `0\t0`（同期完了） |
| `git rev-list --left-right --count origin/dev...HEAD` | `0\tN`（本 feature ブランチの PR 差分のみ） |

## scripts/new-worktree.sh の I/O 契約

| 項目 | 内容 |
|------|------|
| 引数 | `<branch_name>` (必須) |
| 副作用 | `.worktrees/task-<TS>-wt` ディレクトリ生成、`origin/dev` から分岐 |
| exit code | 0=成功, 1=失敗 (set -euo pipefail) |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Git / GitHub command contract を固定する。

## 実行タスク

API endpoint、git command、script I/O を定義する。

## 参照資料

GitHub REST branch protection API、`scripts/new-worktree.sh`。

## 成果物

command contract 表。

## 完了条件

remote sync と feature delta の検証式が分離されている。

## 統合テスト連携

Phase 11 の command evidence に接続する。
