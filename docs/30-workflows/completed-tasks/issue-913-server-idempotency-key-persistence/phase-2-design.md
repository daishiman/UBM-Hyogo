# Phase 2: 設計

> 本 Phase は後続フェーズが参照する **設計の正本**。schema・middleware フロー・repository signature・配線方針はここで確定する。

## 1. 設計方針（責務境界）

| レイヤ | 責務 | 状態所有 |
|---|---|---|
| `idempotency_keys` テーブル（D1） | dedupe record の永続化（scope = key + method + path）| D1（apps/api 内部のみ） |
| `idempotency.repository.ts` | `c.env.DB` 経由の純粋 CRUD + lazy GC。Hono ctx 不依存 | なし（pure functions） |
| `idempotency.ts` middleware（Hono） | header 検出 → fingerprint 計算 → in_flight INSERT → next() → 結果保存 / 再生 / 409 / 422 / 5xx rollback | request scope のみ（middleware 内 closure） |
| admin route（既存 handler） | リソース固有ロジック（**変更しない**） | resource state |
| `apps/api/src/routes/admin/_shared.ts` | admin route group の middleware chain 定義（`requireAdmin` と同列に `idempotency` を追加） | なし |

**バランスループ**: TTL 短すぎ → retry window 内に record 消失 → 二重書き込み許容。TTL 長すぎ → テーブル肥大化。既定 24h で安全側。
**強化ループ**: 永続化を middleware に集約 → 既存 handler 改変不要 → admin 横展開コストが線形 0 に近づく。

## 2. D1 schema（DDL）

> 起源 spec §3.1 を再掲。**migration 番号 `NN` は Phase 1 で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` 実行後に確定**する（並列 worktree の番号衝突回避。現状最大 `0020_*` のため暫定 `0021` だが Phase 1 出力で確定する）。

```sql
-- apps/api/migrations/00NN_idempotency_keys.sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key     TEXT NOT NULL,
  request_method      TEXT NOT NULL,
  request_path        TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'in_flight',
  response_status     INTEGER,
  response_body       TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at        TEXT,
  expires_at          TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key_scope
  ON idempotency_keys(idempotency_key, request_method, request_path);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_keys(expires_at);
```

**設計上の決定**:

| 論点 | 決定 | 理由 |
|---|---|---|
| 主キー | `(idempotency_key, request_method, request_path)` UNIQUE index | 同一 key を別 endpoint で使い回しても誤再生しない。INSERT の UNIQUE 衝突で初回/再送を楽観ロック判定 |
| status enum | `'in_flight'` / `'completed'` の TEXT（CHECK 制約は付けない） | D1 / SQLite の運用慣行（既存 migration も CHECK は最小限）。値は middleware 側で固定 |
| response_body 型 | TEXT（JSON 文字列を生で保存） | D1 BLOB を避け、再生時は `new Response(text, { status, headers })` で構築 |
| `expires_at` の型 | TEXT（ISO8601 UTC `Z` 終端） | 既存 D1 schema と一貫（`strftime('%Y-%m-%dT%H:%M:%fZ','now')` 形式） |
| GC 用 index | `idx_idempotency_expires` 単独 | `DELETE WHERE expires_at < ?` の lazy GC を index ヒットで O(log N) |

## 3. Hono middleware フロー（`apps/api/src/middleware/idempotency.ts`）

### 3.1 入出力契約

```ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../types"; // 既存 Env 型を流用

