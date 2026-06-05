# Phase 2: 設計（issue-1069 tag code rename）

## 2.1 ADR: tag code rename 可否

### 結論

**`tag_definitions.code` の rename を許可する。** 不変条件 #13 の「`code` は immutable」を
**「admin tag master CRUD 経由で audit 付き rename 可能」へ改訂**する（AC-1）。
この判断は親タスク `issue-1035-tag-master-write-endpoints` の `issue_optimization_note`
（「code is IMMUTABLE, rename is out of scope to avoid seed/UI drift, audit ambiguity, and 409 churn」）を
**supersede（上書き）**する。

### supersede の 4 根拠

1. **参照整合は壊れない**: `member_tags` は `PRIMARY KEY (member_id, tag_id)` で **tag_id 参照**。`code` は参照していない（`apps/api/migrations/0002_admin_managed.sql:43-51`）。rename は tag_id を変えないため `member_tags` は無傷。issue-1035 が懸念した「UI drift / 参照破壊」は現行スキーマでは成立しない。
2. **seed drift は無害**: `apps/api/migrations/0004_seed_tags.sql` は全行 `INSERT OR IGNORE INTO tag_definitions (tag_id, ...)`（PK=tag_id の idempotent insert-only・`0004_seed_tags.sql:7-63`）。renamed code があっても seed 再実行は revert も conflict も起こさない。
3. **audit ambiguity 解消**: 専用 audit action `admin.tag.code_renamed` で old/new code を before `{code: old}` / after `{code: new}` に残す。label/category 更新の `admin.tag.updated` と混同しない（AC-4）。
4. **409 churn 対策**: UNIQUE 衝突は `tag_code_conflict`、optimistic（CAS）衝突は `tag_stale_conflict` と error code を分離する（AC-2）。呼び出し側は 409 の意味を区別でき、churn なく再試行判断できる。

### 代替案（却下）

| 代替案 | 内容 | 却下理由 |
| --- | --- | --- |
| immutable 継続 + runbook | code 修正は D1 直接 SQL を runbook で手順化 | apps/api 外の手動 SQL を正規経路化すると不変条件 #5（D1 直接アクセスは apps/api に閉じる）を破る。audit も残らず AC-4 を満たせない。 |
| code 列を廃し label のみ | code をやめて表示名のみで運用 | `findByCode` / seed / 既存 surface（`tags.ts`・`0004_seed_tags.sql`）が code 前提。破壊範囲が過大で issue 範囲を超える。 |
| 新 endpoint `POST /tags/:tagId/rename` | rename 専用 endpoint を新設 | 不変条件「既存 endpoint surface のみ」に反する。PATCH の後方互換拡張で足り、surface 追加は不要。 |

→ 既存 PATCH `/tags/:tagId` を**後方互換拡張**する案を採用する。

## 2.2 既存コンポーネント再利用可否（[FB-SDK-07-1]）

新規モジュールを生やさず、既存 surface を最大限再利用する。

| 既存資産 | 再利用方針 | 根拠 |
| --- | --- | --- |
| PATCH `/tags/:tagId`（`tags.ts:157-187`） | 新 endpoint を作らず body を後方互換拡張（`code` / `expectedCode` 追加） | 既存 endpoint surface のみの不変条件に整合 |
| `apps/api/src/repository/auditLog.ts` | **型変更なしで再利用**。`AuditAction` は `RepoBrand<string>`（enum でない）ため新 action 文字列 `admin.tag.code_renamed` を弾かない。`AuditTargetType` の `tag` は既存（`auditLog.ts:8-15`）。`append`（:102-137）をそのまま使う。 | `auditLog.ts` を変更しないことが DESIGN-BRIEF §4 で確定 |
| `getTagDefinitionByIdRaw`（`tagDefinitions.ts:78-87`） | rename 前後の current 取得・before/after 取得に再利用 | 既存 |
| `isUniqueError`（`tagDefinitions.ts:73-76`） | UPDATE の UNIQUE(code) 衝突を `code_conflict` に変換するため再利用 | `createTagDefinition`（:101-104）と同一パターン |
| `appendTagAudit`（`tags.ts:89-108`） | action union に `admin.tag.code_renamed` を追加するだけで再利用 | targetType `tag` 固定・provider 経由 |
| `rowBody`（`tags.ts:62-68`） | 成功レスポンス body 生成に再利用 | 既存 |

## 2.3 repository シグネチャ設計

