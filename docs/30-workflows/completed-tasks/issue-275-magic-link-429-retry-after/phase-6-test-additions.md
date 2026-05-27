# Phase 6: テスト追加

> 実装区分: **実装仕様書**

Phase 4 で計画したテストを、実装サイクルで必ず追加する。本 Phase は Gate-B での完了確認チェックリストである。

## 1. 追加観点チェックリスト

- [x] **client lib 429**:
  - [x] header `Retry-After` ありで header 秒数の `MagicLinkRateLimitedError` を throw
  - [x] header 無し + body `retryAfterSec` で body 秒数を採用
  - [x] header invalid + body invalid で default 60
  - [x] body JSON parse 失敗でも default 60
  - [x] `MagicLinkRateLimitedError` が `MagicLinkRequestError` の subclass であること（`instanceof` 検証）
- [x] **form component**:
  - [x] 429 受信時 button が disabled + label に countdown 文字列
  - [x] 429 受信時 `replaceLoginState("error", ...)` が呼ばれない（URL state input 維持）
  - [x] 200 OK 経路で `replaceLoginState("sent", "/profile")` + 60s cooldown が走る（regression）

## 2. テストしないケース（意図的に除外）

| ケース | 除外理由 |
|---|---|
| reload を跨いだ cooldown 復元 | AC 明記の scope 外（session 内のみ） |
| マルチタブ間 cooldown 同期 | scope 外。BroadcastChannel 等の追加実装は別タスク化検討 |
| Playwright で実 API を叩いて 429 検証 | rate limit window が 60min と長く E2E に不向き。client mock テストで AC 達成 |
| `Retry-After` の HTTP date 形式（RFC 7231） | API contract が `String(retryAfterSec)` の sec 整数のみ返す前提（`apps/api/src/middleware/edge-rate-limit-headers.ts` 確認済み） |

## 3. 実行コマンド再掲

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test
```

3 つ目は regression 全件確認。
