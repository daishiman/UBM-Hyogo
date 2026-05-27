# Phase 4: テスト計画

> 実装区分: **実装仕様書**

## 1. テスト戦略マトリクス

| Layer | テスト種別 | ツール | 対象 |
|---|---|---|---|
| Unit | client lib 429 解析 | Vitest + fetch mock (`apps/web/src/lib/test-utils/fetch-mock`) | `magic-link-client.ts` の 4 ケース（header / body / 両欠 / invalid header） |
| Component | form catch 分岐 | Vitest + Testing Library + fake timer | `MagicLinkForm.client.tsx` の 429 時 disabled+countdown / 既存 200 OK regression |
| E2E | 任意 | （なし） | Phase 11 で curl / 手動 only。Playwright 追加なし（rate limit window 60min は E2E に重い） |

## 2. 新規 / 更新する spec ファイル

### 2.1 更新: `apps/web/src/lib/auth/magic-link-client.spec.ts`

既存 describe `sendMagicLink` の末尾に以下 4 ケースを追加する。

```ts
import {
  MagicLinkRateLimitedError,
  MagicLinkRequestError,
  sendMagicLink,
} from "./magic-link-client";

describe("sendMagicLink 429 rate-limit handling", () => {
  it("429 + Retry-After: 60 ヘッダーで retryAfterSec=60 の typed error を throw", async () => {
    mockFetchOnce({
      status: 429,
      headers: { "Retry-After": "60" },
      body: { error: "rate_limited", retryAfterSec: 30, reason: "app" },
    });
    try {
      await sendMagicLink("u@example.com", "/profile");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MagicLinkRateLimitedError);
      expect(e).toBeInstanceOf(MagicLinkRequestError);
      const err = e as MagicLinkRateLimitedError;
      expect(err.status).toBe(429);
      expect(err.retryAfterSec).toBe(60); // header 優先
      expect(err.reason).toBe("app");
    }
  });

  it("429 + ヘッダー無し + body retryAfterSec=45 で 45 を採用", async () => {
    mockFetchOnce({
      status: 429,
      body: { error: "rate_limited", retryAfterSec: 45, reason: "edge" },
    });
    try {
      await sendMagicLink("u@example.com", "/profile");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MagicLinkRateLimitedError);
      const err = e as MagicLinkRateLimitedError;
      expect(err.retryAfterSec).toBe(45);
      expect(err.reason).toBe("edge");
    }
  });

  it("429 + ヘッダー無し + body retryAfterSec 無しで default 60", async () => {
    mockFetchOnce({ status: 429, body: {} });
    try {
      await sendMagicLink("u@example.com", "/profile");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MagicLinkRateLimitedError);
      const err = e as MagicLinkRateLimitedError;
      expect(err.retryAfterSec).toBe(60);
      expect(err.reason).toBeUndefined();
    }
  });

  it("429 + invalid Retry-After (NaN / 負値) は body fallback、無ければ default", async () => {
    mockFetchOnce({
      status: 429,
      headers: { "Retry-After": "abc" },
      body: { error: "rate_limited", retryAfterSec: -1 },
    });
    try {
      await sendMagicLink("u@example.com", "/profile");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MagicLinkRateLimitedError);
      const err = e as MagicLinkRateLimitedError;
      // header invalid + body invalid なので default
      expect(err.retryAfterSec).toBe(60);
    }
  });
});
```

> 既存 `mockFetchOnce` が `headers` オプションを受け付けるか事前確認する。受け付けない場合は test-utils を最小拡張する（同一 PR 内で許容）。

### 2.2 更新: `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx`

既存 describe `MagicLinkForm cooldown / U-03` に以下 2 ケースを追加する（または新 describe 分離可）。

```ts
import { MagicLinkRateLimitedError } from "../../../src/lib/auth/magic-link-client";

describe("MagicLinkForm 429 rate-limit / Issue #275", () => {
  it("429 受信時 button が disabled かつ retryAfterSec の countdown ラベル表示", async () => {
    mocks.sendMagicLink.mockRejectedValueOnce(
      new MagicLinkRateLimitedError(60, "app"),
    );

    render(<MagicLinkForm redirect="/profile" />);
    const input = screen.getByLabelText("メールアドレス") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "user@example.com" } });
    });

    const button = screen.getByRole("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.submit(button.closest("form")!);
      await Promise.resolve();
    });

    expect(button.disabled).toBe(true);
    expect(button.textContent).toMatch(/60s 後に再送可能/);
    // URL state は input 維持 → replaceLoginState("error", ...) が呼ばれていないこと
    expect(mocks.replaceLoginState).not.toHaveBeenCalledWith(
      "error",
      expect.anything(),
      expect.anything(),
    );
  });

  it("既存 200 OK 経路は regression なし (state=sent + 60s cooldown)", async () => {
    mocks.sendMagicLink.mockResolvedValueOnce({ state: "sent" as const });
    render(<MagicLinkForm redirect="/profile" />);
    const input = screen.getByLabelText("メールアドレス") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "user@example.com" } });
    });

    const button = screen.getByRole("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.submit(button.closest("form")!);
      await Promise.resolve();
    });

    expect(button.disabled).toBe(true);
    expect(button.textContent).toMatch(/60s 後に再送可能/);
    expect(mocks.replaceLoginState).toHaveBeenCalledWith("sent", "/profile");
  });
});
```

## 3. 期待カバレッジ

| 対象 | 目標 |
|---|---|
| `apps/web/src/lib/auth/magic-link-client.ts` | line ≥ 90% / branch ≥ 85%（既存 + 429 分岐 4 ケース） |
| `apps/web/app/login/_components/MagicLinkForm.client.tsx` | line ≥ 85% / branch ≥ 80%（既存 + catch 内 429 分岐） |

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx
```
