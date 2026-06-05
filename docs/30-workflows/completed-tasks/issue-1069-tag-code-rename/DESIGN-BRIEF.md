# DESIGN-BRIEF — issue-1069 tag code rename（SubAgent 共有正本）

> このファイルは Phase 本文を執筆する各 SubAgent が参照する **単一の設計正本**。
> ここに書かれたファイルパス・シグネチャ・error code・audit action・テスト名を逐語で使うこと。
> 本ファイル自体は close-out 時に削除してよい補助資料（成果物ではない）。

## 0. タスク identity

| key | value |
| --- | --- |
| workflow_id | `issue-1069-tag-code-rename` |
| taskId | `TASK-ISSUE-1069-TAG-CODE-RENAME` |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename` |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/1069 （**CLOSED**・2026-06-03 外部クローズ・状態変更しない） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（apps/api のみ。UI 変更なし） |
| implementation_mode | `new`（rename パスは新規実装） |
| workflow_state | `implemented_local_evidence_captured`（local code/spec 実装・deterministic evidence 取得済み） |
| 実装区分 | **[実装区分: 実装仕様書]** |

## 1. 真の論点（根本問題）

admin が tag を誤った `code` で作成しても、現状は `code` を修正できない（PATCH は label/category のみ）。
唯一の回復策は「新 code 作成 + 旧 code logical delete（active=0）」だが、これは member_tags が
無効タグを指し続け、むしろデータ衛生が悪化する。→ **clean rename パスが必要**。

## 2. ADR 結論（ユーザー承認済み: code rename を許可）

不変条件 #13 の「`code` は immutable」を **「admin tag master CRUD 経由で audit 付き rename 可能」へ改訂**する。
この判断は親タスク `issue-1035-tag-master-write-endpoints` の `issue_optimization_note`（「code is IMMUTABLE,
rename is out of scope to avoid seed/UI drift, audit ambiguity, and 409 churn」）を **supersede（上書き）**する。
supersede の根拠:

1. **参照整合は壊れない**: `member_tags` は `PRIMARY KEY (member_id, tag_id)` で **tag_id 参照**。`code` は参照していない（`apps/api/migrations/0002_admin_managed.sql:43-51`）。rename は tag_id を変えないため member_tags は無傷。
2. **seed drift は無害**: `0004_seed_tags.sql` は `INSERT OR IGNORE INTO tag_definitions (tag_id, ...)`（PK=tag_id の idempotent insert-only）。renamed code があっても seed 再実行は revert も conflict もしない。
3. **audit ambiguity 解消**: 専用 audit action `admin.tag.code_renamed` で old/new code を before/after に残す。
4. **409 churn 対策**: UNIQUE 衝突は `tag_code_conflict`、optimistic（CAS）衝突は `tag_stale_conflict` と error code を分離。

## 3. 受け入れ基準（issue を現行コードに最適化したもの）

| ID | 受け入れ基準 | 現行コード最適化メモ |
| --- | --- | --- |
| AC-1 | tag `code` rename を許可する ADR が記録されている（immutable → mutable へ改訂） | Phase 2 で ADR を確定。issue-1035 supersede を明記 |
| AC-2 | rename API は code uniqueness（`tag_code_conflict` 409）と optimistic conflict（`tag_stale_conflict` 409）を**別々の** error code で返す | optimistic は `expectedCode` による compare-and-swap（schema 変更不要） |
| AC-3 | 既存 `member_tags` row の参照整合が rename 後も保たれる | tag_id 参照のため設計上無傷。regression test で証明 |
| AC-4 | rename 前後の audit log に old/new code が残る | 専用 action `admin.tag.code_renamed`、before `{code: old}` / after `{code: new}` |
| AC-5 | seed / static manifest / admin UI 表示で stale code が残らないことを grep または focused test で確認 | `0004_seed_tags.sql` は OR IGNORE で無害。`verify:static-manifest` PASS + grep evidence |
| AC-6 | （禁止継続しないため）rename を許可した結果の運用注意（seed と code がずれ得る点）を spec に明記 | runbook ではなく spec の不変条件 #13 注記で閉じる |

## 4. 変更対象ファイル一覧（確定）

| 種別 | パス | 変更 | 内容 |
| --- | --- | --- | --- |
| API repository | `apps/api/src/repository/tagDefinitions.ts` | edit | `UpdateTagDefinitionInput` に `code?` / `expectedCode?` 追加、`updateTagDefinition` を discriminated union 返却へ変更（rename + CAS + UNIQUE 捕捉） |
| API route | `apps/api/src/routes/admin/tags.ts` | edit | `UpdateTagBodyZ` に `code?` / `expectedCode?`、`ERROR_TO_STATUS` に `tag_stale_conflict:409`、PATCH ハンドラで result map、`admin.tag.code_renamed` audit、`appendTagAudit` action union 拡張 |
| system spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | edit | 不変条件 #13 を「code rename 可（audit 付き）」へ改訂 |
| API repository test | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | edit | rename success / code_conflict / stale / not_found / member_tags 保持 |
| API contract test | `apps/api/src/routes/admin/tags.contract.spec.ts` | edit | PATCH code 200 / 409 tag_code_conflict / 409 tag_stale_conflict / 404 / audit code_renamed |
| regression test | `apps/api/src/routes/admin/members.tags.contract.spec.ts` | edit(任意) | rename 後も member タグ解決が code でなく tag_id 経由で成立 |
| static manifest | `apps/api/src/repository/_shared/generated/static-manifest.json` | regen(必要時) | `verify:static-manifest` が drift 検出した場合のみ再生成 |

> **`apps/api/src/repository/auditLog.ts` は変更しない**: `AuditTargetType` に `tag` は既存（auditLog.ts:12）、`AuditAction` は `RepoBrand<string>`（enum なし）なので新 action 文字列 `admin.tag.code_renamed` に型変更不要。
> **apps/web は変更しない**: admin tag master の専用 CRUD UI ページは現状未整備で、本サイクルのスコープ外（rename API surface のみ）。UI からの code 編集導線整備は Phase 12 未タスク候補。

## 5. 主要シグネチャ（逐語で使用）

### repository: `apps/api/src/repository/tagDefinitions.ts`

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

実装方針（atomic compare-and-swap・既存の `getTagDefinitionByIdRaw` / `isUniqueError` を再利用）:
1. `current = getTagDefinitionByIdRaw(tagId)`。無ければ `{ok:false, reason:"not_found"}`。
2. `input.code !== undefined && input.expectedCode === undefined` なら `{ok:false, reason:"missing_expected_code"}`。
3. `input.expectedCode !== undefined && input.expectedCode !== current.code` なら `{ok:false, reason:"stale"}`。
3. SET 句を label/category/code から動的構築（既存パターン踏襲）。フィールドが空なら `{ok:true, row:current}`。
4. code 指定時は `UPDATE ... WHERE tag_id = ? AND code = ?` として `expectedCode` を WHERE に含める。
5. UPDATE を try/catch。`isUniqueError(err)` true → `{ok:false, reason:"code_conflict"}`、更新行数 0 → latest row 再取得で `stale` / `not_found` を判定、それ以外は throw。
6. 成功時 `{ok:true, row: getTagDefinitionByIdRaw(tagId)!}`。

> **破壊的変更注意**: 戻り値が `TagDefinitionRow | null` → discriminated union に変わる。
> 既存 call site は `apps/api/src/routes/admin/tags.ts:175` の 1 箇所のみ。既存テスト
> `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーションを新返却型へ更新する。

