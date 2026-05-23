# Phase 6 — テスト拡充

通常のソフトウェアタスクで言う「テストコード追加」は CI infra 修正のため対象外。代わりに、本タスクで露呈した脆さを横展開して保護する候補を残課題として明示する。

## 横展開候補 (本タスクスコープ外)

### UNASSIGNED-02 (workflow root phase-3 で既出)

`deploy-production` job (line 69-122) も同じ `with.apiToken` 単一経路で wrangler-action を呼んでいる。task-02 と同じ env fallback パターンを適用すべきだが、production deploy は main マージ時にしか走らないため、本タスクサイクルで検証できない。

**対応案**: `deploy-production` job への env fallback 適用を、別タスク `task-03-cf-api-token-production-fallback` として登録 (本ワークフローパッケージ内 / 別ワークフローパッケージのいずれでもよい)。本タスクの PR 本文に "Follow-up: production hardening" として明示する。

### UNASSIGNED-01 (workflow root phase-3 で既出)

`backend-ci.yml` に `workflow_dispatch` trigger が存在しないため、本タスクの最終検証が dev push 後でしか取れない問題。次サイクルで:

```yaml
on:
  push:
    branches: [dev, main]
  workflow_dispatch:
    inputs:
      target_env:
        type: choice
        options: [staging, production]
```

の追加を検討。

## 本タスクで追加するテスト/検証成果物

| 種別 | 内容 | 場所 |
| ---- | ---- | ---- |
| CI run evidence | `gh run view <id> --log` の `Apply D1 migrations` 成功部抜粋 | Phase 11 evidence |
| secret 存在 evidence | `gh secret list --env staging` の出力 (名前のみ) | Phase 11 evidence |
| actionlint log | `actionlint .github/workflows/backend-ci.yml` の exit 0 | Phase 9 evidence |

ユニットテスト / 統合テストの新規追加は無し。
