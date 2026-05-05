# 03b response sync follow-up responsibilities

## Why

03b の Phase 12 再レビューで、response sync 本体とは分離した方がよい運用・仕様責務が残った。いずれも本タスク内で無理に実装すると 04a/04b/04c/08b/observability へまたがるため、統合 follow-up として管理する。

## Scope

| 項目 | 引き取り候補 |
| --- | --- |
| `responseEmail` 変更時の identity merge | 04c admin backoffice |
| 退会済 identity の current response 表示制御 | 04a public / 04b self service |
| sync 共通モジュール owner と `sync_jobs.metrics_json` schema 集約 | 03a / 03b shared design |
| `member_responses.response_email` UNIQUE 制約の DDL 明文化 | consumed by `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/`。正本は `member_identities.response_email` UNIQUE、`member_responses.response_email` は非 UNIQUE |
| 旧 `ruleConsent` 文字列の lint rule | linting / CI task |
| per-sync cap 連続到達時の通知 | observability |
| lock TTL 超過時の手動解除 runbook | infrastructure runbook |
| E2E fixture 統合 | 08b fixtures / coverage |

## Done

- 上記責務の owner を確定する。
- 必要なら責務単位で Phase 1-13 仕様書へ昇格する。
- 03b の PR notes から本ファイルへリンクする。
