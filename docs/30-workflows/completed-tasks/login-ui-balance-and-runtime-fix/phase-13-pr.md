# Phase 13 — PR 作成

## 状態: blocked_pending_user_approval

commit / push / PR 作成はユーザー明示承認後のみ実行する。

## 想定 PR

- base: `dev`
- head: `feat/login-ui-balance-and-runtime-fix`
- title: `fix(login): input/button balance + Google brand icon + magic-link env + prototype 404`

## PR 本文骨子（user 承認後に確定）

### Summary
- `/login` の入力欄/ボタンの視覚バランスを `auth.css` で整合
- Google ブランドアイコンを legacy CSS から negative selector で隔離
- `apps/web/app/api/auth/magic-link/{route,verify/route}.ts` などを `getAuthEnv()` / `getPublicFetchEnv()` 経由に統一（CLAUDE.md invariant #11）
- `apps/web` 配下の `process.env.INTERNAL_API_BASE_URL` 直参照を grep gate で固定
- プロトタイプ `index.html` を jsdelivr に切替 + `.jsx` 配信用 `scripts/serve-prototype.sh` 追加

### Test plan
- `pnpm typecheck` / `pnpm lint`
- `pnpm --filter @repo/web exec vitest run` （targeted, route + component）
- `bash scripts/verify-no-process-env-internal-api.sh`
- `pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts`
- staging deploy 後 `curl -X POST .../api/auth/magic-link` で 200/202
- `bash scripts/serve-prototype.sh 5180` でプロトタイプが描画

### Screenshots
- `outputs/phase-11/screenshots/login-balanced.png`
- `outputs/phase-11/screenshots/google-brand-icon.png`
- `outputs/phase-11/screenshots/prototype-rendered.png`

## 実行手順（user 承認後）

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(login): input/button balance + Google brand icon + magic-link env + prototype 404

- auth.css: align .ui-input[data-size=lg] with button (height 44px, space-4 padding)
- legacy-public.css: scope [data-size] with :not(brand-icon|ui-input|ui-button)
- apps/web/app/api/auth/magic-link/{route,verify/route}.ts: getAuthEnv() 経由化
- scripts/verify-no-process-env-internal-api.sh: regression grep gate
- claude-design-prototype/index.html: jsdelivr 化 + SRI 撤去
- scripts/serve-prototype.sh: .jsx MIME 補正 simple HTTP server
EOF
)"
git push -u origin feat/login-ui-balance-and-runtime-fix
gh pr create --base dev --title "fix(login): ..." --body "$(cat outputs/phase-12/implementation-guide.md)"
```

## Gate-C

ユーザー承認後、PR 作成完了で Gate-C passed。
