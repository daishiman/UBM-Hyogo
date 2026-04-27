# Phase 8: DRY 化（成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 8 / 13 |
| 状態 | completed |
| 上流 Phase | 7 (AC マトリクス) |
| 下流 Phase | 9 (品質保証) |

## 目的（再掲）

Before / After で重複削減（型 alias 統一 / zod helper 共通化 / Forms response mapper 共通化 / branded factory 共通化）を整理し、後続 Wave 2 / 3 / 4 が活用しやすい構造に整える。

## サブタスク実行結果

| # | サブタスク | 状態 | 結果 |
| --- | --- | --- | --- |
| 1 | Before（重複候補 4 件）抽出 | completed | 後述 4 件を確認 |
| 2 | After（DRY 案）実装 | completed | factory / helper / mapper / wrapper を実装 |
| 3 | 再利用度評価 | completed | Wave ごとの利用箇所を確定 |
| 4 | outputs 生成 | completed | 本ファイル配置 |

## DRY 化 4 件 — Before / After

### 1. branded type factory（`packages/shared/src/branded/index.ts` + `types/ids.ts`）

| Before | After |
| --- | --- |
| 各 branded ごとに `as*` 関数を手書き | `Brand<T, B>` + `createBrand<B>()` factory で 7 種一括生成 |

```ts
// packages/shared/src/branded/index.ts
export type Brand<T, B extends string> = T & { readonly __brand: B };
export const createBrand =
  <B extends string>() =>
  (s: string) => s as Brand<string, B>;

// packages/shared/src/types/ids.ts
export type MemberId      = Brand<string, "MemberId">;
export type ResponseId    = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey     = Brand<string, "StableKey">;
export type SessionId     = Brand<string, "SessionId">;
export type TagId         = Brand<string, "TagId">;
export type AdminId       = Brand<string, "AdminId">;

export const asMemberId      = createBrand<"MemberId">();
export const asResponseId    = createBrand<"ResponseId">();
export const asResponseEmail = createBrand<"ResponseEmail">();
export const asStableKey     = createBrand<"StableKey">();
export const asSessionId     = createBrand<"SessionId">();
export const asTagId         = createBrand<"TagId">();
export const asAdminId       = createBrand<"AdminId">();
```

検証: `packages/shared/src/types/ids.test.ts`（10 tests / PASS）。

### 2. zod email / datetime / stableKey helper（`packages/shared/src/zod/primitives.ts`）

| Before | After |
| --- | --- |
| `z.string().email()` を 5 箇所で書く | `ResponseEmailZ` を 1 箇所 export して field / response / viewmodel で再利用 |

```ts
// packages/shared/src/zod/primitives.ts
import { z } from "zod";
export const ResponseEmailZ = z.string().email().brand<"ResponseEmail">();
export const ISO8601Z       = z.string().datetime();
export const StableKeyZ     = z.string().min(1).brand<"StableKey">();
```

これにより `field.ts` / `response.ts` / `identity.ts` / `viewmodel.ts` が同じ primitive を import する形に統一。

### 3. Forms response mapper（`packages/integrations/google/src/forms/mapper.ts`）

| Before | After |
| --- | --- |
| `getForm` / `listResponses` でそれぞれ raw → domain 変換を書く | `mapper.ts` 共通化、`mapAnswer(rawAnswer): FormResponseAnswer` を export |

```ts
// packages/integrations/google/src/forms/mapper.ts
import type { FormResponseAnswer } from "@ubm-hyogo/shared";
export const mapAnswer = (raw: unknown): FormResponseAnswer => { /* 単一実装 */ };
```

→ `client.ts` 内の `getForm` / `listResponses` どちらも `mapAnswer` を呼ぶだけになり、後続 Wave 3a / 3b で同じ関数を reuse。

### 4. fetch + backoff wrapper（`packages/integrations/google/src/forms/backoff.ts`）

| Before | After |
| --- | --- |
| Forms client 内に直接 retry を書く | `withBackoff(fn, opts)` 関数化、Forms 以外の Google API でも再利用可 |

```ts
// packages/integrations/google/src/forms/backoff.ts
export class RetryableError extends Error {
  constructor(readonly status: number, message?: string) { super(message); }
}
export interface BackoffOpts { maxRetries: number; baseMs: number; }
export async function withBackoff<T>(fn: () => Promise<T>, opts: BackoffOpts): Promise<T>;

// retry 対象 status: 408 / 425 / 429 / 500 / 502 / 503 / 504
```

検証: `backoff.test.ts`（4 tests / PASS）。

## 再利用度評価

| 改善 | 利用箇所（実装済 + 計画） | 想定削減量 |
| --- | --- | --- |
| branded factory | shared 内部 7 箇所 → 1 factory | 約 35 行 → 7 行 |
| primitives helper（Email / ISO8601 / StableKey） | `field.ts` / `response.ts` / `identity.ts` / `viewmodel.ts` の 5 箇所 + Wave 4 viewmodel parse で再利用 | 約 20 行 → 3 行 |
| Forms response mapper | `forms/client.ts` の `getForm` / `listResponses` 双方 + Wave 3a / 3b（schema 監視 cron, response 同期 cron） | 重複 2 箇所 → 1 箇所 |
| backoff wrapper | `forms/client.ts`（getForm + listResponses）+ Wave 3a / 3b の他 google API cron でも reuse 可 | retry 配線が 1 行に短縮 |

## 完了確認

- [x] 4 件 DRY 化が実装済み
- [x] 各 helper / factory / mapper / wrapper が test で覆われる（130 tests / PASS）
- [x] 不変条件 #1（schema 抽象化により Wave 2/3 が同じ helper を使える）を満たす

## 次 Phase への引き継ぎ

- DRY 案は実装済みで Wave 2 / 3 / 4 から `import { ResponseEmailZ, withBackoff, mapAnswer, asMemberId } from "@ubm-hyogo/shared" / "@ubm-hyogo/integrations-google"` の形で利用可能。
- Phase 9 で secret hygiene と無料枠を確認する。
