# Phase 9 — 品質保証

## 品質ゲート

| ゲート | コマンド | 期待 |
| ------ | -------- | ---- |
| actionlint | `actionlint .github/workflows/backend-ci.yml` | exit 0 |
| YAML lint (任意) | `pnpm exec yamllint .github/workflows/backend-ci.yml` | warning レベルまで |
| typecheck | `mise exec -- pnpm typecheck` | 影響なし、green 維持 |
| lint | `mise exec -- pnpm lint` | 影響なし、green 維持 |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` | exit 0 |

> typecheck / lint は本タスクで直接編集しないが、PR 作成フロー (CLAUDE.md §PR作成の完全自律フロー) に則り常時実行する。

## セキュリティ規約遵守確認 (CLAUDE.md §シークレット管理)

| 観点 | 検証 | 期待 |
| ---- | ---- | ---- |
| 実 API token 値が YAML に出現しない | `git diff dev...HEAD -- .github/workflows/ \| grep -Ei '(eyJ[A-Za-z0-9_-]{20,}\|[a-f0-9]{40,})'` | 0 件 |
| 実値が docs に出現しない | `git diff dev...HEAD -- docs/ \| grep -Ei '(eyJ[A-Za-z0-9_-]{20,}\|[a-f0-9]{40,})'` | 0 件 |
| 実値が PR 本文に出現しない | PR 本文を `gh pr view --json body` で取得し同じ grep | 0 件 |
| `.env` が commit されていない | `git diff dev...HEAD --name-only \| grep -E '^\\.env'` | 0 件 |
| op 参照 path のみが docs に出現 | `grep -rE 'op://Cloudflare/[A-Za-z0-9_-]+/token' docs/30-workflows/fix-ci-cache-and-cf-token-pr795/` | 0 件以上 (このタスク内では参照記載のみ) |

## CLAUDE.md §Cloudflare 系 CLI 実行ルールとの整合確認

- 本タスクは GitHub Actions ランナー上での `wrangler-action@v3` 呼び出しが canonical で、ローカル運用ルール (`scripts/cf.sh` 経由) とは適用ドメインが異なる
- ローカルから secret 登録を行う際は `op read 'op://...'` を `gh secret set --body "$(...)"` に即時展開する経路を canonical とする (Phase 5 Step 4)
- `wrangler login` でローカル OAuth トークンを保持しない (CLAUDE.md 明示禁止)

## branch protection / required check 影響

`backend-ci.yml` 内の job 名 (`deploy-staging` / `deploy-production` / `runtime-smoke-staging`) は変更しないため、`dev` / `main` の required status check 設定への影響なし。
