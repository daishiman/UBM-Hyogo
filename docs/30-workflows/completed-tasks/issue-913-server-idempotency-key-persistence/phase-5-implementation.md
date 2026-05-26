# Phase 5: 実装手順

> 親 index: [index.md](index.md) / 前段: [phase-4-test-plan.md](phase-4-test-plan.md) / 次段: [phase-6-test-additions.md](phase-6-test-additions.md)
> Gate: Gate-A 通過後着手。本 Phase は仕様（コード非実装）。実装は user 明示承認後。

## 変更ファイル一覧

| パス | 種別 | 目的 |
|---|---|---|
| `apps/api/migrations/0021_idempotency_keys.sql` | 新規 | dedupe ストアの DDL |
| `apps/api/src/repository/idempotency.repository.ts` | 新規 | D1 CRUD + lazy GC |
| `apps/api/src/middleware/idempotency.ts` | 新規 | Hono middleware（横断適用） |
| `apps/api/src/routes/admin/_shared.ts` | 編集 | admin route group への配線 |

## 1. `apps/api/migrations/0021_idempotency_keys.sql`（新規）

### 番号確定手順

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
```

直近採番済が `0020_*` であることを確認した上で `0021` を採用する。並列 worktree で衝突した場合は max+1 に再採番する。

### DDL（仕様）

```sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_flight', 'completed')),
  response_status INTEGER,
  response_headers TEXT,
  response_body TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (key, method, path)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
  ON idempotency_keys (expires_at);
```

- `PRIMARY KEY (key, method, path)`: 同一 key を別 endpoint へ流用してもスコープ衝突しない設計
- `response_headers` / `response_body` は JSON 文字列（`response_body` は `NULL` 許容 = size 上限超過 skip）
- TTL は middleware 側で `created_at + DEFAULT_TTL_SECONDS` を入れる（DEFAULT_TTL_SECONDS=86400 を初期値とする）

## 2. `apps/api/src/repository/idempotency.repository.ts`（新規）

### 型

```ts
export type IdempotencyStatus = 'in_flight' | 'completed';

export interface IdempotencyRow {
  key: string;
  method: string;
  path: string;
  request_fingerprint: string;
  status: IdempotencyStatus;
  response_status: number | null;
  response_headers: string | null; // JSON
  response_body: string | null;    // JSON / text
  created_at: number;              // unix sec
  expires_at: number;              // unix sec
}

export interface IdempotencyScope {
  key: string;
  method: string;
  path: string;
}
```

### 関数シグネチャ

| 関数 | シグネチャ | 入出力 | エラー |
|---|---|---|---|
| `getByScope` | `(db: D1Database, scope: IdempotencyScope) => Promise<IdempotencyRow \| null>` | scope 一致行を返す。0 件は null | D1 例外は throw（呼び出し側で fail-open に倒す） |
| `insertInFlight` | `(db: D1Database, row: Omit<IdempotencyRow, 'status' \| 'response_status' \| 'response_headers' \| 'response_body'>) => Promise<{ inserted: boolean }>` | `INSERT OR IGNORE`（status='in_flight'）。`changes===0` なら inserted=false（race 検出） | D1 例外は throw |
| `completeWithResponse` | `(db: D1Database, scope: IdempotencyScope, payload: { status: number; headers: string; body: string \| null; }) => Promise<void>` | `UPDATE ... SET status='completed', response_*=...` | D1 例外は throw |
| `rollbackInFlight` | `(db: D1Database, scope: IdempotencyScope) => Promise<void>` | `DELETE` で in_flight 行を消す（handler 失敗時の再送許可） | D1 例外は throw |
| `gcExpired` | `(db: D1Database, now: number, limit?: number) => Promise<{ deleted: number }>` | `DELETE FROM ... WHERE expires_at < ? LIMIT ?`（既定 limit=100）。lazy 呼び出し | エラーは握り潰し（戻り値 `deleted: 0`） |
| `computeFingerprint` | `(method: string, path: string, bodyHash: string) => string` | 純粋関数。`sha256(method + ' ' + path + ' ' + bodyHash)` を hex 化 | n/a |
| `isExpired` | `(row: Pick<IdempotencyRow, 'expires_at'>, now: number) => boolean` | `expires_at <= now` を true | n/a |
| `shouldPersistResponse` | `(bytes: number, max: number) => boolean` | `bytes <= max` を true | n/a |

### 実装方針

- すべて `c.env.DB` の `D1Database` を引数注入（middleware 側で wiring）。repository から `getCloudflareContext()` を呼ばない
- prepared statement は関数内ローカル生成（再利用しない）。D1 binding は `.bind()` で全 placeholder 充填
- body hash は middleware で計算（repository は受け取るだけ）。アルゴリズムは Web Crypto `crypto.subtle.digest('SHA-256', utf8Bytes)` → hex

## 3. `apps/api/src/middleware/idempotency.ts`（新規）

### 型 export

```ts
export interface IdempotencyEnv {
  DB?: D1Database;
}

