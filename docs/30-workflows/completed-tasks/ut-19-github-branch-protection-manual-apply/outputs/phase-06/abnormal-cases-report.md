# Phase 6: 異常系検証レポート

## 検証観点

| ID | 異常系 | 想定原因 | 検証方法 | 結果 | 対処 |
| --- | --- | --- | --- | --- | --- |
| E-1 | 422 Unprocessable Entity | status check context が GitHub 内部 DB に未登録 | before snapshot で `checks[].app_id` を確認 | 発生せず（context 登録済） | UT-05 を 1 度実行 |
| E-2 | 403 Forbidden | token 権限不足 | `gh auth status` で `repo` scope 確認 | 発生せず | `gh auth refresh -s repo` |
| E-3 | 404 Not Found | branch 名タイポ | branch 存在確認 | 発生せず | branch 名を `dev` に統一 |
| E-4 | branch 名揺れ（develop / dev） | 旧仕様に `develop` 残存 | `grep -rn "develop" docs/ .github/` | 稼働仕様に残存なし。completed-tasks 内の歴史記述のみ | 対応不要 |
| E-5 | enforce_admins=true による admin lock-out | 設定誤り | after snapshot で `enforce_admins.enabled = false` 確認 | PASS | — |
| E-6 | Environments の deployment_branch_policy 不整合 | UI と API の整合性 | `gh api .../deployment-branch-policies` で `[main]` / `[dev]` 確認 | PASS（既存設定が runbook と一致） | — |
| E-7 | rollback 必要時の手順不明 | runbook §8 の参照漏れ | runbook §8 の DELETE コマンドで rollback 可能 | 経路確立 | 緊急時のみ実行 |

## `develop` 残存検査ログ

```
$ grep -rn "develop" docs/ .github/ | grep -v "developer\|development\|dev/dev/\|developing"
```

検出は全て `docs/30-workflows/completed-tasks/` 配下の**完了済タスクの歴史的記述**（`develop → dev` への移行記録）。稼働仕様（`apps/`, `.github/`, `aiworkflow-requirements/references/` の正本仕様）に `develop` ブランチ参照は存在しない。**AC-7 PASS**。

## サマリ

異常系すべて事前認識済・対処経路確立済。Phase 5 適用時に発生した異常系はゼロ。
