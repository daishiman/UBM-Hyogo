# Phase 2 成果物: 構造化ログ JSON schema 正本

> AC-3, AC-4 紐付け。本ファイルが alert-relay KV 操作エラーログ schema の**正本**。
> 後段 logpush / Workers Logs filter / dashboard 化は本 schema を契約として扱う。

## 1. schema 定義

`apps/api/src/routes/internal/alert-relay.ts` から emit される構造化ログは、以下の固定 schema を持つ単一行 JSON 文字列である。

```typescript
interface AlertRelayKvOpFailedLog {
  /** 後段 logpush filter 用 anchor。文字列リテラル固定。 */
  event: "alert_relay_kv_op_failed";

  /** 失敗した KV 操作の種別。 */
  op: "get" | "put";

  /** Error クラス名。stack trace は含めない。 */
  errorClass: string;

  /** SHA-256(dedupeKey) の lowercase hex first 12 chars。 */
  dedupeKeyHash: string;

  /** module top で 1 回採番された isolate 代理識別子（UUID v4）。 */
  isolateId: string;

  /** ISO8601 形式のタイムスタンプ（例: "2026-05-16T03:24:11.123Z"）。 */
  ts: string;
}
```

## 2. 出力形式

```typescript
console.warn(JSON.stringify(payload));
```

- 1 行 JSON 文字列として `console.warn` に渡す（Workers Logs での `grep` 互換性のため）
- 改行・インデント禁止
- 余計な prefix / suffix 禁止

## 3. field 仕様

### 3.1 `event`

- 型: `string`
- 値: `"alert_relay_kv_op_failed"` 固定リテラル
- **不変条件**: この文字列は後段 logpush の filter 契約。改名は互換性 break を伴う

### 3.2 `op`

- 型: `"get" | "put"`
- 取り得る値:
  - `"get"`: `env.ALERT_DEDUP_KV.get(dedupeKey)` の失敗
  - `"put"`: `env.ALERT_DEDUP_KV.put(dedupeKey, "1", ...)` の失敗

### 3.3 `errorClass`

- 型: `string`
- 計算式: `err instanceof Error ? err.constructor.name : typeof err`
- 例値: `"Error"`, `"TypeError"`, `"KVError"`, `"string"`
- **不変条件**: stack trace / message 本文は含めない（Workers Logs の 1 行上限対策）

### 3.4 `dedupeKeyHash`

- 型: `string`（lowercase hex 12 文字）
- 計算式:
  1. `const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey));`
  2. `Uint8Array(buf)` を 1 バイトずつ `toString(16).padStart(2, "0")` で hex 化し連結
  3. 連結結果の **first 12 chars** を取り出し（lowercase）
- 例値: `"a3f2d1c8e9b4"`
- **不変条件**:
  - 同一 `dedupeKey` に対し常に同一 hash を返す（後段「key 別失敗率」集計の再現性確保）
  - raw `dedupeKey` 自体はログに出さない（容量圧迫回避）

### 3.5 `isolateId`

- 型: `string`（UUID v4 形式）
- 計算式: `crypto.randomUUID()` を module top で 1 回呼ぶ
- 例値: `"7f3a9b2e-1c4d-4e8f-9a0b-c1d2e3f4a5b6"`
- **不変条件**:
  - handler 内で再採番しない（同一 isolate のログを集約する目的）
  - isolate 再生成時には別 UUID になる（完全な isolate 識別ではないが代理識別子として機能）

### 3.6 `ts`

- 型: `string`（ISO8601）
- 計算式: `new Date().toISOString()`
- 例値: `"2026-05-16T03:24:11.123Z"`

## 4. 完全な出力例

### 例 1: KV `get` 失敗

```json
{"event":"alert_relay_kv_op_failed","op":"get","errorClass":"Error","dedupeKeyHash":"a3f2d1c8e9b4","isolateId":"7f3a9b2e-1c4d-4e8f-9a0b-c1d2e3f4a5b6","ts":"2026-05-16T03:24:11.123Z"}
```

### 例 2: KV `put` 失敗

```json
{"event":"alert_relay_kv_op_failed","op":"put","errorClass":"TypeError","dedupeKeyHash":"a3f2d1c8e9b4","isolateId":"7f3a9b2e-1c4d-4e8f-9a0b-c1d2e3f4a5b6","ts":"2026-05-16T03:24:11.456Z"}
```

## 5. 後段消費契約

### 5.1 grep filter（runbook 用）

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed
```

### 5.2 op 別カウント例

```bash
... | grep alert_relay_kv_op_failed | grep '"op":"get"' | wc -l
... | grep alert_relay_kv_op_failed | grep '"op":"put"' | wc -l
```

### 5.3 dashboard 化（UT-17-FU-006 想定）

- `errorClass` 別の時系列集計
- `op` 別の発生率
- `isolateId` 別の集約（isolate 寿命相当の窓で集計）

## 6. 互換性ポリシー

- field 追加は OK（後段が未知 field を無視する設計のため）
- field 削除 / 改名 / 型変更は logpush 契約 break を伴うため、本 workflow の続編 issue を立てて段階移行する
- `event` 文字列リテラル `"alert_relay_kv_op_failed"` は**絶対不変**