export const idempotency: MiddlewareHandler<Env> = async (c, next) => {
  /* §3.2 のフローを実装 */
};
```

### 3.2 フローチャート（擬似コード）

```
[entry]
  ├─ key = c.req.header("Idempotency-Key")
  ├─ if (!key) → return await next()                    // AC-1 後方互換
  │
  ├─ method = c.req.method                              // "POST" | "PATCH" | "PUT" | "DELETE"
  ├─ path   = new URL(c.req.url).pathname               // query string 除外
  ├─ body   = await c.req.text()                        // 1 回だけ消費 → 後で req を再構築
  ├─ fingerprint = sha256Hex(method + "\n" + path + "\n" + body)
  ├─ now = new Date()
  ├─ expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS).toISOString()
  │
  ├─ // lazy GC: 同 (key, method, path) scope の expired 行を遅延 DELETE
  ├─ await repo.gcExpired(c.env.DB, { key, method, path, now })
  │
  ├─ // 楽観ロック: UNIQUE 制約付き in_flight INSERT を試みる
  ├─ inserted = await repo.insertInFlight(c.env.DB, {
  │     key, method, path, fingerprint, expiresAt, status: "in_flight",
  │   })                                                  // 衝突時は inserted=false
  │
  ├─ if (inserted) {
  │     // ─── 初回 ───
  │     // body を再構築して handler が読めるようにする
  │     c.req.raw = new Request(c.req.raw.url, { ...c.req.raw, body, duplex: "half" })
  │     await next()
  │
  │     const status = c.res.status
  │     if (status >= 500) {
  │       // AC-6 失敗は冪等化しない → in_flight 行を DELETE
  │       await repo.rollbackInFlight(c.env.DB, { key, method, path })
  │       return
  │     }
  │
  │     const ct = c.res.headers.get("content-type") ?? ""
  │     if (!ct.includes("application/json")) {
  │       // AC-10 非 JSON は保存対象外 → in_flight を DELETE（再送時再実行）
  │       await repo.rollbackInFlight(c.env.DB, { key, method, path })
  │       return
  │     }
  │
  │     const cloned = c.res.clone()
  │     const respBody = await cloned.text()
  │     if (respBody.length > MAX_RESPONSE_BYTES /* 64 * 1024 */) {
  │       // AC-9 size 上限超過 → 保存スキップ。in_flight は DELETE
  │       await repo.rollbackInFlight(c.env.DB, { key, method, path })
  │       return
  │     }
  │
  │     await repo.completeWithResponse(c.env.DB, {
  │       key, method, path,
  │       responseStatus: status, responseBody: respBody,
  │       completedAt: new Date().toISOString(),
  │     })
  │     return
  │   }
  │
  ├─ // ─── 再送 or 並行 ───（UNIQUE 衝突）
  ├─ existing = await repo.getByScope(c.env.DB, { key, method, path })
  │
  ├─ if (!existing) {
  │     // race window で他リクエストの DELETE と同時発生。安全側で next()
  │     // body を再構築して handler に渡す
  │     c.req.raw = new Request(c.req.raw.url, { ...c.req.raw, body, duplex: "half" })
  │     return await next()
  │   }
  │
  ├─ if (existing.request_fingerprint !== fingerprint) {
  │     // AC-5 同 key で body 不一致 = client 不正使用
  │     return c.json({ code: "IDEMPOTENCY_KEY_FINGERPRINT_MISMATCH" }, 422)
  │   }
  │
  ├─ if (existing.status === "in_flight") {
  │     // AC-4 並行リクエスト
  │     return c.json({ code: "IDEMPOTENCY_KEY_IN_FLIGHT" }, 409)
  │   }
  │
  └─ // status === "completed" → AC-3 再生
     return new Response(existing.response_body ?? "", {
       status: existing.response_status ?? 200,
       headers: { "content-type": "application/json", "x-idempotent-replay": "1" },
     })
```

### 3.3 定数

```ts
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24h（AC-7）
const MAX_RESPONSE_BYTES = 64 * 1024;            // 64KB（AC-9）
```

### 3.4 fingerprint 計算

- アルゴリズム: SHA-256（Web Crypto API `crypto.subtle.digest`）→ hex string
- 入力: `method + "\n" + path + "\n" + body`（path は query string を含めない / body は raw text）
- 理由: 暗号学的衝突耐性は不要だが分布の良さ重視。Workers runtime で SubtleCrypto が標準で使えるため依存追加不要

### 3.5 c.req.raw body 消費の扱い

middleware が `await c.req.text()` で body を読むと handler 側で再度読めなくなるため、`c.req.raw = new Request(url, { ...init, body })` で書き戻す。`duplex: "half"` が必要な runtime もあるため明示する。

## 4. Repository インタフェース（`apps/api/src/repository/idempotency.repository.ts`）

```ts
import type { D1Database } from "@cloudflare/workers-types";

export type IdempotencyStatus = "in_flight" | "completed";

