# Phase 10 — レビュー観点

## コード review checklist

- [ ] `apps/web/scripts/lhci-auth-storage.ts` で `AUTH_SECRET` が console.log されていない
- [ ] storage-state.json の出力先が `apps/web/.lhci/` 配下に限定されている
- [ ] `.gitignore` に `apps/web/.lhci/` が追加されている（`git status` で storage-state.json が untracked にならない）
- [ ] `lhci-auth.cjs` が CJS で書かれている (`module.exports = async ...`)
- [ ] `lighthouserc.authenticated.json` の `puppeteerScript` パスが repo root 相対で正しい
- [ ] `lighthouserc.json` の url 配列から `/profile` が削除されている（重複計測を避ける）
- [ ] `apps/web/package.json` の `lhci:auth-storage` script が `tsx scripts/lhci-auth-storage.ts` に解決される
- [ ] `.github/workflows/lighthouse.yml` の env で `AUTH_SECRET` が `secrets.AUTH_SECRET` から渡されている
- [ ] focused test が `AUTH_SECRET` 欠落時の throw を assert している
- [ ] `signSessionJwt` 呼び出し時の payload に admin role / 実 user メールが含まれていない（test 専用 dummy 固定）

## SSOT review checklist

- [ ] `02-auth.md` に LHCI 用 test session JWT の節が追記されている
- [ ] `e2e-quality-uplift/backlog.md` の EXT-X1 が closed-by-issue #630 / implemented-local-runtime-pending successor に更新されている
- [ ] CLAUDE.md の不変条件と矛盾していない（AUTH_SECRET をドキュメントに書かないルール遵守）

## 運用 review checklist

- [ ] GitHub Secrets `AUTH_SECRET` 投入手順が Phase 13 に明記されている
- [ ] authenticated step の fail が unauth step に波及しない（job 内で step が独立）
- [ ] rollback 手順（Phase 6）が PR description で参照可能
