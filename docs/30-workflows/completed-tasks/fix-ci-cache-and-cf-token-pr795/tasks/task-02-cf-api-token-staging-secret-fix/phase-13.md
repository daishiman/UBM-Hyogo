# Phase 13 — PR 作成

> **重要**: PR 作成は **ユーザー明示承認後** に実施する。実装プロンプトは Phase 10 全項目クリア → ユーザー承認 → 本 Phase 実行 の順を守る。

## 事前条件

- Phase 5 Step 1-5 完了 (feature ブランチに commit & push 済み)
- Phase 5 Step 4 完了 (`gh secret list --env staging` で 2 件確認済み) ※ user 承認後
- Phase 9 品質ゲート全 pass
- Phase 10 最終レビューチェックリスト全 pass

## PR 基本情報

| 項目 | 値 |
| ---- | -- |
| base | `dev` (CLAUDE.md §既定ブランチ) |
| head | `fix/ci-cf-api-token-staging-secret` |
| draft | No |
| reviewer | なし (solo dev, CLAUDE.md §ブランチ戦略) |

## PR タイトル

```
fix(backend-ci): add env fallback for CLOUDFLARE_API_TOKEN on deploy-staging
```

70 字以内 (現状 67 字)。

## PR 本文テンプレ

```markdown
## Summary

- `deploy-staging` job の `Apply D1 migrations` / `Deploy Workers app` 両 step に step-level `env.CLOUDFLARE_API_TOKEN` / `env.CLOUDFLARE_ACCOUNT_ID` を追加し、`with.apiToken` 単一経路の脆さを解消
- `staging` environment に `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` を gh CLI で登録 (Phase 5 Step 4 で実施)
- PR #795 マージ後に残存していた `CLOUDFLARE_API_TOKEN environment variable` エラーを解消

## 変更内容

- `.github/workflows/backend-ci.yml`: +6 行 (deploy-staging job のみ)
- `deploy-production` job は不変更 (UNASSIGNED-02 として別タスク化)

## Phase 11 evidence

- EV-11-1: `gh secret list --env staging` 出力 (名前のみ、2 件)
- EV-11-2: `Apply D1 migrations` step success ログ抜粋
- EV-11-3: `Deploy Workers app` step success ログ抜粋
- EV-11-4: `CLOUDFLARE_API_TOKEN environment variable` grep カウント = 0
- EV-11-5: `runtime-smoke-staging` job 起動確認

> NON_VISUAL タスクのためスクリーンショットなし。

## Test plan

- [x] `actionlint .github/workflows/backend-ci.yml` exit 0
- [x] `gh secret list --env staging --repo daishiman/UBM-Hyogo` で 2 件確認
- [x] `mise exec -- pnpm typecheck` green
- [x] `mise exec -- pnpm lint` green
- [x] `bash scripts/verify-pr-ready.sh` green
- [ ] (merge 後) `gh run view <id> --log --job deploy-staging` で 2 step success
- [ ] (merge 後) `CLOUDFLARE_API_TOKEN environment variable` エラー grep 0 件

## Follow-up

- UNASSIGNED-01: `backend-ci.yml` への `workflow_dispatch` trigger 追加 (pre-merge dry-run 可能化)
- UNASSIGNED-02: `deploy-production` job への同等 env fallback 適用

## CLAUDE.md 規約

- §シークレット管理: 実 token 値は本 PR / コミット / docs に一切含まれない
- §Cloudflare 系 CLI 実行ルール: GitHub Actions 上は `wrangler-action` が canonical
- §既定ブランチ: base = dev
```

## 実行コマンド

```bash
# 1) 最終 push 確認
git push -u origin fix/ci-cf-api-token-staging-secret

# 2) PR 作成 (heredoc で本文を渡す)
gh pr create --base dev --title "fix(backend-ci): add env fallback for CLOUDFLARE_API_TOKEN on deploy-staging" --body "$(cat <<'EOF'
## Summary
...（上記テンプレを展開）
EOF
)"
```

## マージ後の post-flight

1. `gh run watch <run-id>` で `backend-ci` を観測
2. Phase 11 evidence セクションを実際の出力で更新 (placeholder を実値で置換、ただし token 値は出ない仕様)
3. AC-1..AC-7 全達成を確認し、本タスクを `completed` に更新 (`artifacts.json` 該当 phase を completed へ昇格は別 commit)

## 報告

PR URL、採用ブランチ、解消したコンフリクト、自動修復履歴、残課題 (UNASSIGNED-01/02) を 1 回の最終レポートにまとめてユーザーに返す。
