# Phase 8 — 依存関係・順序

## 実装順序（直列）

1. `apps/web/scripts/lhci-auth-storage.ts` 実装
2. `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` 追加 → `pnpm --filter @ubm-hyogo/web test` pass
3. `.gitignore` 更新（`apps/web/.lhci/`）
4. `apps/web/lhci/lhci-auth.cjs` 実装
5. `lighthouserc.authenticated.json` 作成
6. `lighthouserc.json` から `/profile` 削除
7. `apps/web/package.json` に `lhci:auth-storage` 追記
8. ローカル smoke: `AUTH_SECRET=test-secret-32-bytes-padding-xxx pnpm --filter @ubm-hyogo/web build && pnpm --filter @ubm-hyogo/web start &` の後、
   `pnpm --filter @ubm-hyogo/web lhci:auth-storage && pnpm exec lhci autorun --config=lighthouserc.authenticated.json`
9. `.github/workflows/lighthouse.yml` に authenticated step 追加
10. SSOT 更新（02-auth.md / backlog.md）
11. GitHub Secrets に `AUTH_SECRET` 投入手順を runbook 化（Phase 13 で実施）

## 並列実行可能

- step 1 と step 4 は独立して書ける（step 1 完了後に並列化可能）
- step 9 (workflow) は step 1-7 完了後に開始

## 外部依存

- GitHub Secrets `AUTH_SECRET`: Phase 13 で投入。それまでは authenticated step が fail するが unauth step は緑。
- `@ubm-hyogo/shared` の `signSessionJwt`: 既存 export 済み、追加変更不要。

## ブロッカー

なし。本サイクル内で完結可能（CONST_007 遵守）。
