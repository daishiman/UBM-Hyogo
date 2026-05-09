# workflow run summary

本サイクル（implementation cycle）では `.github/workflows/runtime-smoke-staging.yml` を追加実装した。
GitHub 上での実 run は **G1-G4 user approval 後の runtime evidence cycle** で取得する設計のため、
本 evidence ファイルは以下の static checks の結果で代替する。

## static validation

- YAML 構造: `name` / `on` / `jobs.smoke` / `concurrency` / `permissions` を含む
- secret 参照: `STAGING_*` 5 件と `SLACK_WEBHOOK_INCIDENT` を Environment scope (`staging-runtime-smoke`) で参照
- dispatch token: N/A（`backend-ci.yml` から reusable workflow call）
- `::add-mask::` 4 件を smoke step より前に配置
- `set -x` / `bash -x` / `set -o xtrace`: 0 hit (grep-gate.log)
- artifact upload retention: 30 days
- Slack post: `if: failure()` 限定

## not yet executed (deferred to runtime evidence cycle)

- 実 API staging deploy → reusable workflow call → smoke run の end-to-end PASS
- artifact redaction grep gate を CI 上で実行
- failure injection で Slack post 1 通の実測

これらは G1-G4 承認後に取得し本 summary を更新する。