`apps/api/src/repository/tagDefinitions.ts`:

```ts
export interface UpdateTagDefinitionInput {
  code?: string;          // 新規: rename 対象の新 code
  label?: string;
  category?: string;
  expectedCode?: string;  // 新規: code 指定時必須の optimistic CAS token
}

export type UpdateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "code_conflict" }   // UNIQUE(code) 衝突
  | { ok: false; reason: "missing_expected_code" } // code 指定時の CAS token 欠落
  | { ok: false; reason: "stale" };          // expectedCode mismatch (optimistic)

export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<UpdateTagDefinitionResult>;
```

### atomic compare-and-swap 6 ステップ（既存 `getTagDefinitionByIdRaw` / `isUniqueError` 再利用）

1. `current = getTagDefinitionByIdRaw(c, tagId)`。無ければ `{ ok: false, reason: "not_found" }`。
2. `input.code !== undefined && input.expectedCode === undefined` なら `{ ok: false, reason: "missing_expected_code" }`（rename は CAS token 必須）。
3. `input.expectedCode !== undefined && input.expectedCode !== current.code` なら `{ ok: false, reason: "stale" }`（事前 stale 判定）。
3. SET 句を label / category / **code** から動的構築（既存 `updateTagDefinition`:118-129 の `sets[]` / `values[]` パターンを踏襲し、`code` 分岐を追加）。SET 句が空なら `{ ok: true, row: current }`（後方互換: フィールド未指定で no-op）。
4. code 指定時は `UPDATE ... WHERE tag_id = ? AND code = ?` とし、`expectedCode` を WHERE に含めて atomic CAS にする。
5. UPDATE を `try/catch`。`isUniqueError(err)` true → `{ ok: false, reason: "code_conflict" }`、更新行数 0 → latest row 再取得で `stale` / `not_found` を判定、それ以外は throw。
6. 成功時 `{ ok: true, row: getTagDefinitionByIdRaw(c, tagId)! }`（再取得で最新 row を返す）。

> **破壊的変更注意**: 戻り値が `TagDefinitionRow | null`（現行 :114）→ `UpdateTagDefinitionResult`（discriminated union）に変わる。既存 call site は `apps/api/src/routes/admin/tags.ts:175` の 1 箇所のみ。既存テスト `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーションを新返却型へ更新する。

## 2.4 route 設計

`apps/api/src/routes/admin/tags.ts`:

```ts
const UpdateTagBodyZ = z
  .object({
    code: z.string().min(1).max(64).regex(CODE_RE).optional(),   // 新規
    label: z.string().min(1).max(120).optional(),
    category: z.string().min(1).max(64).optional(),
    expectedCode: z.string().min(1).max(64).regex(CODE_RE).optional(), // code 指定時は必須
  })
  .refine(
    (b) => b.code !== undefined || b.label !== undefined || b.category !== undefined,
    { message: "no_update_fields" },
  )
  .refine((b) => b.code === undefined || b.expectedCode !== undefined, {
    message: "expected_code_required",
    path: ["expectedCode"],
  });

const ERROR_TO_STATUS = {
  invalid_query: 400, invalid_json: 400, invalid_body: 400, no_update_fields: 400,
  tag_not_found: 404,
  tag_code_conflict: 409,
  tag_stale_conflict: 409,   // 新規
} as const;

