# Phase 5: 実装計画（Task A / apps/api）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api: `audit.ts` / `auditLog.ts`） |

> 本ファイルは実装計画（設計）である。実装者が単独着手できる粒度で変更対象・シグネチャ・SQL の
> before/after・落とし穴を記述する。コードは本タスクでは実装しない（runtime 完了語を書かない）。
> 実装は実装サイクル（03.実装.md）で Phase 4 の Red テストを green にしながら行う。

---

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 区分 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/routes/admin/audit.ts` | 編集 | `ListAuditQueryZ` に `batchId`、`AdminAuditListResponseZ.appliedFilters` に `batchId`、`ListAuditResponse` interface に `batchId`、`app.get("/audit")` の safeParse 入力 / `listFiltered` 呼び出し / `appliedFilters` 返却に batchId 追加。 |
| `apps/api/src/repository/auditLog.ts` | 編集 | `AuditLogListFilters` に `batchId?`、`listFiltered` に json_extract OR の WHERE 句追加。 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 追記 | Phase 4 §2 の TC (a)-(f)。 |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | 追記 | Phase 4 §3 の TC (g)-(k)。 |

**新規作成ファイル: なし**（Task A は既存ファイルへの追記のみ）。

---

## 2. `audit.ts` 差分方針

### 2-1. `ListAuditQueryZ`（query schema）

Before:

```ts
export const ListAuditQueryZ = z.object({
  action: z.string().min(1).optional(),
  actorEmail: z.string().email().optional(),
  targetType: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
```

After（`to` の後・`cursor` の前に 1 行追加）:

```ts
  to: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(), // ← 追加
  cursor: z.string().min(1).optional(),
```

### 2-2. `AdminAuditListResponseZ.appliedFilters`（`.strict()` 維持）

`.strict()` のため schema 側にも batchId を追加しないと、route が返す `appliedFilters.batchId` が
unknown key として弾かれる。`to` の後・`limit` の前に追加:

```ts
    to: z.string().nullable(),
    batchId: z.string().nullable(), // ← 追加
    limit: z.number().int().min(1).max(100),
  }).strict(),
```

### 2-3. `ListAuditResponse` interface（`satisfies` 維持）

`appliedFilters` に `batchId: string | null;` を `to` の後・`limit` の前に追加:

```ts
    to: string | null;
    batchId: string | null; // ← 追加
    limit: number;
```

### 2-4. `app.get("/audit")` 本体（3 箇所）

(1) safeParse 入力（`to` の後・`cursor` の前）:

```ts
      to: c.req.query("to") || undefined,
      batchId: c.req.query("batchId") || undefined, // ← 追加
      cursor: c.req.query("cursor") || undefined,
```

(2) `listFiltered({ ... })` 呼び出しの spread（`toUtcExclusive` の後・`cursor` の前）:

```ts
      ...(toUtcExclusive ? { toUtcExclusive } : {}),
      ...(parsed.data.batchId ? { batchId: parsed.data.batchId } : {}), // ← 追加
      ...(cursor ? { cursor } : {}),
```

(3) `appliedFilters` 返却（`to` の後・`limit` の前）:

```ts
          to: parsed.data.from ?? null, // 既存（注: 実コードは to: parsed.data.to ?? null）
          batchId: parsed.data.batchId ?? null, // ← 追加
          limit,
```

> 注: 実コード L239 は `to: parsed.data.to ?? null` である。batchId は同様に `parsed.data.batchId ?? null` を
> `to` の直後に挿入する。from/to/他フィールドの順序・型は変更しない。

---

## 3. `auditLog.ts` 差分方針

### 3-1. `AuditLogListFilters`（filter 型）

Before（抜粋）:

```ts
export interface AuditLogListFilters {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  fromUtc?: string;
  toUtcExclusive?: string;
  cursor?: { createdAt: string; auditId: string };
  limit: number;
}
```

After（`toUtcExclusive` の後・`cursor` の前に追加）:

```ts
  toUtcExclusive?: string;
  batchId?: string; // ← 追加
  cursor?: { createdAt: string; auditId: string };