export interface IdempotencyOptions {
  ttlSeconds?: number;      // 既定 86400
  maxResponseBytes?: number; // 既定 64 * 1024
  headerName?: string;       // 既定 'Idempotency-Key'
  replayHeader?: string;     // 既定 'Idempotent-Replayed'
}

export interface IdempotencyContext {
  scope: IdempotencyScope;
  fingerprint: string;
  startedAt: number;
}
```

### middleware 仕様（Hono）

```ts
export function createIdempotencyMiddleware(opts?: IdempotencyOptions): MiddlewareHandler;
```

処理手順:

1. **method 判定**: `c.req.method` が `POST | PATCH | PUT | DELETE` 以外なら `await next()` で即時抜ける
2. **header 取得**: `c.req.header(opts.headerName)`。未設定なら `await next()` で抜ける（TC-01）
3. **fail-open**: `c.env.DB` が undefined なら warn log のみ出して `await next()`（TC-08）
4. **scope 構築**: `{ key, method, path: c.req.path }`
5. **fingerprint 計算**: body を `c.req.text()`（または `c.req.raw.clone()` 経由）で取得 → SHA-256 hex → `computeFingerprint`
6. **既存行確認**: `getByScope(db, scope)`
   - 行あり + `isExpired===false`:
     - fingerprint 不一致 → `c.json({ error: 'idempotency_fingerprint_mismatch' }, 422)` で return（TC-04）
     - `status==='in_flight'` → `c.json({ error: 'idempotency_in_flight' }, 409)` で return（TC-03）
     - `status==='completed'` → stored response 再生（`response_status` / parsed `response_headers` / `response_body`）+ `c.header(replayHeader, 'true')` で return（TC-02）
   - 行あり + expired → 続行（TTL 切れ。下記 INSERT で UPSERT 相当）
   - 行なし → 続行
7. **lazy GC**: `await gcExpired(db, now)`（失敗は無視。INSERT 前に 1 回だけ）
8. **in_flight INSERT**: `insertInFlight(db, { key, method, path, request_fingerprint, created_at: now, expires_at: now + ttl })`
   - expired 行が残っていた場合は前段 GC で消えている前提。`INSERT OR REPLACE` ではなく `INSERT OR IGNORE` を採用し、`inserted===false` なら race とみなし TC-03 と同じ 409 を返す
9. **handler 実行**: `await next()`
10. **handler 結果保存**:
    - `c.res.status >= 500` → `rollbackInFlight` で in_flight 行 DELETE（TC-05）。response はそのまま透過
    - `c.res.status < 500`:
      - response body を `c.res.clone().text()` で取得し UTF-8 byte 長を計測
      - `shouldPersistResponse(bytes, maxResponseBytes)` が true なら `completeWithResponse` で `response_body` 含めて UPDATE
      - false なら `completeWithResponse` で `response_body=NULL` のみ UPDATE（TC-07）
11. **例外**: handler 内で throw された場合は middleware 側で catch → `rollbackInFlight` → 再 throw（既存 error handler に委ねる）

### TTL 切れ + 既存行が同 PRIMARY KEY で残るケース

INSERT OR IGNORE では衝突回避になる。対策として step 7 の `gcExpired` で expired 行を確実に削除した後 INSERT する。仮に gcExpired が失敗してもその場合は 409 ではなく `INSERT OR REPLACE` への fallback を別 PR で検討（本タスクは lazy GC + INSERT OR IGNORE で固定。TC-06 では gcExpired が成功する前提）。

## 4. `apps/api/src/routes/admin/_shared.ts`（編集）

### 配線箇所

既存 `requireAdmin` middleware と同列に `idempotency` middleware を `app.use("*", ...)` で挿入する。挿入位置は **`requireAdmin` の後ろ**（認証通過後にのみ idempotency を評価する）。

```ts
// 既存
app.use('*', requireAdmin);
// 追加
app.use('*', createIdempotencyMiddleware());
```

> route 別の opt-in は本タスクでは行わない（admin 全 mutation に横断適用が要件）。GET も middleware 内で method 判定により no-op になる。

## 実装順序（TDD）

1. Phase 4 で作成した spec 2 本を import エラー fail 状態にしておく
2. migration SQL を作成 → local D1 へ `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --local` で適用
3. repository を実装 → unit spec（TC-R01..03）が GREEN
4. middleware を実装 → contract spec の TC-01 / TC-02 が GREEN
5. \_shared.ts を編集 → TC-03..08 を順に GREEN 化
6. `pnpm --filter @ubm-hyogo/api exec vitest run` / `--config=vitest.d1.config.ts` の両方が green

## 完了条件

- 上記 4 ファイルの差分方針（型 / SQL DDL / シグネチャ / エラーハンドリング）がすべて明文化されている
- Phase 6 でテストを拡充できる粒度になっている
- handler shape を一切変えていない（不変条件 7）
