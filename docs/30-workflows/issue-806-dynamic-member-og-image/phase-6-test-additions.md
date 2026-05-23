# Phase 6: テスト追加

Phase 4 で計画したテストを、実装サイクルで必ず追加する。本 Phase は「実装済み」の宣言ではなく、実装者が Gate-B で完了確認するための受け入れチェックリストである。

## 1. 追加観点チェックリスト

- [x] route handler の `image/png` response / member content / 404 / error path 確認
- [ ] 正常 path：member 存在時に `image/png` Response を返す
- [ ] 404 path：`FetchPublicNotFoundError` → `notFound()` 呼出
- [ ] 例外 path：その他 error は rethrow
- [ ] page metadata：`og:image` と `twitter:image` が member-specific path
- [ ] Playwright：PNG 応答 + 404 応答 + meta path

## 2. テストしないケース（意図的に除外）

| ケース | 除外理由 |
|---|---|
| 画像 byte 比較 / pixel-perfect snapshot | フォントレンダリングの環境差で flaky になりやすく、benefit が低い |
| publicConsent=false の直接 unit test | API contract（`apps/api/src/routes/public/member-profile.ts` → `apps/api/src/use-cases/public/get-public-member-profile.ts` で 404 返却）に委譲し、`apps/web` では `FetchPublicNotFoundError` → `notFound()` mapping を検証する設計 |
| OpenNext Cloudflare runtime での実機検証 | Phase 11 manual test / deploy 後 smoke で担保 |

## 3. 実行コマンド再掲

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-metadata.spec.ts
```
