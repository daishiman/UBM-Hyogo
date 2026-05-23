# Phase 2 成果物: logKvOperationError helper 設計

> AC-1, AC-2, AC-4 紐付け。本ファイルが helper 実装の**設計正本**。

## 1. 関数シグネチャ

```typescript
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

- **配置**: `apps/api/src/routes/internal/alert-relay.ts` の top-level（`createAlertRelayRoute` の外側、import 群直後）
- **可視性**: module 内 private（`export` キーワードを付けない）
- **戻り値**: `Promise<void>`（emit 失敗時も throw しない設計）

## 2. module top 採番

```typescript
// import 群の直後、helper / createAlertRelayRoute の前に配置
const isolateId = crypto.randomUUID();
```

- module ロード時に 1 回だけ評価される
- handler / helper 内で再採番しない
- isolate が再生成されると別 UUID になる（これが「isolate ライフサイクル代理識別子」として機能）

## 3. 内部仕様（step by step）

```typescript
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  // (1) errorClass 抽出
  const errorClass = err instanceof Error ? err.constructor.name : typeof err;

  // (2) dedupeKeyHash 計算（SHA-256 first 12 hex chars, lowercase）
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(dedupeKey),
  );
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  const dedupeKeyHash = hex.slice(0, 12);

  // (3) payload 構築
  const payload = {
    event: "alert_relay_kv_op_failed" as const,
    op,
    errorClass,
    dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  };

  // (4) emit（1 行 JSON）
  console.warn(JSON.stringify(payload));
}
```

> 上記は Phase 2 設計の **擬似実装**。実コードは Phase 6（implementation-steps.md）で確定する。

## 4. 設計上の決定事項

### 4.1 `async` である理由

`crypto.subtle.digest` が `Promise<ArrayBuffer>` を返すため。caller は `await logKvOperationError(...)` で待機する。

### 4.2 throw しない理由

helper 自体が emit パスの最終端であり、これが throw すると caller の catch を二重に汚す。emit 失敗（極めて稀）は黙って捨てる。

### 4.3 stack trace を含めない理由

Workers Logs の 1 行上限に当たりやすい（原典 6.2 章）。`errorClass` だけで十分に切り分け可能。

### 4.4 raw `dedupeKey` を含めない理由

容量圧迫回避 + 軽度の冗長化抑制（原典 6.4 章）。同一 key→同一 hash の再現性は保たれるため、後段集計の用途を満たす。

### 4.5 hex 化のループ実装

`Buffer.from(buf).toString("hex")` は Node.js API で Workers では使えない。`Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")` で同等。実装は Phase 6 で `for` ループか `Array.from` のいずれかを選択。

## 5. 呼出規約

| 呼出元 | 第 1 引数 `op` | 第 2 引数 `err` | 第 3 引数 `dedupeKey` |
| --- | --- | --- | --- |
| `get` catch ブロック（新設） | `"get"` | catch 変数 | handler scope の `dedupeKey` |
| `put` catch ブロック（既存置換） | `"put"` | catch 変数 | handler scope の `dedupeKey` |

両方とも `await` 必須（async 関数なので）。

## 6. 隔離性（private 維持）

- `export` キーワード禁止
- `export { logKvOperationError }` 等の再 export も禁止
- 単体テストは「helper を直接呼ぶ」のではなく「`createAlertRelayRoute` 経由で `KV.get` / `KV.put` を throw させ、`console.warn` を spy する」観測テストで担保（Phase 7 test-plan で詳細化）

## 7. AC マッピング

| AC | 該当箇所 |
| --- | --- |
| AC-1 | 第 2 節「module top 採番」 |
| AC-2 | 第 1 節「可視性: module 内 private」/ 第 6 節「隔離性」 |
| AC-4 | 第 3 節 (2) 「dedupeKeyHash 計算」 |
