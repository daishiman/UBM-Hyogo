# Phase 4: 事前検証チェックリスト

| # | 項目 | コマンド / 確認方法 | 結果 |
| --- | --- | --- | --- |
| 1 | `gh` CLI 認証済 | `gh auth status` | PASS（account: daishiman） |
| 2 | repo admin 権限 | branch protection API が 200 を返す | PASS |
| 3 | CI ワークフロー 1 回以上実行済 | before snapshot の `checks` に `ci` / `Validate Build` の `app_id` が紐付く | PASS |
| 4 | status check context 登録済 | before snapshot の `required_status_checks.contexts` が空でない | PASS |
| 5 | `dev` ブランチ存在 | `gh api repos/daishiman/UBM-Hyogo/branches/dev` | PASS |
| 6 | `develop` 残存なし（稼働仕様） | `grep -rn "develop" docs/` で completed-tasks 内の歴史的記述のみ | PASS |
| 7 | production env 存在 | `gh api repos/daishiman/UBM-Hyogo/environments` | PASS |
| 8 | staging env 存在 | 同上 | PASS |
| 9 | rollback 経路理解 | runbook §8 の DELETE 手順 | PASS |
| 10 | before snapshot 取得方法 | `gh api .../protection > outputs/phase-05/gh-api-before-{main,dev}.json` | PASS |

## 着手 Go/No-Go 判定

**Go** — 全項目 PASS のため Phase 5 適用に進む。