```

### 3-2. `listFiltered` の WHERE 句（json_extract OR）

`listFiltered` 内、plain 列 filter 群（`fromUtc` / `toUtcExclusive`）の後・`cursor` 句の前に batchId 専用 WHERE を追加する。

Before（抜粋）:

```ts
  if (filters.fromUtc) add("created_at >= ?", filters.fromUtc);
  if (filters.toUtcExclusive) add("created_at < ?", filters.toUtcExclusive);
  if (filters.cursor) {
    bindings.push(filters.cursor.createdAt, filters.cursor.auditId);
    where.push(
      `(created_at < ?${bindings.length - 1} OR (created_at = ?${bindings.length - 1} AND audit_id < ?${bindings.length}))`,
    );
  }
```

After（`toUtcExclusive` 行の後・`cursor` 句の前に挿入）:

```ts
  if (filters.toUtcExclusive) add("created_at < ?", filters.toUtcExclusive);
  if (filters.batchId) {
    bindings.push(filters.batchId);
    where.push(
      `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) ` +
        `OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
    );
  }
  if (filters.cursor) {
    /* 既存 keyset 句（非変更） */
  }
```

### 3-3. 落とし穴: `add()` を使わない理由（binding 番号）

`add(sql, value)` helper は次の実装である:

```ts
const add = (sql: string, value: string | number | null) => {
  bindings.push(value);
  where.push(sql.replace("?", `?${bindings.length}`));
};
```

これは **単一の `?` を 1 つの `?N` に置換する前提**である。batchId は「同一値を 2 つの json_extract で参照」
したいため、`add()` を使うと:

- `add(..., filters.batchId)` を 2 回呼ぶ → bindings に値が **2 回** push され番号がずれる（`?N` と `?N+1` で別 binding）。
- 1 回だけ呼んで `replace("?", ...)` させると `String.prototype.replace` は **最初の `?` のみ** 置換するため、
  2 つ目の `json_extract` の `?` が未置換のまま残り SQL が壊れる。

→ そのため **`bindings.push(filters.batchId)` で値を 1 回だけ push** し、`?${bindings.length}` を **両方の
json_extract に手書き**で同じ番号で埋め込む。これにより 1 binding を 2 箇所で共有でき、番号もずれない。

> 既存 cursor 句も `add()` を使わず `bindings.push(...)` + `?${bindings.length - 1}` / `?${bindings.length}` を
> 手書きしている（同一パターン）。batchId 句はこの cursor 句の先例に倣う。

### 3-4. AND 結合 / ORDER BY / LIMIT

- 全 WHERE は最終的に `where.join(" AND ")` で AND 結合される。json_extract OR は **括弧で 1 項として閉じている**
  ため、`action = ?1 AND (json_extract(...) = ?2 OR json_extract(...) = ?2)` のように AND の中の 1 項になる（AC-3 成立）。
- ORDER BY（`created_at DESC, audit_id DESC`）/ LIMIT / cursor / SELECT_COLS は **非変更**。

---

## 4. 関数シグネチャ・入出力・副作用

| 項目 | 内容 |
| --- | --- |
| `listFiltered(c: DbCtx, filters: AuditLogListFilters)` | シグネチャ非変更。`filters.batchId?: string` が追加されただけ。返り値 `Promise<AuditLogListRow[]>` 非変更。 |
| `app.get("/audit")` | endpoint surface 非変更（既存 endpoint の query 拡張のみ）。入力に `?batchId=<uuid>` を受理。 |
| 入力 | `batchId`（任意・非空文字列）。空文字は route 層で undefined 化（filter 未適用）。 |
| 出力 | `appliedFilters.batchId: string | null` が追加される。`items` shape は非変更。 |
| 副作用 | **read-only**。audit_log への mutation なし（append-only 不変維持）。 |
| エラー | invalid query（limit 範囲外 / invalid cursor / invalid date range）は既存どおり 400。batchId 単独での新規 400 経路なし。 |

---

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/routes/admin/audit.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

> package 名は `@ubm-hyogo/api`（issue 記載の `@repo/api` は誤り。実 package 名を正本とする）。

---

## 6. 完了条件 (DoD)

- 変更対象ファイル（新規なし・編集 2 + spec 2）が列挙されている。
- audit.ts の 3 箇所（schema / response schema / interface / route 本体 3 点）と auditLog.ts の 2 箇所
  （filter 型 / WHERE 句）の before/after が記述されている。
- json_extract の binding 番号の正しい書き方（`add()` を使わず 1 回 push し同一 `?N` を両参照）が落とし穴付きで明記されている。
- after/before 両列 OR 検索（検索漏れ防止）が記述されている。
- 入出力・副作用・テスト方針・ローカル実行コマンドが揃っている。
