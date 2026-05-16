# Phase 5: 実装（実行結果）

## 実装完了ファイル

| Path | 種別 | 内容 |
|------|------|------|
| `.github/workflows/runtime-smoke-staging.yml` | edit | error メッセージの runbook path を current `completed-tasks/...` へ同期 |
| `.github/workflows/ci.yml` | edit | actionlint target に `verify-workflow-doc-refs.yml` 追加 |
| `.github/workflows/{incident-runbook-slack-delivery,pr-build-test,pr-target-safety-gate,verify-indexes,verify-test-suffix}.yml` | edit | guard が検出した stale doc path を current path へ同期 |
| `.github/workflows/verify-workflow-doc-refs.yml` | new | guard CI job (`pull_request` + `push: [dev, main]`) |
| `scripts/ci/verify-workflow-doc-refs.sh` | new | workflow YAML 内 `docs/...md` 参照の repository-local 実在検証（POSIX bash） |
| `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | new | TC-01〜TC-07 の shell test |

## Secret 投入（user 操作・未実施）

```bash
bash scripts/smoke/provision-staging-secrets.sh
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
gh workflow run runtime-smoke-staging.yml --ref dev
```

期待 secret 5 件: `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT`

## AI 実行検証コマンド

```
$ bash scripts/ci/verify-workflow-doc-refs.sh
verify-workflow-doc-refs: OK (17 references checked across 32 files)

$ bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh
SUMMARY: 7 passed / 0 failed
```

## git diff --stat（変更反映確認・CONST_005）

```
.github/workflows/ci.yml                              | 2 +-
.github/workflows/incident-runbook-slack-delivery.yml | 2 +-
.github/workflows/pr-build-test.yml                   | 2 +-
.github/workflows/pr-target-safety-gate.yml           | 2 +-
.github/workflows/runtime-smoke-staging.yml           | 4 ++--
.github/workflows/verify-indexes.yml                  | 2 +-
.github/workflows/verify-test-suffix.yml              | 2 +-

new files:
.github/workflows/verify-workflow-doc-refs.yml
scripts/ci/verify-workflow-doc-refs.sh
scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh
```

## 注意

- secret 実値は AI に渡さない / commit / PR / chat いずれにも貼らない
- runbook 昇格は scope 外（今回の必須修復ではないため未タスク化しない）