// appendTagAudit の action union に "admin.tag.code_renamed" を追加
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated" | "admin.tag.code_renamed";
```

> `CODE_RE = /^[a-z0-9][a-z0-9_]*$/`（`tags.ts:21`）を `code` にも適用し、create と同じ命名検証を rename にも課す。`refine` の判定対象に `code` を追加（`expectedCode` は更新フィールドでないため refine 対象に含めない）。

### PATCH `/tags/:tagId` ハンドラ（result map + audit 2 種独立発火）

1. body parse（既存どおり `invalid_json` / `no_update_fields`・`tags.ts:158-165`）。
2. `before = getTagDefinitionByIdRaw(db(c), tagId)`。無ければ 404 `tag_not_found`。
3. `result = updateTagDefinition(db(c), tagId, { code?, label?, category?, expectedCode? })`。
4. result map:
   - `not_found` → 404 `tag_not_found`
   - `code_conflict` → 409 `tag_code_conflict`
   - `stale` → 409 `tag_stale_conflict`
5. `after = result.row`。
6. **audit 発火（2 種を独立に判定）**:
   - code 変更時（`before.code !== after.code`）: `admin.tag.code_renamed`、before `{ code: before.code }` / after `{ code: after.code }`。
   - label/category 変更時（既存 `samePatchValues` 相当の判定）: `admin.tag.updated`、before/after `{ label, category }`。
   - 両方変われば 2 行とも append（独立判定なので互いに干渉しない）。
7. `c.json(rowBody(after), 200)`。

## 2.5 optimistic concurrency 設計（compare-and-swap）

- `expectedCode` を呼び出し側が現在認識している code として渡す。repository は step 2 で `current.code` と照合し、不一致なら `{ ok: false, reason: "stale" }`（route で 409 `tag_stale_conflict`）。
- これは「読み込んだ時点の code」を楽観ロック token として使う **compare-and-swap**。複数 admin が同一 tag を同時編集した場合、後発の更新は先発の rename を上書きせず stale で弾かれる。
- **version 列を足さない理由**: 専用 version/etag 列を `tag_definitions` に追加すると D1 schema 変更（migration 追加）が必要になり、不変条件「D1 schema 変更なし」に反する。`code` 自体は `UNIQUE NOT NULL`（`0002_admin_managed.sql:36`）で必ず値を持つため、既存列を CAS token として流用でき schema 変更を回避できる。
- `expectedCode` は `code` 指定時のみ必須。label/category のみの更新では不要なので、既存 PATCH の後方互換を保つ。

## 2.6 破壊的変更の影響範囲

| 影響箇所 | 変更前 | 変更後 | 対応 |
| --- | --- | --- | --- |
| `updateTagDefinition` 戻り値型 | `TagDefinitionRow \| null`（`tagDefinitions.ts:114`） | `UpdateTagDefinitionResult`（union） | call site / test を新型へ移行 |
| call site | `tags.ts:175` の `const after = await updateTagDefinition(...)` + `:176` の `if (!after)` null チェック | `result.ok` 分岐 + reason→error map | route ハンドラ書き換え（2.4） |
| 既存 test | `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーション（旧 `Row \| null` 前提） | `{ ok: true, row }` 等の union アサーション | テスト更新（R-6 後方互換含む） |

call site は **1 箇所のみ**で局所的。破壊的変更だが波及は route ハンドラ 1 つとテスト 3 アサーションに閉じる。

## 2.7 データ整合性・エラーハンドリング・副作用

### データ整合性

- `member_tags` は tag_id 参照（`0002_admin_managed.sql:43-51`）。rename は tag_id を変えないため、assigned tag は code 変更後も同一 tag_id で解決され続ける（AC-3・Reg-1 で証明）。
- `code` は `UNIQUE NOT NULL`。rename 先が既存 code と衝突すれば DB レベルで UNIQUE 違反 → `isUniqueError` → `code_conflict`（AC-2）。

### エラーハンドリング

- `not_found` / `code_conflict` / `stale` の 3 reason を repository が返し、route が `ERROR_TO_STATUS` で 404 / 409 / 409 にマップ。`tag_code_conflict` と `tag_stale_conflict` は同じ 409 だが error code 文字列で区別可能（AC-2）。
- UNIQUE 以外の DB エラーは repository が throw（握り潰さない）。Hono のエラーハンドラに委ねる。

### 副作用

- audit append（`auditLog.append`）が唯一の副作用。code rename と label/category 更新で**独立に**発火し、両方変われば 2 行。append-only（`auditLog.ts:221`）のため監査証跡は不可逆に残る（AC-4）。

## 2.8 seed / static manifest 整合（AC-5・AC-6）

- `0004_seed_tags.sql` は `INSERT OR IGNORE`（`0004_seed_tags.sql:7,20,33,41,52,60`）。rename 後に seed 再実行しても PK=tag_id 既存行は無視され、stale code を復活させない。よって stale code は seed 経由では残らない（AC-5）。
- `verify:static-manifest` が drift を検出した場合のみ `apps/api/src/repository/_shared/generated/static-manifest.json` を regen する。
- **AC-6（運用注意）**: rename 後は「seed SQL の code 文字列」と「DB の実 code」がずれ得る。これは設計上意図された状態（seed は insert-only で再現の正本ではない）であり、不変条件 #13 注記に「rename 後 seed と code がずれ得るが、seed は OR IGNORE のため再実行は安全」と明記して閉じる（runbook 化しない）。
