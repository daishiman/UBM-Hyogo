# v2026.05.07-issue517-followup-auto-summary

- `references/deployment-gha.md` に `post-release-30day-auto-summary` 章を追加。
- Issue #517 の auto-summary foundation を `spec_created / implementation / NON_VISUAL` として同期。
- Slack channel `w1618436027-ek2505248` は manual bootstrap とし、workflow / shell script へ channel 作成 API を入れない。
- Incoming Webhook は 1Password 正本から GitHub Secret `SLACK_WEBHOOK_URL` へ派生登録する。
- channel / webhook / secret 未準備時は `CONTRACT_READY_SECRET_PENDING`、scheduled 30 day runtime 未到達時は `CONTRACT_READY_RUNTIME_PENDING` とする。

## 2026-05-07 実装完了

- `.github/workflows/post-release-30day-auto-summary.yml` を新規作成（daily UTC 01:00 cron + workflow_dispatch / `dry_run` boolean input）。
- `scripts/post-release-dashboard/30day-summary.sh` を新規作成し、aggregate_runs / is_30day_gate_satisfied / redact_log / find_existing_pr / render_pr_body / render_slack_payload / post_slack の 7 関数 + main 制御フローを実装。
- `scripts/post-release-dashboard/lib/aggregate.sh` を placeholder として配置。
- `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` で TC-01〜TC-07 を実装し、`__tests__/run-all.sh` から自動起動。fixture 4 件を `__tests__/fixtures/30day-summary/` に配置（日付プレースホルダーをテスト時に動的展開）。
- `scripts/post-release-dashboard/README.md` に実行手順 / exit code / 関連ファイル節を追記。
- `references/deployment-gha.md` の改訂履歴に v2.5.0 を追記。
- `bash scripts/post-release-dashboard/__tests__/run-all.sh` で全テスト PASS（TC-01〜TC-07 / 9 ケース）を確認。Python `yaml.safe_load` で workflow YAML 構文も検証済み。

