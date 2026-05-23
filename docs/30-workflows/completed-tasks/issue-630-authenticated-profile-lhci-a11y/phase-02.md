# Phase 2 — 影響範囲調査

## 既存実装の把握

| 項目 | 既存 | 確認結果 |
| --- | --- | --- |
| LHCI 設定 | `lighthouserc.json` | `/`, `/members`, `/profile`, `/login` が unauth 計測。`/profile` は redirect 計測 |
| LHCI workflow | `.github/workflows/lighthouse.yml` | `next build` → `next start &` → `lhci autorun` の単一ジョブ |
| Auth fixture | `apps/web/playwright/fixtures/auth.ts` | `signSessionJwt(E2E_AUTH_SECRET, {...})` で session JWT 生成、`authjs.session-token` cookie をセット |
| signSessionJwt | `@ubm-hyogo/shared` | 既存 export 済み（Playwright 経由で使用中） |
| Auth.js v5 | `apps/web/src/lib/auth.ts` | `authjs.session-token` cookie 名（http localhost）を使用 |
| `/api/me/profile` | `apps/api/src/routes/me/profile.ts` | session 必須・JSON 返却。pre-check 用途で利用可 |

## 影響を受けるファイル

| パス | 種別 | 影響 |
| --- | --- | --- |
| `lighthouserc.json` | 編集 | `/profile` を urls から除外 |
| `lighthouserc.authenticated.json` | 新規 | authenticated 計測用 |
| `apps/web/scripts/lhci-auth-storage.ts` | 新規 | storageState 生成 |
| `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` | 新規 | unit test |
| `apps/web/lhci/lhci-auth.cjs` | 新規 | LHCI puppeteer pre-script |
| `apps/web/package.json` | 編集 | script `lhci:auth-storage` 追記 |
| `.github/workflows/lighthouse.yml` | 編集 | authenticated step 追加 |
| `.gitignore` | 編集 | `apps/web/.lhci/` を除外 |
| `docs/00-getting-started-manual/specs/02-auth.md` | 編集 | LHCI 用 test session JWT を追記 |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | 編集 | EXT-X1 を closed-by-issue #630 / implemented-local-runtime-pending successor として接続 |

## リスク要因

- `signSessionJwt` の AUTH_SECRET が GitHub Secrets に未登録の場合 CI fail → Phase 6 で対応
- Auth.js が cookie domain を厳格に要求 → `http://localhost:3000` 固定で回避
