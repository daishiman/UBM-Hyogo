# Phase 2 成果物: ログ schema 正本 (AC-3)

## Field 定義

| field | 型 | 必須 | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `event` | `"alert_relay_kv_op_failed"` (literal) | yes | `"alert_relay_kv_op_failed"` | discriminator。`grep` / logpush filter で先絞り |
| `op` | `"get" \| "put"` | yes | `"get"` | KV 操作種別 |
| `errorClass` | `string` | yes | `"TypeError"` / `"Error"` / `"string"` | `err instanceof Error ? err.constructor.name : typeof err` |
| `dedupeKeyHash` | `string` (12 hex chars) | yes | `"3a7f9c1d2e88"` | `SHA-256(dedupeKey)` 先頭 12 hex。算出失敗時のみ `"hash_error"` |
| `isolateId` | `string` (UUID v4) | yes | `"b3c2a1f0-4d5e-6789-abcd-ef0123456789"` | module top で 1 回採番した isolate ID |
| `ts` | `string` (ISO 8601 UTC) | yes | `"2026-05-16T12:34:56.789Z"` | `new Date().toISOString()` |

field 数は固定で **6 field**。`message` / `stack` / `dedupeKey` (raw) は emit しない。

## JSON サンプル

```json
{"event":"alert_relay_kv_op_failed","op":"get","errorClass":"Error","dedupeKeyHash":"3a7f9c1d2e88","isolateId":"b3c2a1f0-4d5e-6789-abcd-ef0123456789","ts":"2026-05-16T12:34:56.789Z"}
```

`JSON.stringify` で **1 行** に整形され、`console.warn` で **1 回** emit する。

## 後方互換性ポリシー (不変条件 7)

- **許容**: 新規 field の **追加のみ** (additive)。既存 field は永続的に保持。
- **禁止**: field 名の rename / 削除 / 型変更 / `event` literal の変更。
- **検証**: テスト (TC-LOG-01) で JSON の key 集合と型を assertion 化し、回帰検知する。

## errorClass 抽出ルール

```ts
const errorClass = err instanceof Error ? err.constructor.name : typeof err;
```

stack trace / message は emit しない（PII non-leak / Workers Logs 1 行容量）。

## dedupeKeyHash 算出失敗時の挙動

`crypto.subtle.digest` が失敗した場合のみ `dedupeKeyHash: "hash_error"` を埋めて emit する。`console.warn` 自体が失敗した場合も helper 自体は **再 throw しない**（fail-open）。これにより、helper 呼び出し元の catch path が二重例外で落ちないことを保証する。
