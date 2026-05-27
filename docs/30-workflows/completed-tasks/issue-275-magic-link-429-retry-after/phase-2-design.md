# Phase 2: 設計

> 実装区分: **実装仕様書**

## 1. typed error 階層

```ts
// apps/web/src/lib/auth/magic-link-client.ts

export class MagicLinkRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MagicLinkRequestError";
    this.status = status;
  }
}

export class MagicLinkRateLimitedError extends MagicLinkRequestError {
  readonly retryAfterSec: number;
  readonly reason?: "edge" | "app";
  constructor(retryAfterSec: number, reason?: "edge" | "app", message = "rate_limited") {
    super(429, message);
    this.name = "MagicLinkRateLimitedError";
    this.retryAfterSec = retryAfterSec;
    this.reason = reason;
  }
}
```

- 継承関係: `MagicLinkRateLimitedError` extends `MagicLinkRequestError` extends `Error`
- 既存 `instanceof MagicLinkRequestError` 判定は 429 でも true（後方互換）
- 429 のみが `MagicLinkRateLimitedError`、他 status は従来通り `MagicLinkRequestError`

## 2. 429 解析優先順位

```
1. response.headers.get("Retry-After") を Number(...) で parse
   → Number.isFinite(n) && Number.isInteger(n) && n >= 1 なら採用
2. response.json() の retryAfterSec field を取り出し
   → 同条件で採用
3. いずれも該当しなければ default 60
```

`reason` は body から `"edge" | "app"` のみ採用、それ以外は `undefined`。

擬似コード:

```ts
const DEFAULT_RETRY_AFTER_SEC = 60;

const parseRetryAfterFromHeader = (h: string | null): number | null => {
  if (!h) return null;
  const n = Number(h);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
};

const parseRetryAfterFromBody = (
  body: unknown,
): { retryAfterSec: number | null; reason: "edge" | "app" | undefined } => {
  if (!body || typeof body !== "object") return { retryAfterSec: null, reason: undefined };
  const b = body as { retryAfterSec?: unknown; reason?: unknown };
  const n =
    typeof b.retryAfterSec === "number" &&
    Number.isFinite(b.retryAfterSec) &&
    Number.isInteger(b.retryAfterSec) &&
    b.retryAfterSec >= 1
      ? b.retryAfterSec
      : null;
  const reason = b.reason === "edge" || b.reason === "app" ? b.reason : undefined;
  return { retryAfterSec: n, reason };
};
```

## 3. `sendMagicLink` の修正範囲

```ts
export const sendMagicLink = async (
  email: string,
  redirect: string,
): Promise<SendMagicLinkResponse> => {
  const res = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, redirect }),
  });

  // --- 新規: 429 を typed error として最優先で分岐 ---
  if (res.status === 429) {
    const headerSec = parseRetryAfterFromHeader(res.headers.get("Retry-After"));
    const body = await res.json().catch(() => null);
    const { retryAfterSec: bodySec, reason } = parseRetryAfterFromBody(body);
    const retryAfterSec = headerSec ?? bodySec ?? DEFAULT_RETRY_AFTER_SEC;
    throw new MagicLinkRateLimitedError(retryAfterSec, reason);
  }
  // --- 以降は既存ロジック ---

  if (!res.ok && res.status !== 202) {
    const text = await res.text().catch(() => "");
    throw new MagicLinkRequestError(res.status, text || `HTTP ${res.status}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    state?: unknown;
    email?: unknown;
  };
  const state: LoginGateState = isLoginGateState(data.state) ? data.state : "sent";
  const out: SendMagicLinkResponse =
    typeof data.email === "string" ? { state, email: data.email } : { state };
  return out;
};
```

## 4. `MagicLinkForm` 側 state 遷移

```
[submit click] → setSubmitting(true)
      |
      ├─ try { sendMagicLink(...) }
      |   |
      |   ├─ resolve → setCooldown(60) + replaceLoginState("sent") + router.refresh()
      |   |
      |   └─ reject:
      |      ├─ instanceof MagicLinkRateLimitedError
      |      |    → setCooldown(err.retryAfterSec)
      |      |    （replaceLoginState は呼ばない or input 維持 → router.refresh しない）
      |      └─ other Error → 既存通り replaceLoginState("error", ..., { error })
      |
      └─ finally { setSubmitting(false) }
```

差分要点（catch ブロック）:

```diff
   } catch (err) {
+    if (err instanceof MagicLinkRateLimitedError) {
+      setCooldown(err.retryAfterSec);
+      // URL state は "input" 維持（mail 未送信のため "sent" に遷移させない）
+      return;
+    }
     const message = err instanceof Error ? err.message : "送信に失敗しました";
     replaceLoginState("error", redirect, {
       error: message.slice(0, ERROR_MAX_LENGTH),
     });
     router.refresh();
   }
```

新規 import:

```diff
- import { sendMagicLink } from "../../../src/lib/auth/magic-link-client";
+ import {
+   MagicLinkRateLimitedError,
+   sendMagicLink,
+ } from "../../../src/lib/auth/magic-link-client";
```

## 5. cooldown timer の既存実装再利用

`useEffect(() => { ... setInterval ... }, [cooldown])` は既存実装をそのまま使う。`setCooldown(retryAfterSec)` を呼ぶと既存 timer が cooldown==0 まで走る。timer 二重起動の防止は既存 `timerRef` で担保済み。

## 6. button ラベル

既存 `cooldown > 0 ? ${cooldown}s 後に再送可能 : "マジックリンクを送る"` がそのまま使える。429 由来でも label の表現は統一する（UX 一貫性）。

## 7. accessibility / a11y 観点

- `disabled` 属性は既存条件 `submitting || cooldown > 0 || email.length === 0` で満たされる
- 追加の `aria-live` 領域は本タスク範囲外（既存に存在しないため）
