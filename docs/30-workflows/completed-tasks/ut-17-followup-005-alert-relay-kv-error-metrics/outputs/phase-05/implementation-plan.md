# Phase 5 成果物: 実装計画書

## サマリ

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| 主要変更ファイル | `apps/api/src/routes/internal/alert-relay.ts`, `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`, `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |
| 新規ファイル | なし |
| 新規 npm package | なし |
| 新規 Cloudflare Secret | なし |

## 1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | module-top `isolateId` 採番、private helper `sha256Hex12` / `logKvOperationError` 追加、`KV.get` try/catch fail-open 化、`KV.put` catch を helper 呼び出しへ置換 | T1〜T4 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH 追加、既存 TC-KV-05 削除、`afterEach(() => vi.restoreAllMocks())` 追加 | T5 / T6 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクション追加 | T7 |
| 参照のみ | `apps/api/src/env.ts` / `apps/api/wrangler.toml` / `apps/api/test/helpers/kv-stub.ts` | 変更なし | — |

## 2. 主要関数シグネチャ

### 2-1. module-top 採番

```ts
const isolateId = crypto.randomUUID();
```

### 2-2. SHA-256 12 文字短縮

```ts
async function sha256Hex12(input: string): Promise<string>;
```

### 2-3. 構造化ログ emit

```ts
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

### 2-4. emit 接続

- `KV.get` 側: `let seen: string | null;` + `try/catch`、catch で `await logKvOperationError("get", error, dedupeKey); seen = null;`
- `KV.put` 側: 既存 catch を `await logKvOperationError("put", error, dedupeKey);` に置換、`return c.json({..., dedupPersisted: false})` は不変

## 3. 依存ランタイム API

| 名前 | 用途 |
| --- | --- |
| `crypto.randomUUID()` | `isolateId` 採番 |
| `crypto.subtle.digest("SHA-256", ...)` | `dedupeKeyHash` |
| `TextEncoder` | 文字列 → `Uint8Array` |
| `console.warn` | Workers Logs 経路 |
| `new Date().toISOString()` | ISO 8601 UTC タイムスタンプ |

新規 npm package / tsconfig 変更なし。

## 4. 実装順序（S1〜S8）

1. **S1**: module-top に `const isolateId = crypto.randomUUID();` 追加
2. **S2**: `sha256Hex12` / `logKvOperationError` 実装
3. **S3**: `KV.get` を try/catch で包み、catch で log + fail-open
4. **S4**: `KV.put` catch を `logKvOperationError("put", error, dedupeKey)` へ置換
5. **S5**: vitest 4 ケース追加 + `afterEach` 追加
6. **S6**: 既存 TC-KV-05 削除
7. **S7**: runbook 追記
8. **S8**: 品質ゲート（`pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test -- alert-relay.spec`）

## 5. 後方互換性 / 既存挙動変更

| 項目 | 変更前 | 変更後 | 区分 |
| --- | --- | --- | --- |
| `KV.get` throw 時 | unhandled（Hono 既定で 500） | warn emit + `seen=null` で Slack 配信続行 | **意図的な挙動変更（AC-10）** |
| `KV.put` throw 時 | plain object `console.warn` + `dedupPersisted: false` | 1 行 JSON `console.warn` + `dedupPersisted: false` | ログ schema のみ変更 |
| 成功路 | warn なし | warn なし | 不変 |
| Slack 配信 retry / dedupe TTL | 不変 | 不変 | 不変 |

## 6. 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec
```

## 7. リスク

| リスク | 緩和策 |
| --- | --- |
| `get` fail-open 化が regression | TC-KV-GET-THROW で Slack 配信成功を明示 assert |
| `vi.spyOn(console, "warn")` leak | `afterEach(() => vi.restoreAllMocks())` 必須 |
| `crypto.subtle.digest` の async が emit 順序を乱す | helper を `async` とし catch 内も `await` |
| Workers Logs 1 行上限超過 | stack trace 非含有 + `dedupeKey` を 12 char hash に短縮 |
| 後段 logpush 契約 break | `event` 文字列を `"alert_relay_kv_op_failed"` で固定 |
