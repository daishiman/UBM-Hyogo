# Phase 8 — リファクタリング

## 対象

**対象なし。**

## 根拠

本タスクは `backend-ci.yml` 中の `deploy-staging` job 内 2 step に最小差分 (+6 行) を加えるのみ。重複箇所は確かに発生する (`Apply D1 migrations` と `Deploy Workers app` で `env:` block が類似) が:

- 抽出単位は step 単位 (composite action / reusable workflow への切り出し) になり、変更行数が逆に増える
- `deploy-production` job も same-wave 横展開済みだが、reusable workflow / composite action 化は変更量と抽象化コストが増える
- 早すぎる抽象化 (premature abstraction) のリスクを避け、現時点では明示的な 4 step 検証を `workflow-env-scope.test.sh` に固定する

## 将来の DRY 化候補 (記録のみ)

将来 backend-ci の deploy step がさらに増える場合は以下を検討:

```yaml
# .github/actions/cf-wrangler/action.yml (仮)
inputs:
  apiToken: { required: true }
  accountId: { required: true }
  workingDirectory: { required: true }
  command: { required: true }
runs:
  using: composite
  steps:
    - uses: cloudflare/wrangler-action@v3
      env:
        CLOUDFLARE_API_TOKEN: ${{ inputs.apiToken }}
        CLOUDFLARE_ACCOUNT_ID: ${{ inputs.accountId }}
      with:
        apiToken: ${{ inputs.apiToken }}
        ...
```

ただし `wrangler-action@v3` 自体が既に薄いラッパーであり、二重ラップは複雑化を招くため採否は task-03 設計時に再判定する。
