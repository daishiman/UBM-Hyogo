# Phase 6: テスト拡充（fail path / regression guard）

## 6.1 追加テストケース

| ID    | 対象                                     | ケース                                                                        |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| TC-E1 | `server-fetch.env.spec.ts`                | `INTERNAL_API_BASE_URL` が URL として不正な値（`"not-a-url"`）→ throw         |
| TC-E2 | `server-fetch.env.spec.ts`                | API レスポンスが 500 のとき `fetchAdmin` が throw、メッセージに `path` を含む |
| TC-E3 | `server-fetch.env.spec.ts`                | API レスポンスが 401 のとき throw（layout の admin gate 二段防御の前提検証）   |
| TC-E4 | `server-fetch.env.spec.ts`                | `INTERNAL_API_BASE_URL` 未定義時に localhost fallback へ進まない              |
| TC-E5 | Playwright (既存 #849 smoke)              | mock-api ON で `/admin` が 200・KPI Grid が描画される（regression 再利用）    |

## 6.2 Playwright admin dashboard runtime smoke 再利用

```bash
# #849 で導入された smoke を再実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --config playwright.config.ts \
  -g "admin dashboard runtime"
```

`outputs/phase-6/playwright-result.txt` に保存。

## 6.3 fixture / production parity 確認

| 経路                          | 確認                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| Node test runtime + fixture   | `PLAYWRIGHT_TASK18_SMOKE=1` で fixture 経路が返ること      |
| Workers runtime + 実 API      | `getEnv()` 経由で `https://ubm-hyogo-api-staging...` に到達 |
| Workers runtime + 不正 binding | `EnvSchema.parse` throw → `error.tsx` で digest 表示       |
