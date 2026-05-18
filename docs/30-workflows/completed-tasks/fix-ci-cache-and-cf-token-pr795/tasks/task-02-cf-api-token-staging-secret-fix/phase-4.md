# Phase 4 — テスト方針

CI infra 修正のため通常のユニットテストは対象外。検証は **静的解析 + secret 存在確認 + 実 CI run 観測** の 3 層で行う。

## 検証レイヤー

### Layer 1: 静的解析 (ローカル / pre-push)

| 検証 | コマンド | 期待 |
| ---- | -------- | ---- |
| YAML 構文 | `actionlint .github/workflows/backend-ci.yml` | exit 0、エラーなし |
| step-level `env:` 追加が valid | actionlint (同上) | `env:` block の `${{ secrets.* }}` 評価を含めて pass |
| 実 token 値の混入チェック | `git diff dev...HEAD -- .github/workflows/backend-ci.yml \| grep -Ei '(eyJ\|[a-f0-9]{40,})'` | 0 件 (1Password reference 以外は出ない) |

### Layer 2: secret 存在確認 (GitHub Actions 実行前)

| 検証 | コマンド | 期待 |
| ---- | -------- | ---- |
| environment secret 名前一致 | `gh secret list --env staging --repo daishiman/UBM-Hyogo` | `CF_TOKEN_D1_STAGING` と `CF_TOKEN_WORKERS_STAGING` の **両方**が表示される (値は表示されない) |
| environment 存在確認 | `gh api repos/daishiman/UBM-Hyogo/environments/staging` | 200 OK |

> このレイヤーは **secret 登録 (B1) 完了後** に実行する。Phase 5 の手順 4 と同じコマンド。

### Layer 3: 実 CI 観測 (dev push 後)

`backend-ci.yml` に `workflow_dispatch` trigger が存在しないため、最終検証は **dev ブランチへの実 push が唯一の経路**。task-02 PR を `feat/...` から `dev` にマージした直後の run を観測する。

| 検証 | コマンド | 期待 |
| ---- | -------- | ---- |
| job 全体 success | `gh run list --workflow=backend-ci.yml --branch=dev --limit=1` | `status: completed`, `conclusion: success` |
| `Apply D1 migrations` step success | `gh run view <run-id> --log --job deploy-staging` で当該 step を grep | `Resource location: remote` 後にエラーなく終了 |
| `Deploy Workers app` step success | 同上 | wrangler `Deployment complete!` 等の成功ログ |
| `CLOUDFLARE_API_TOKEN environment variable` エラー消失 | `gh run view <run-id> --log \| grep -c 'CLOUDFLARE_API_TOKEN environment variable'` | `0` |
| `runtime-smoke-staging` 走行 | `gh run view <run-id> --log` で当該 reusable workflow が `needs: [deploy-staging]` 経由で起動 | 起動確認 (本タスクは smoke の合否までは要求しない) |

## dry-run 経路の欠落

- `act` でローカル dry-run は理論上可能だが、environment secret を `act` に渡す方法が secret 値の平文露出を要求するため、本タスクでは **使用しない**
- workflow_dispatch trigger 追加は `UNASSIGNED-01` として workflow root に登録済み

## アサーション規約

実装プロンプトが PR 作成前に確認すべき assertions:

1. `actionlint` が clean
2. `gh secret list --env staging` の出力に `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` の 2 行が存在
3. PR マージ後の `gh run view <latest-run-id> --log` で:
   - `Apply D1 migrations` step が `success`
   - `Deploy Workers app` step が `success`
   - `CLOUDFLARE_API_TOKEN environment variable` 文字列が grep 0 件

## 失敗時の切り分け

| 観測 | 仮説 | 次アクション |
| ---- | ---- | ----------- |
| `gh secret list` に 1 件も無い | environment 自体未作成 / secret 全消失 | `gh api ...environments/staging` で確認し、必要なら environment 作成から |
| `gh secret list` に 2 件存在するが CI で `CLOUDFLARE_API_TOKEN` エラー | token 値が無効 / scope 不足 | 1Password の token を Cloudflare dashboard で再発行し再登録 |
| `Apply D1 migrations` は success だが `Deploy Workers app` で fail | Workers token の scope 不足 | Workers token の `Workers Scripts:Edit` 権限を確認 |
| YAML 構文エラー | step-level `env:` のインデント崩れ | actionlint メッセージに従い修正 |
