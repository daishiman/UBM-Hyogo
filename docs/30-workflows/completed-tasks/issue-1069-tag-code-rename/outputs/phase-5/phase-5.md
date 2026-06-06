# Phase 5: 実装

> 正本: `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/DESIGN-BRIEF.md` §4 / §5。
> 本フェーズは local code/spec 実装済み（`workflow_state = implemented_local_evidence_captured`）。commit / push / PR / staging runtime / Issue mutation は user-gated。
> ここでは Phase 4 で Red にしたテストを Green にするための **差分方針** を逐語で確定する。

## 0. 新規作成 / 修正ファイル一覧（[Feedback RT-03] 必須）

DESIGN-BRIEF §4 の表をそのまま採用する。**新規作成ファイルは無し**（全て既存ファイルの edit）。

| 種別 | パス | 変更 | 内容 |
| --- | --- | --- | --- |
| API repository | `apps/api/src/repository/tagDefinitions.ts` | edit | `UpdateTagDefinitionInput` に `code?` / `expectedCode?` 追加、`UpdateTagDefinitionResult` 新規 export、`updateTagDefinition` を discriminated union 返却へ（rename + CAS + UNIQUE 捕捉） |
| API route | `apps/api/src/routes/admin/tags.ts` | edit | `UpdateTagBodyZ` に `code?` / `expectedCode?`、`ERROR_TO_STATUS` に `tag_stale_conflict:409`、PATCH ハンドラで result map、`admin.tag.code_renamed` audit、`appendTagAudit` action union 拡張 |
| system spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | edit | 不変条件 #13 を「code rename 可（audit 付き）」へ改訂（Phase 12 で実反映） |
| API repository test | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | edit | R-1..R-6（既存 3 アサーション更新含む） |
| API contract test | `apps/api/src/routes/admin/tags.contract.spec.ts` | edit | C-1..C-6 |
| regression test | `apps/api/src/routes/admin/members.tags.contract.spec.ts` | edit(任意) | Reg-1 |
| regression test | `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | edit | Reg-2 |
| static manifest | `apps/api/src/repository/_shared/generated/static-manifest.json` | regen(必要時) | `verify:static-manifest` が drift 検出した場合のみ再生成 |

### 非変更ファイルの明示

- **`apps/api/src/repository/auditLog.ts` は変更しない**: `AuditTargetType` に `tag` は既存（auditLog.ts:12）、
  `AuditAction` は `RepoBrand<string>`（enum なし）のため新 action 文字列 `admin.tag.code_renamed` に型変更不要。
- **`apps/web` は変更しない**: admin tag master 専用 CRUD UI ページは現状未整備でスコープ外（rename API surface のみ）。
- D1 schema 変更・新 endpoint 追加・Google Form 変更なし。PATCH の body 拡張は既存 endpoint の後方互換拡張。

## 1. repository `tagDefinitions.ts` の差分方針

### 1.1 型の拡張

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

### 1.2 `updateTagDefinition` を atomic CAS 6 ステップへ（DESIGN-BRIEF §5 逐語）

既存の `getTagDefinitionByIdRaw` / `isUniqueError` を再利用する。

1. `current = getTagDefinitionByIdRaw(c, tagId)`。無ければ `{ ok: false, reason: "not_found" }`。
2. `input.code !== undefined && input.expectedCode === undefined` なら `{ ok: false, reason: "missing_expected_code" }`。
3. `input.expectedCode !== undefined && input.expectedCode !== current.code` なら `{ ok: false, reason: "stale" }`。
3. SET 句を `label` / `category` / `code` から動的構築（既存の `sets[]` / `values[]` パターンを踏襲し `code` を追加）。
   フィールドが全て空（`sets.length === 0`）なら `{ ok: true, row: current }`。
4. code 指定時は `UPDATE ... WHERE tag_id = ? AND code = ?` とし、`expectedCode` を WHERE に含める。
5. UPDATE を try/catch で実行。`isUniqueError(err)` true → `{ ok: false, reason: "code_conflict"}`、更新行数 0 → latest row 再取得で `stale` / `not_found` 判定、それ以外は throw。
6. 成功時 `{ ok: true, row: (await getTagDefinitionByIdRaw(c, tagId))! }`。

> **入力**: `tagId` + `{ code?, label?, category?, expectedCode? }`。
> **出力**: discriminated union（`ok` で分岐）。
> **副作用**: 成功時のみ `tag_definitions` 1 行 UPDATE。stale / not_found / code_conflict 時は DB 不変。
> **エラーハンドリング**: UNIQUE → `code_conflict`、CAS mismatch → `stale`、不存在 → `not_found`。UNIQUE 以外の DB エラーは throw（上位の error boundary へ委譲）。

### 1.3 既存 call site の更新（同 wave）

- `apps/api/src/routes/admin/tags.ts:175` の `const after = await updateTagDefinition(...)` 1 箇所のみが旧戻り型
  （`TagDefinitionRow | null`）を前提にしている。1.5 の PATCH ハンドラ書き換えで result map へ移行する。
- 既存テスト `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーションを Phase 4 §2 R-6 の方針で新返却型へ更新（同 wave）。

