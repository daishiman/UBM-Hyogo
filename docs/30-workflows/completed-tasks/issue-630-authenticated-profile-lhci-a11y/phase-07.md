# Phase 7 — 実装計画

## ファイル単位の変更計画

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/scripts/lhci-auth-storage.ts` | 新規 | Phase 4 のコード片を実装 |
| 2 | `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` | 新規 | Phase 5 の unit test |
| 3 | `apps/web/scripts/lhci-profile-mock-api.ts` | 新規 | Server Component fetch 用 mock API |
| 4 | `apps/web/lhci/lhci-auth.cjs` | 新規 | Phase 4 の puppeteer script + final URL pre-check |
| 5 | `lighthouserc.authenticated.json` | 新規 | Phase 4 の config |
| 6 | `lighthouserc.json` | 編集 | `/profile` を urls から削除 |
| 7 | `apps/web/package.json` | 編集 | `lhci:auth-storage` / `lhci:profile-mock-api` script 追記 |
| 8 | `.github/workflows/lighthouse.yml` | 編集 | authenticated step + mock API ready check 追加 |
| 9 | `.gitignore` | 編集 | `apps/web/.lhci/` / `apps/web/.lighthouseci*` 追加 |
| 10 | `docs/00-getting-started-manual/specs/02-auth.md` | 編集 | LHCI 用 test session JWT セクション追記 |
| 11 | `docs/30-workflows/e2e-quality-uplift/backlog.md` | 編集 | EXT-X1 を closed-by-issue #630 / implemented-local-runtime-pending successor として接続 |

## `.github/workflows/lighthouse.yml` diff 方針

既存最終 step の後、以下を追加:

```yaml
      - name: Generate LHCI auth storage state
        env:
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
        run: pnpm --filter @ubm-hyogo/web lhci:auth-storage

      - name: Run Lighthouse CI (authenticated /profile)
        env:
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          INTERNAL_API_BASE_URL: http://127.0.0.1:8787
        run: pnpm --filter @ubm-hyogo/web exec lhci autorun --config=../../lighthouserc.authenticated.json

      - name: Upload Lighthouse authenticated artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lhci-report-authenticated-${{ github.sha }}
          path: apps/web/.lighthouseci-authenticated/
          retention-days: 7
```

## 依存パッケージ

- `tsx`（現状 `apps/web` devDependencies に未登録。実装時に `pnpm --filter @ubm-hyogo/web add -D tsx` で追加する）
- LHCI v0.13+ (`@lhci/cli`) — 既存

## 想定 PR

- branch: `feat/issue-630-authenticated-profile-lhci`
- base: `dev`
- title: `feat(lhci): authenticated /profile a11y measurement (issue-630)`
- 本文: `Refs #630` + 設計サマリ + LHCI report artifact 参照
