# Phase 8 — DRY before/after

## 1. SELECT 列の定数化

### before（仮想例 / runbook の逐次記述）

```ts
export const findById = async (c, id) =>
  c.db.prepare("SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, ...").bind(id).first();

export const listByMemberId = async (c, mid) =>
  c.db.prepare("SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, ...").bind(mid).all();
```

### after（実装）

```ts
const SELECT_COLS =
  "note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt";

export const findById = async (c, id) =>
  c.db.prepare(`SELECT ${SELECT_COLS} FROM admin_member_notes WHERE note_id = ?1`).bind(id).first<RawNoteRow>();
```

`adminNotes.ts` / `auditLog.ts` / `syncJobs.ts` / `magicTokens.ts` に同様の `SELECT_COLS` を切り出した。

## 2. Raw → Domain 変換 helper

### before

```ts
const r = await c.db.prepare(...).first<...>();
return r ? { auditId: r.audit_id, action: r.action, before: r.before_json ? JSON.parse(r.before_json) : null, ... } : null;
```

### after

```ts
const parseJson = (s) => (s === null || s === "" ? null : JSON.parse(s));
const toEntry = (r) => ({
  auditId: r.auditId,
  action: r.action as AuditAction,
  before: parseJson(r.beforeJson),
  ...
});
```

`auditLog` / `syncJobs` / `magicTokens` / `adminUsers` / `adminNotes` 全てで `toRow` / `toEntry` を導入。呼び出し側は `(r.results ?? []).map(toRow)` で一行化。

## 3. SQL コメント除去 helper

### before（runbook 案）

```ts
return sql.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("--"));
```

→ 行内コメント `... DEFAULT 'unknown',  -- comment` を残してしまい SQLite が parse 失敗。

### after

```ts
const stripComments = (sql: string): string =>
  sql.split("\n").map((line) => {
    const idx = line.indexOf("--");
    return idx >= 0 ? line.slice(0, idx) : line;
  }).join("\n");
```

`_setup.ts` だけが知っていればよい責務として隔離。

## 4. 共有 brand smart constructor

### before

`apps/api/src/repository/_shared/brand.ts` で 5 種の brand を 5 行ずつ宣言する案。

### after

```ts
export {
  type MemberId, type ResponseId, ..., asMemberId, asResponseId, ...
} from "@ubm-hyogo/shared";

declare const __repoBrand: unique symbol;
type RepoBrand<T, B extends string> = T & { readonly [__repoBrand]: B };
export type AdminEmail = RepoBrand<string, "AdminEmail">;
// ...
```

`@ubm-hyogo/shared` 既存 brand を **再 export** することで、02a / 02b が import path を `repository/_shared/brand` 1 ヶ所に統一できる。02c のみが必要な `AdminEmail` / `MagicTokenValue` / `AuditAction` は repo 内で宣言。

## 5. 不採用にした抽象化

- `selectAll<T>(c, sql, ...binds)` ジェネリック関数 → SQL の組み立てが多様で抽象化 cost が見合わない
- `Repository<T>` クラス → Hono / Workers の関数 export 風と齟齬がある
- `assertExists(row, jobId)` ヘルパー → `SyncJobNotFound` 例外クラスを直接 throw する方が文脈明示で読みやすい