## 2. route `tags.ts` の差分方針（DESIGN-BRIEF §5 手順 1-7 逐語）

### 2.1 `UpdateTagBodyZ` の拡張

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
```

- `code` は既存 `CreateTagBodyZ` と同じ `CODE_RE`（`/^[a-z0-9][a-z0-9_]*$/`）で検証。違反は zod safeParse 失敗。
- refine 条件に `b.code !== undefined` を追加（`expectedCode` 単独では更新対象がないため no_update_fields）。
- **注意**: 現行 PATCH ハンドラは parse 失敗時に一律 `no_update_fields` を返している（tags.ts:165）。
  CODE_RE 違反は本来 `invalid_body`（400）が望ましい。parse 失敗の枝を `refine` 由来（no_update_fields）と
  field 検証由来（invalid_body）で分岐するため、`safeParse` の `error.issues` に `no_update_fields` メッセージが
  含まれるかで判定し、含まれなければ `invalid_body` を返す（Phase 4 §4 の CODE_RE 違反テストを満たす）。

### 2.2 `ERROR_TO_STATUS` に `tag_stale_conflict:409` 追加

```ts
const ERROR_TO_STATUS = {
  invalid_query: 400, invalid_json: 400, invalid_body: 400, no_update_fields: 400,
  tag_not_found: 404,
  tag_code_conflict: 409,
  tag_stale_conflict: 409,   // 新規
} as const;
```

### 2.3 `appendTagAudit` の action union 拡張

```ts
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated" | "admin.tag.code_renamed";
```

### 2.4 PATCH `/tags/:tagId` ハンドラ（手順 1-7）

1. body parse（既存どおり：JSON 失敗 → `invalid_json`、refine 失敗 → `no_update_fields`、field 検証失敗 → `invalid_body`）。
2. `before = getTagDefinitionByIdRaw(db(c), tagId)`。無ければ 404 `tag_not_found`。
3. `result = updateTagDefinition(db(c), tagId, { code?, label?, category?, expectedCode? })`
   （`parsed.data` から undefined を除いた input を構築。既存の `patchInput` 構築パターンに `code` / `expectedCode` を追加）。
4. result map: `not_found` → 404 `tag_not_found` / `code_conflict` → 409 `tag_code_conflict` / `stale` → 409 `tag_stale_conflict` / `missing_expected_code` → 400 `invalid_body`。
5. `after = result.row`（`result.ok === true` の枝でのみ参照）。
6. **audit 発火（2 種を独立に判定）**:
   - code 変更時（`before.code !== after.code`）: `admin.tag.code_renamed`、
     before `{ code: before.code }` / after `{ code: after.code }`。
   - label/category 変更時（既存 `samePatchValues` 相当の判定）: `admin.tag.updated`、
     before `{ label: before.label, category: before.category }` / after `{ label: after.label, category: after.category }`。
   - 両方変われば 2 行とも独立に append（順序は code_renamed → updated でよい）。
7. `c.json(rowBody(after), 200)`。

> **入力**: PATCH body `{ code?, label?, category?, expectedCode? }` + path `tagId`。
> **出力**: 200 `rowBody(after)` / 400 / 404 / 409。
> **副作用**: audit append（最大 2 行・code 系と label/category 系で独立）。
> **エラーハンドリング**: UNIQUE → `tag_code_conflict`、CAS mismatch → `tag_stale_conflict`、不存在 → `tag_not_found`、空/不正 body → `no_update_fields` / `invalid_body`。

## 3. system spec `01-api-schema.md` 不変条件 #13 の改訂方針（Phase 12 で実反映）

- **現行**: 「`code` は immutable」（tagDefinitions.ts:48-51 のコメントと同旨）。
- **改訂後**:
  - `code` は **admin tag master CRUD（PATCH `/admin/tags/:tagId`）経由で audit 付き rename 可能**へ緩和。
  - rename は **tag_id を変えない**ため `member_tags`（`PRIMARY KEY (member_id, tag_id)` の tag_id 参照）は無傷。
  - error code は 2 種に分離：UNIQUE 衝突 = `tag_code_conflict`（409）、optimistic（CAS）衝突 = `tag_stale_conflict`（409）。
  - audit action `admin.tag.code_renamed` に old/new code を before/after で残す。
  - 親タスク `issue-1035` の `issue_optimization_note`（code immutable / rename out of scope）を **supersede** する旨を注記。
  - AC-6 注意: rename を許可した結果、seed（`0004_seed_tags.sql`、`INSERT OR IGNORE`・PK=tag_id）と code がずれ得る。
    seed 再実行は revert も conflict もしないため無害である旨を spec の不変条件 #13 注記に明記（runbook ではなく spec で閉じる）。

## 4. DoD への寄与

- Phase 4 で Red にした R-1..R-6 / C-1..C-6 / Reg-1..Reg-2 を本差分で Green にする。
- typecheck（`@ubm-hyogo/api`）/ lint / `verify:static-manifest` PASS を満たす。
- commit / push / PR / staging deploy / Issue 状態変更は user-gated（実施しない）。Issue #1069 は 2026-06-03 に外部で CLOSED（本ワークフローは状態変更せず）。
