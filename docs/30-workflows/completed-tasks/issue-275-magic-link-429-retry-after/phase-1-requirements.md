# Phase 1: 要件定義

> 実装区分: **実装完了仕様書**（コード変更・テスト追加・正本同期を同一サイクルで実施）

## 1. 背景

- `apps/api/src/middleware/rate-limit-magic-link.ts` は magic link POST に対し email/IP 単位 rate limit を実装済み。超過時は `apps/api/src/middleware/edge-rate-limit-headers.ts` の `buildRateLimitedResponse` を経由し、`HTTP 429` + `Retry-After: <sec>` + body `{ error: "rate_limited", retryAfterSec, reason }` を返却する。
- Web client (`apps/web/src/lib/auth/magic-link-client.ts`) はこの 429 を `MagicLinkRequestError(status=429)` で包んで throw するだけで、`Retry-After` ヘッダーや body の `retryAfterSec` を取り出していない。
- `MagicLinkForm` (`apps/web/app/login/_components/MagicLinkForm.client.tsx`) は catch 内で `replaceLoginState("error", redirect, { error: message })` を呼び、`error` URL state へ遷移してしまう。固定 60s cooldown が submit 成功時のみに走り、429 時は cooldown が走らないため、ユーザーが連打で再 429 を踏む。
- 結果として server-truth の `Retry-After` が無視され、UX とログ両方が劣化する。

## 2. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `sendMagicLink` は HTTP 429 を受信した際、`MagicLinkRateLimitedError extends MagicLinkRequestError` を throw する。`status=429`, `retryAfterSec: number`, `reason?: "edge" \| "app"` を保持する |
| FR-2 | `retryAfterSec` の解析優先順位は `Retry-After` ヘッダー → JSON body `retryAfterSec` → default `60`。負値 / 非整数 / NaN は default 60 にフォールバック |
| FR-3 | `MagicLinkForm` の catch ブロックは `MagicLinkRateLimitedError` を判別し、`setCooldown(retryAfterSec)` を呼び countdown を起動する |
| FR-4 | 429 時の URL state は `sent` に遷移させず `input` を維持する（mail 未送信） |
| FR-5 | 既存の 200 OK 経路は regression なし（成功時 60s 固定 cooldown / state=sent への遷移） |

## 3. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | reload を跨いだ cooldown 永続化はしない（session 内のみ）。AC 明記の除外項目 |
| NFR-2 | 既存テスト (`magic-link-client.spec.ts` / `MagicLinkForm.component.spec.tsx`) を 1 件も破壊しない |
| NFR-3 | `MagicLinkRateLimitedError` を含む全 typed error は `MagicLinkRequestError` の継承関係を維持し、既存 `instanceof MagicLinkRequestError` 判定を壊さない |
| NFR-4 | client bundle 増分はゼロまたは数百バイト以内（新規 export class 1 個分のみ） |

## 4. 受け入れ基準（AC）

- AC-1（typed error）: `sendMagicLink` 呼び出しで API が `HTTP 429` + `Retry-After: 60` を返したとき、`MagicLinkRateLimitedError`（`instanceof MagicLinkRequestError` も true）が throw され、`status === 429`, `retryAfterSec === 60` を満たす
- AC-2（countdown 起動）: `MagicLinkForm` に対し fetch mock で 429 + `Retry-After: 60` 応答を返すと、submit 後にボタンが `disabled` かつラベルに `60s` 相当の countdown 文字列が表示される
- AC-3（session 内復元のみ）: reload を跨いだ永続化は本タスク scope 外。仕様書にスコープ外として明記し、テスト対象としない
- AC-4（Vitest 検証）: 上記 AC-1 / AC-2 が `pnpm --filter @ubm-hyogo/web test` で deterministic に検証される（fetch mock 経由 / fake timer 利用）
- AC-5（不変条件）: 不変条件 #5 / #9 への抵触なし。`pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` PASS

## 5. スコープ確定

- 含む: `magic-link-client.ts` の typed error 追加 / 429 解析ロジック / `MagicLinkForm.client.tsx` の catch 分岐 / 上記 2 ファイルの spec 追加
- 含まない: reload 後 cooldown 復元 / マルチタブ同期 / API 側仕様変更 / `MagicLinkRequestError` 自体の rename
