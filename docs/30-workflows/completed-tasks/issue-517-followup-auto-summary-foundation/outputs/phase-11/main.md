# Phase 11 手動検証

## 実施結果（2026-05-07 実装サイクル）

ローカルで自動検証可能な evidence をすべて取得し、`evidence/` 配下に保存した。runtime に依存する外部 evidence は user-gated 操作として保留する。

## evidence 一覧

| evidence | パス | 紐付く AC | 状態 |
| --- | --- | --- | --- |
| TC-01〜TC-07 + TC-05b 出力 | `evidence/unit-tests.log` | AC-2 / AC-3 / AC-6 | PASS |
| actionlint | `evidence/actionlint.log` | workflow syntax | TOOL_UNAVAILABLE（YAML parse fallback PASS） |
| permissions YAML 抜粋 | `evidence/permissions.yaml` | NFR-6 | PASS（least-privilege） |
| dry-run stdout | `evidence/dry-run-stdout.log` | AC-7 / AC-8 | runtime（gh CLI auth）に依存。CI 環境または `op run` 経由でユーザー承認後に再取得 |
| silent skip log | `evidence/silent-skip-exit0.log` | AC-1 / AC-4 | TC-07 で contract 検証済（exit 0 / 副作用ゼロ） |
| redaction grep audit | `evidence/redaction-grep-audit.log` | AC-5 | TC-03 で機械的検証済（4 パターン全消去）|
| GHA workflow_dispatch log | `evidence/gha-dispatch-dry-run.log` | AC-7 | user-gated（GitHub Actions UI 起動）|
| Slack bootstrap log | `evidence/slack-test-post.log` | AC-3 | user-gated（Slack channel `w1618436027-ek2505248` 作成 / Webhook bind / Secret 登録 / test post）|

`CONTRACT_READY_SECRET_PENDING` および `CONTRACT_READY_RUNTIME_PENDING` は仕様書通り、外部準備完了まで保留。

## ローカル自動検証コマンド

```bash
bash scripts/post-release-dashboard/__tests__/run-all.sh
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/post-release-30day-auto-summary.yml'))"
```

すべて PASS。
