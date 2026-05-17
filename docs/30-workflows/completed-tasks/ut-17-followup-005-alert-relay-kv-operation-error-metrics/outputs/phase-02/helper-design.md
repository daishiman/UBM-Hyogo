# Phase 2 成果物: helper 設計

## シグネチャ

```ts
// module-local (export しない)
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

## 実装擬似コード

```ts
const isolateId = crypto.randomUUID();
const textEncoder = new TextEncoder();

async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(dedupeKey));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  try {
    console.warn(JSON.stringify({
      event: "alert_relay_kv_op_failed",
      op,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      dedupeKeyHash: await computeDedupeKeyHash(dedupeKey),
      isolateId,
      ts: new Date().toISOString(),
    }));
  } catch {
    // crypto.subtle.digest 自体が失敗してもログ emit を諦めない (fail-safe)
    console.warn(JSON.stringify({
      event: "alert_relay_kv_op_failed",
      op,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      dedupeKeyHash: "hash_error",
      isolateId,
      ts: new Date().toISOString(),
    }));
  }
}
```

## 設計上の決定

- **module-local**: `export` しない。`alert-relay.ts` 外からの誤利用を防ぎ、UT-17-FU-005 の責務領域を当該ファイル内に閉じる。
- **async 返却**: `crypto.subtle.digest` が Promise を返すため必然。呼び出し側は `await logKvOperationError(...)` 形式。
- **emit は catch path のみ**: 成功 hot path（`get` 命中なし → `put` 成功）でのパフォーマンス影響ゼロ (AC-6)。
- **`console.warn` 呼び出しは 1 emit = 1 行**: logpush の 1 行 = 1 イベント前提と整合。
- **再 throw しない**: 呼び出し元の catch ブロックは fail-open のため、helper 内で再 throw すると fail-open 設計が崩れる。`computeDedupeKeyHash` 失敗時は `dedupeKeyHash: "hash_error"` で fallback emit し、`console.warn` 自体が失敗した場合は logging failure を握りつぶす。
- **`textEncoder` は module top で 1 度だけ生成**: 毎回 `new TextEncoder()` するより allocation コストを抑える。
