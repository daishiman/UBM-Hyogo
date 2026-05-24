# Implementation Guide (Phase 12 strict 7)

実装の正本は **`outputs/phase-4/phase-4.md`** を参照すること。本ファイルは PR 本文 / レビュー entry の集約ビュー。

## 1. 変更スコープ一行サマリー

`/login` ページの UI/UX を `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の LoginPage 仕様に整合させる。Magic Link 主導 + OR divider + Google secondary + brand mark + 2 段タイトル + 文言更新。

## 2. ファイル変更マップ (Phase 4 §1 から転記)

13 件 — 詳細は `outputs/phase-4/phase-4.md` §1 表を参照。

新規:
- `apps/web/src/styles/auth.css`
- `apps/web/app/login/_components/LoginShell.tsx`
- `apps/web/app/login/_components/OrDivider.tsx`

編集:
- `apps/web/src/styles/globals.css` (1 行 import)
- `apps/web/src/components/ui/icons.ts` (union 4 値追加)
- `apps/web/src/components/ui/Icon.tsx` (path 4 件追加)
- `apps/web/app/login/_components/LoginCard.tsx`
- `apps/web/app/login/_components/LoginPanel.client.tsx`
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`
- `apps/web/app/login/_components/LoginStatus.tsx`
- `apps/web/app/login/page.tsx`
- 新規/更新 spec: `apps/web/app/login/_components/__tests__/*.spec.tsx` 群 + `apps/web/playwright/tests/login-smoke.spec.ts`

## 3. ローカル DoD コマンド (Phase 4 §6 / Phase 5 §2 Step 10)

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build
rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/styles/auth.css apps/web/app/login || echo "no hex"
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts --project=desktop-chromium
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で実装 DoD クリア。

## 4. AC summary

| AC | 内容 | evidence |
|----|------|---------|
| AC-1 | brand-mark "兵" + jp + en 2 段タイトル | screenshot login-input |
| AC-2 | h1 "会員ログイン" + 新 subtitle | screenshot login-input |
| AC-3 | Primary (Magic Link, send icon, block lg) が OR の上 | screenshot login-input |
| AC-4 | OR divider 表示 (両端 hairline) | screenshot login-input |
| AC-5 | sent state の inbox icon block + email 強調 | screenshot login-sent |
| AC-6 | Ghost (Google, google icon, block lg) が OR の下 | screenshot login-input |
| AC-7 | register CTA "会員でない方は メンバー登録 から" | screenshot login-input |
| AC-8 | HEX 直書き 0 件 (OKLch token 経由) | grep-gate.log |
| AC-9 | cooldown / submit / error の既存挙動維持 | test.log |
| AC-10 | typecheck / lint / build exit 0 | typecheck.log / lint.log / build.log |
| AC-11 | Phase 11 evidence inventory: local summary + required screenshot 5 件 present (追加 3 件も present) | Phase 12 §4 |
| AC-12 | focused Playwright login smoke 9/9 PASS。`verify-pr-ready.sh` は Phase 13 user-gated | Phase 11 / Phase 13 |
