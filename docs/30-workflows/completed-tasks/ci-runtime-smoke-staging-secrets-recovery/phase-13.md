# Phase 13: PR 作成

## 前提

**user の明示承認後のみ実施する**。AI が自律的に commit / push / PR 作成してはならない。

## PR メタ

- base: `dev`（CLAUDE.md デフォルト）
- title 案: `fix(ci): provision staging-runtime-smoke secrets and add workflow doc-ref guard`
- 含む変更:
  - `.github/workflows/runtime-smoke-staging.yml`（path 修正）
  - `scripts/ci/verify-workflow-doc-refs.sh`（新規）
  - `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`（新規）
  - `.github/workflows/verify-workflow-doc-refs.yml`（新規）
  - `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/**`（仕様書一式）

## PR body 雛形

```
## Summary
  - staging-runtime-smoke 環境への secret 5 件投入手順を確立し、local repo 側の stale path 再発を防止
- runtime-smoke-staging.yml の stale runbook path を current 位置（completed-tasks 配下）へ修正
- 再発防止: workflow YAML 内 docs/...md 参照の実在性を検証する CI guard を追加

## Test plan
- [ ] `bash scripts/ci/verify-workflow-doc-refs.sh` exit 0
- [ ] `bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` 全 PASS
- [ ] `actionlint` / `shellcheck` PASS
- [ ] user-approved `gh api .../staging-runtime-smoke/secrets --jq '.secrets[].name'` が 5 行
- [ ] user-approved `gh workflow run runtime-smoke-staging.yml --ref dev` の smoke step exit 0
```

## 注意

- secret 実値・bearer・webhook URL を PR body / commit message / diff 内に貼らない
- secret 投入は user 操作のため PR diff には含まれない（GitHub Environment 側）。本 PR には**コード変更と仕様書のみ**を含める
