# Phase 5 成果物: 実装計画 (CONST_005 準拠)

## 5-1. 変更対象ファイル

| 種別 | パス | 役割 | 想定 LOC |
| --- | --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | `isolateId` / `textEncoder` / `computeDedupeKeyHash` / `logKvOperationError` / `KV.get` try/catch / `KV.put` catch 置換 | +45 / -5 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | TC-LOG-01〜08 の 8 ケース追加 | +150 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | section 5「KV 操作エラーログ確認」追加 | +49 |

新規作成・削除ファイルなし。`apps/web/` 配下不変。`wrangler.toml` / `apps/api/src/env.ts` 不変。

## 5-2. 関数シグネチャ

```ts
// module-local (export なし)
const isolateId: string;
const textEncoder: TextEncoder;
async function computeDedupeKeyHash(dedupeKey: string): Promise<string>;
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

## 5-3. 型定義

| 型 | 内容 | 配置 |
| --- | --- | --- |
| `op` parameter | `"get" \| "put"` (リテラル union) | helper signature 内 |
| `errorClass` derivation | `err instanceof Error ? err.constructor.name : typeof err` | helper 内 |
| log payload | `{ event: "alert_relay_kv_op_failed", op, errorClass, dedupeKeyHash, isolateId, ts }` | inline (export なし) |

`AlertRelayEnv` interface / `AlertRelayDeps` interface は変更しない。

## 5-4. 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `computeDedupeKeyHash` | `dedupeKey: string` | `Promise<string>` (12 hex) | なし（pure） |
| `logKvOperationError` | `op`, `err`, `dedupeKey` | `Promise<void>` | `console.warn(JSON.stringify(...))` を 1 回呼ぶ |
| `KV.get` catch (`alert-relay.ts:104-108`) | KV throw | `seen=null` 継続 | helper 呼び出し |
| `KV.put` catch (`alert-relay.ts:139-142`) | KV throw | 既存 response 返却 | helper 呼び出し |

## 5-5. 依存ライブラリ

| 依存 | 用途 | 追加要否 |
| --- | --- | --- |
| `crypto.randomUUID()` | isolateId 採番 | Workers runtime 標準（追加不要） |
| `crypto.subtle.digest("SHA-256", ...)` | dedupeKeyHash 算出 | Workers runtime 標準（追加不要） |
| `TextEncoder` | UTF-8 byte 列化 | Workers runtime 標準（追加不要） |
| `vi.spyOn` / `vi.clearAllMocks` / `vi.restoreAllMocks` | テスト spy | vitest 既存（追加不要） |

新規 npm 依存追加なし。`package.json` / `pnpm-lock.yaml` 変更なし。

## 5-6. 実装順序

T-01 → T-02 → T-03 → T-04 → (T-05 // T-06) → T-07 → T-08 → T-09

Phase 4 critical-path.md と同期。実装中は Phase 6 implementation-steps.md の snippet をそのまま採用する。

## 5-7. 不変条件チェックリスト

- [ ] `*.test.ts` 新規作成なし（CLAUDE.md 不変条件 8）
- [ ] D1 binding 不使用（不変条件 5）
- [ ] `wrangler` 直接呼び出しなし（CLAUDE.md ルール）
- [ ] secret 追加なし
- [ ] `apps/web/` 配下不変
- [ ] export surface 不変（`createAlertRelayRoute` / `AlertRelayEnv` / `AlertRelayDeps` のみ既存）
- [ ] response 契約不変（`{ ok: true, deduped: true }` / 502 / `{ ok: true, attempts, dedupPersisted: false }` / `{ ok: true, attempts }`）
- [ ] ログ schema additive only（既存 field 削除・rename なし）

## 5-8. Phase 6 への引き継ぎ

- 全 snippet を Phase 6 `implementation-steps.md` に集約する
- T-07 のテストコードは `vi.spyOn(console, 'warn')` + KV stub の `getError` / `putError` injection ベースで記述
- behaviour change（`KV.get` fail-closed → fail-open）は Phase 9 受入確認で改めて grep / test で検証
