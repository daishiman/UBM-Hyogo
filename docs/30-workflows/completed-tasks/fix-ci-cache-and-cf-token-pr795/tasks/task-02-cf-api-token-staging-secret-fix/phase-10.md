# Phase 10 — 最終レビュー

PR 作成 (Phase 13) 直前のチェックリスト。実装プロンプトはこの全項目を満たしてから `gh pr create` に進む。

## 機能的観点

- [ ] `.github/workflows/backend-ci.yml` の `deploy-staging` 内 2 step に `env:` block が追加されている
- [ ] `env.CLOUDFLARE_API_TOKEN` と `env.CLOUDFLARE_ACCOUNT_ID` が両 step に存在する
- [ ] `with.apiToken` / `with.accountId` は維持されている (二重化が B2 の本旨)
- [ ] `deploy-production` job は不変更
- [ ] `runtime-smoke-staging` reusable workflow 呼び出しは不変更

## 構文・スタイル

- [ ] actionlint exit 0
- [ ] YAML インデントが既存 step と揃っている (`  ` 2 スペース、`env:` は step 直下と同列)
- [ ] step の順序 (`uses:` → `env:` → `with:`) が GitHub Actions 慣習に沿っている

## セキュリティ

- [ ] 実 API token 値が git diff に含まれていない
- [ ] op 参照 path 以外の token 様文字列がドキュメントに含まれていない
- [ ] PR 本文の preview に実値が含まれない

## 運用

- [ ] `gh secret list --env staging --repo daishiman/UBM-Hyogo` で `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` の 2 件が存在 (Phase 5 Step 4 完了後)
- [ ] PR 本文の "Follow-up" に UNASSIGNED-01 / UNASSIGNED-02 が記載されている

## CLAUDE.md 整合

- [ ] PR base = `dev` (CLAUDE.md §既定ブランチ)
- [ ] `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が全て pass

## 残課題

- UNASSIGNED-01: `workflow_dispatch` trigger 追加 (本タスク外、別 issue)
- UNASSIGNED-02: `deploy-production` env fallback 適用 (本タスク外、別 task / issue)

両者を PR 本文に明示する。

## 判定基準

上記全チェック通過で **Phase 13 (PR 作成)** へ進む。1 件でも未達なら該当 Phase に戻り是正する。