### route: `apps/api/src/routes/admin/tags.ts`

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

PATCH `/tags/:tagId` ハンドラ:
1. body parse（既存どおり invalid_json / no_update_fields）。
2. `before = getTagDefinitionByIdRaw(tagId)`。無ければ 404 `tag_not_found`。
3. `result = updateTagDefinition(db, tagId, {code?, label?, category?, expectedCode?})`。
4. result map: `not_found`→404 `tag_not_found` / `code_conflict`→409 `tag_code_conflict` / `stale`→409 `tag_stale_conflict`。
5. `after = result.row`。
6. **audit 発火（2 種を独立に判定）**:
   - code 変更時（`before.code !== after.code`）: `admin.tag.code_renamed`、before `{code: before.code}` / after `{code: after.code}`。
   - label/category 変更時: 既存どおり `admin.tag.updated`、before/after `{label, category}`。
   - 両方変われば 2 行とも append。
7. `c.json(rowBody(after), 200)`。

## 6. テスト設計（focused / D1）

実行コマンド（**D1 config 必須**。unit config では repository.spec / contract.spec が exclude される）:
```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

| テストID | ファイル | ケース | 期待 |
| --- | --- | --- | --- |
| R-1 | tagDefinitions.write.repository.spec.ts | code rename success | `{ok:true, row.code===新code}` |
| R-2 | 〃 | UNIQUE 衝突（既存 code へ rename） | `{ok:false, reason:"code_conflict"}` |
| R-3 | 〃 | expectedCode mismatch | `{ok:false, reason:"stale"}` |
| R-4 | 〃 | 不存在 tagId | `{ok:false, reason:"not_found"}` |
| R-5 | 〃 | rename 後も member_tags(tag_id) 行が残存・解決 | row count 不変・tag_id 一致 |
| R-6 | 〃 | 既存 label/category 更新の後方互換 | `{ok:true}` で従来通り更新 |
| C-1 | tags.contract.spec.ts | PATCH code 正常 | 200 / body.code===新code |
| C-2 | 〃 | 既存 code へ rename | 409 `{error:"tag_code_conflict"}` |
| C-3 | 〃 | expectedCode mismatch | 409 `{error:"tag_stale_conflict"}` |
| C-4 | 〃 | 不存在 tagId | 404 `{error:"tag_not_found"}` |
| C-5 | 〃 | code 変更で `admin.tag.code_renamed` audit | audit row に old/new code |
| C-6 | 〃 | code 未指定 label のみ | 200・`admin.tag.updated` のみ |
| Reg-1 | members.tags.contract.spec.ts | rename 後の member tag 解決 | code 変更が assigned tag に波及しない（tag_id 経由） |
| Reg-2 | auditLog.repository.spec.ts | `admin.tag.code_renamed` 文字列 append | 型エラーなし・row 取得可 |

## 7. DoD（Definition of Done）

- [x] focused D1 vitest（上記 4 file）全 PASS（4 files / 37 tests）
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `mise exec -- pnpm verify:static-manifest` PASS（drift 検出後に regen 済み）
- [x] `docs/00-getting-started-manual/specs/01-api-schema.md` 不変条件 #13 を rename 可へ改訂
- [ ] HEX 直書き 0（apps/web 非接触のため自明）
- [ ] commit / push / PR / staging deploy / Issue 状態変更は **user-gated**（実施しない）

## 8. 不変条件・制約

- 既存 API endpoint surface のみ（新 endpoint 追加・D1 schema 変更・Google Form 変更なし）。PATCH の body 拡張は既存 endpoint の後方互換拡張。
- D1 直接アクセスは apps/api に閉じる（apps/web 非接触）。
- Issue #1069 は 2026-06-03 に外部で CLOSED（本ワークフローは状態変更せず）。
</content>
</invoke>
