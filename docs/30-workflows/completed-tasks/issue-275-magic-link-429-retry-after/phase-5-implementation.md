# Phase 5: 実装手順

> 実装区分: **実装完了仕様書**（本サイクルでコード実装・テスト追加まで実施）

## 0. 事前確認

```bash
mise exec -- node -v   # v24.15.0
grep -n "MagicLinkRequestError\|sendMagicLink" apps/web/src/lib/auth/magic-link-client.ts
grep -n "setCooldown\|catch" apps/web/app/login/_components/MagicLinkForm.client.tsx
grep -n "buildRateLimitedResponse" apps/api/src/middleware/rate-limit-magic-link.ts apps/api/src/middleware/edge-rate-limit-headers.ts
```

## 1. Step 1: `apps/web/src/lib/auth/magic-link-client.ts` 修正

Phase 2 §1〜§3 の snippet を反映済み。

- `MagicLinkRateLimitedError` class を export 追加（`MagicLinkRequestError` 直後）
- module-private constants / helpers を追加: `DEFAULT_RETRY_AFTER_SEC = 60`, `parseRetryAfterSec`, `parseRateLimitBody`
- `sendMagicLink` 内で `fetch` 直後に `if (res.status === 429) { ... throw new MagicLinkRateLimitedError(...) }` を分岐。既存 `if (!res.ok && res.status !== 202)` より前に置く

## 2. Step 2: `apps/web/app/login/_components/MagicLinkForm.client.tsx` 修正

- import を `sendMagicLink` 単独 → `{ MagicLinkRateLimitedError, sendMagicLink }` に変更
- catch ブロックの先頭で `if (err instanceof MagicLinkRateLimitedError) { setCooldown(err.retryAfterSec); return; }` を追加
- 既存 `replaceLoginState("error", ...)` 分岐は他 error にのみ適用される形になる

## 3. Step 3: `apps/web/src/lib/auth/magic-link-client.spec.ts` 修正

Phase 4 §2.1 の 4 ケース describe を追加済み。既存 `describe("sendMagicLink", ...)` は維持する。

`mockFetchOnce` は現行 signature で `headers` オプションを受け付けるため、test util 変更は不要。

## 4. Step 4: `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` 修正

Phase 4 §2.2 の 2 ケースを追加済み。既存 describe `MagicLinkForm cooldown / U-03` のテストは維持する。

component spec では `vi.mock` 側の `MagicLinkRateLimitedError` class を使い、`mocks.sendMagicLink.mockRejectedValueOnce(new mocks.MagicLinkRateLimitedError(45, "app"))` 形式で typed error を投げ込む。

## 5. Step 5: 型・lint チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

エラーがあれば最大 3 サイクルで修正。

## 6. Step 6: Unit / Component テスト実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx
```

全 case PASS を確認。

## 7. Step 7: ビルド確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

`next build --webpack` が success かつ `apps/web/.open-next/` 配下に bundle が生成されることを確認。`[project]/...` 仮想 module specifier が混入していないことを `grep -r "\\[project\\]" apps/web/.open-next | head` で確認。

## 8. Step 8: ローカル動作確認（任意・Phase 11 で実施）

API 側を起動して 5 回以上連打して 429 を強制発生させ、`Retry-After` ヘッダー値が UI countdown に反映されることを確認する。詳細は Phase 11 参照。

## 9. DoD（Definition of Done）

- [x] `apps/web/src/lib/auth/magic-link-client.ts` に `MagicLinkRateLimitedError` が export 追加され、`sendMagicLink` が 429 時に header → body → default 60 の順で `retryAfterSec` を解決して throw
- [x] `apps/web/app/login/_components/MagicLinkForm.client.tsx` の catch ブロックが `MagicLinkRateLimitedError` を判別し `setCooldown(err.retryAfterSec)` を呼ぶ。URL state は input 維持
- [x] `apps/web/src/lib/auth/magic-link-client.spec.ts` に 429 関連 4 ケースが追加され全 PASS
- [x] `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` に 429 受信時 + 200 OK regression の 2 ケースが追加され全 PASS
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` 全 PASS
- [x] `pnpm --filter @ubm-hyogo/web test` が既存テスト + 新規テストで全 PASS（regression なし）
