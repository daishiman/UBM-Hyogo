# Phase 8: DRY 化検討

## 検討対象
6 箇所の `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` を共通化できるか。

## 候補

| 案 | 内容 | 評価 |
| --- | --- | --- |
| job レベル `env:` | `env: ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で集約し step では `${{ env.ACCOUNT_ID }}` | wrangler-action の `accountId` input が context expression を直接受け取る前提で標準的。可読性は同等で行数削減もない |
| Reusable workflow | deploy ロジックを `workflow_call` に切出 | 本 fix の scope を超える大改修 |
| Composite action | wrangler 呼出をまとめる | scope 超過 |

## 判定: 不採用（DRY 化なし）

- 6 箇所はそれぞれ異なる step（migrate / deploy × staging / production × backend / web）で意味が異なる
- 参照式は 1 行・8 トークンであり重複コスト低
- 将来 `pr-build-test.yml` 等にも同様参照が増える場合は再評価
- 今回の最小修正方針に沿い、参照置換以外の構造変更は加えない