export interface IdempotencyScope {
  readonly key: string;
  readonly method: string;
  readonly path: string;
}

export interface IdempotencyRecord {
  readonly idempotency_key: string;
  readonly request_method: string;
  readonly request_path: string;
  readonly request_fingerprint: string;
  readonly status: IdempotencyStatus;
  readonly response_status: number | null;
  readonly response_body: string | null;
  readonly created_at: string;
  readonly completed_at: string | null;
  readonly expires_at: string;
}

/** 指定 scope の record を取得（再送 / 並行検出用）。expired は対象外 */
export function getByScope(
  db: D1Database,
  scope: IdempotencyScope,
): Promise<IdempotencyRecord | null>;

/**
 * in_flight 行を UNIQUE 制約付き INSERT。
 * UNIQUE 衝突時は false を返す（throw しない）。SQLite の `INSERT ... ON CONFLICT DO NOTHING` を使い、
 * `changes()` で挿入有無を判定する。
 */
export function insertInFlight(
  db: D1Database,
  input: IdempotencyScope & {
    readonly fingerprint: string;
    readonly expiresAt: string;
  },
): Promise<boolean>;

/** 初回 handler 完了時に response を保存し status='completed' に遷移 */
export function completeWithResponse(
  db: D1Database,
  input: IdempotencyScope & {
    readonly responseStatus: number;
    readonly responseBody: string;
    readonly completedAt: string;
  },
): Promise<void>;

/** handler throw / 5xx / size 超過 / 非 JSON 時に in_flight 行を物理 DELETE */
export function rollbackInFlight(
  db: D1Database,
  scope: IdempotencyScope,
): Promise<void>;

/**
 * lazy GC: 指定 scope と同 (method, path) の expired 行を DELETE。
 * INSERT 直前に呼ぶことで「expired 同 scope record の存在」を消し、
 * UNIQUE 衝突で新規 INSERT が阻まれることを防ぐ。
 */
export function gcExpired(
  db: D1Database,
  input: Omit<IdempotencyScope, "key"> & { readonly key: string; readonly now: Date },
): Promise<void>;
```

**設計上の決定**:

| 論点 | 決定 | 理由 |
|---|---|---|
| `insertInFlight` の race 解決 | `INSERT ... ON CONFLICT(...) DO NOTHING` + `db.prepare(...).run()` の `meta.changes` で挿入有無判定 | read-then-write を禁止し UNIQUE INDEX で楽観ロック（起源 spec §苦戦箇所 race 対策） |
| `rollbackInFlight` の対象 | `WHERE idempotency_key=? AND request_method=? AND request_path=? AND status='in_flight'` で物理 DELETE | status='completed' を誤削除しないガード |
| `gcExpired` の対象 | `WHERE request_method=? AND request_path=? AND expires_at < ?`（同一 path scope の expired 全件） | INSERT 直前の最小スコープ GC。テーブル全体のフル scan を避ける |
| トランザクション | D1 に明示 BEGIN/COMMIT は使わない（D1 batch API は使用検討可だが本フローでは不要） | 単一 SQL の atomicity に依存。各 mutation は単発 prepare で完結 |

## 5. レスポンス再生方針

- 再生レスポンスは `new Response(body, { status, headers })` で構築し、`content-type: application/json` を固定で付与
- `x-idempotent-replay: "1"` header を付加し、観測時に再生か否かを区別可能にする（debug 用途。client が依存しない非破壊 hint）
- body は raw text 保存（パース・再シリアライズしない）。client から見て完全に同一バイト列を返すため透明
- `c.res.clone()` で読み取り、元レスポンスは消費せず handler の出力をそのまま client に返す

## 6. TTL / lazy GC

- TTL 既定: **24h**（`IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000`）
  - client `useAdminMutation` の retry backoff window（`maxDelayMs=2000ms` ・ 最大 3 attempt で数秒オーダー）より十分長く
  - 1 record あたり数 KB × admin mutation 頻度（実測小）で 24h 蓄積しても D1 quota 内
- lazy GC: `insertInFlight` 直前に同 `(method, path)` scope の `expires_at < now` を DELETE
- Cron / Queue を使わない（CLAUDE.md Free plan 制約 / 起源 spec §3.4）

## 7. 配線方針（`apps/api/src/routes/admin/_shared.ts`）

```ts
// apps/api/src/routes/admin/_shared.ts（既存 file への追加方針）
import { requireAdmin } from "../../middleware/require-admin";
import { idempotency } from "../../middleware/idempotency"; // ← 新規

export function applyAdminMiddleware(app: Hono<Env>): void {
  app.use("*", requireAdmin);
  app.use("*", idempotency); // ← requireAdmin と同列で追加
}
```

- 既存 admin route file（`apps/api/src/routes/admin/member-status.ts` L34 / `tags-queue.ts` L45 等）が個別に `app.use("*", requireAdmin)` を書いている場合、本タスクではそれらを **触らず** に、`_shared.ts` で集約 helper を提供し、必要箇所のみ helper 呼び出しに置き換える方針を Phase 5 で確定する
- middleware 順序: `requireAdmin` → `idempotency` の順（認可失敗時は idempotency record を作らない）

## 8. エラーハンドリング

| 状況 | middleware の挙動 | レスポンス |
|---|---|---|
| `Idempotency-Key` header なし | next() 通過 | handler 出力をそのまま |
| 初回 INSERT 成功 + handler 2xx/3xx/4xx | response 保存 + completed 遷移 | handler 出力 |
| 初回 INSERT 成功 + handler 5xx | in_flight DELETE | handler 出力（5xx そのまま。client retry 可） |
| 初回 INSERT 成功 + handler throw | in_flight DELETE + 例外再 throw（Hono の onError に委ねる） | Hono デフォルト or onError の出力 |
| UNIQUE 衝突 + completed + fingerprint 一致 | replay | 保存済 status + body |
| UNIQUE 衝突 + in_flight + fingerprint 一致 | 409 | `{ code: "IDEMPOTENCY_KEY_IN_FLIGHT" }` |
| UNIQUE 衝突 + fingerprint 不一致 | 422 | `{ code: "IDEMPOTENCY_KEY_FINGERPRINT_MISMATCH" }` |
| UNIQUE 衝突後の getByScope で record なし（race window） | next() 通過（安全側） | handler 出力 |
| size 上限超過 / 非 JSON | in_flight DELETE | handler 出力（次回再送で再実行） |

## 9. 不変条件の反映

- 不変条件 1（既存 endpoint surface のみ）: middleware は handler の入出力を改変しない。Hono ctx の req body は元通り読めるよう再構築
- 不変条件 2（D1 直接アクセスは apps/api）: middleware / repository は `c.env.DB` 経由のみ。`apps/web` からは触らない
- 不変条件 3（`scripts/cf.sh` 経由）: migration apply / list / deploy は wrapper のみ
- 不変条件 4（Form schema 外データ分離）: `idempotency_keys` は admin-managed infra table。Form schema に依存しない
- 不変条件 5（handler shape 不変）: middleware は admin route group 横断適用のみ
- 不変条件 6（test 命名）: D1 必須テストは `*.contract.spec.ts`（D1 lane）。純ロジックは `*.spec.ts`（unit lane）
- 不変条件 7（失敗は冪等化しない）: handler throw / 5xx / size 超過 / 非 JSON 全パターンで in_flight DELETE
- 不変条件 8（不可逆 mutation の user gate）: `d1 migrations apply` / `cf.sh deploy` はユーザー明示承認後のみ。Phase 13 で実施

## 10. 完了条件（Phase 2）

- [ ] D1 schema（DDL）が確定（テーブル / UNIQUE index / GC index / 列の型）
- [ ] Hono middleware フローが擬似コードレベルで確定（10 分岐網羅）
- [ ] Repository 5 関数のシグネチャ確定（`getByScope` / `insertInFlight` / `completeWithResponse` / `rollbackInFlight` / `gcExpired`）
- [ ] レスポンス再生方針確定（clone / 64KB 上限 / x-idempotent-replay header）
- [ ] TTL 24h / lazy GC 方針確定
- [ ] 配線方針確定（`_shared.ts` に `idempotency` を `requireAdmin` と同列追加）
- [ ] エラーハンドリング 9 ケースをテーブルで網羅
- [ ] 不変条件 1〜8 を設計に反映
