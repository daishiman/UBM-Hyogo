# Phase 4: テスト作成（TDD Red）

> 正本: `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/DESIGN-BRIEF.md` §5 / §6。
> 本フェーズは **実装前にテストを先に書き、新規アサーションが fail（Red）すること** を確認する設計。
> 全テストは public 関数（`updateTagDefinition`）/ public route（PATCH `/admin/tags/:tagId`）のみを対象とし、private/内部テスト方針は不要。

## 0. 実行コマンド（D1 config 必須）

repository.spec / contract.spec は **unit config では exclude** される。必ず `vitest.d1.config.ts` で実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

## 1. 命名規則整合（捏造禁止・逐語）

| 種別 | 値 | 確認 |
| --- | --- | --- |
| error code（snake_case） | `tag_code_conflict`（UNIQUE 衝突 409） | 既存 `ERROR_TO_STATUS` に存在 |
| error code（snake_case） | `tag_stale_conflict`（CAS mismatch 409） | **新規**追加 |
| error code（snake_case） | `tag_not_found`（404） | 既存 |
| error code（snake_case） | `no_update_fields`（空 body 400） | 既存 |
| error code（snake_case） | `invalid_body`（CODE_RE 違反 400） | 既存 |
| audit action（dot 区切り） | `admin.tag.code_renamed`（code 変更時） | **新規** |
| audit action（dot 区切り） | `admin.tag.updated`（label/category 変更時） | 既存 |
| repository reason | `not_found` / `code_conflict` / `stale` | discriminated union（DESIGN-BRIEF §5） |

## 2. repository テスト（`tagDefinitions.write.repository.spec.ts`）

既存テストは `setupD1()` の `InMemoryD1`（`env.ctx` / `env.db`）と `beforeEach` の seed
（`tag_eng`/`engineer`, `tag_mgr`/`manager`, `tag_old`/`old`(active=0)）を利用する。既存 seed をそのまま再利用する。

### R-1: code rename success
- **Arrange**: 既存 seed の `tag_eng`（code=`engineer`）。
- **Act**: `await updateTagDefinition(env.ctx, "tag_eng", { code: "engineer2" })`。
- **Assert**: `expect(result).toEqual({ ok: true, row: expect.objectContaining({ tagId: "tag_eng", code: "engineer2" }) })`。
  さらに `getTagDefinitionByIdRaw(env.ctx, "tag_eng")` の `code` が `engineer2` に永続化されていること。

### R-2: UNIQUE 衝突（既存 code へ rename）
- **Arrange**: seed の `tag_eng`（`engineer`）と `tag_mgr`（`manager`）。
- **Act**: `await updateTagDefinition(env.ctx, "tag_eng", { code: "manager" })`（既に `tag_mgr` が使用中）。
- **Assert**: `expect(result).toEqual({ ok: false, reason: "code_conflict" })`。
  さらに `tag_eng` の code は `engineer` のまま不変（rollback 相当：UPDATE が UNIQUE で失敗）であること。

### R-3: expectedCode mismatch（optimistic CAS）
- **Arrange**: seed の `tag_eng`（現 code=`engineer`）。
- **Act**: `await updateTagDefinition(env.ctx, "tag_eng", { code: "engineer3", expectedCode: "WRONG" })`。
- **Assert**: `expect(result).toEqual({ ok: false, reason: "stale" })`。code は `engineer` のまま不変。
- 補助: `expectedCode` が現 code と一致するケース（`{ code: "engineer3", expectedCode: "engineer" }`）は `{ ok: true, row.code === "engineer3" }` を返すこと。

### R-4: 不存在 tagId
- **Arrange**: seed に存在しない `tagId`。
- **Act**: `await updateTagDefinition(env.ctx, "missing", { code: "whatever" })`。
- **Assert**: `expect(result).toEqual({ ok: false, reason: "not_found" })`。

### R-5: rename 後も member_tags(tag_id) 行が残存・解決
- **Arrange**: seed 後に `INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1','tag_eng','manual','admin@example.com')`。
- **Act**: `await updateTagDefinition(env.ctx, "tag_eng", { code: "engineer_renamed" })`。
- **Assert**:
  - `SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_eng'` が `1`（行数不変・tag_id 参照が無傷）。
  - rename 結果 `row.code === "engineer_renamed"` かつ `row.tagId === "tag_eng"`（tag_id 一致）。
  - AC-3 を証明：code を変えても member_tags の参照は tag_id 経由のため波及しない。

### R-6: 既存 label/category 更新の後方互換
- **Arrange**: seed の `tag_eng`。
- **Act**: `await updateTagDefinition(env.ctx, "tag_eng", { label: "Engineer", category: "role" })`（code 未指定）。
- **Assert**: `expect(result).toEqual({ ok: true, row: expect.objectContaining({ tagId: "tag_eng", code: "engineer", label: "Engineer", category: "role" }) })`。
  code は変わらないこと。
- **既存テストの移行**: 現行 `tagDefinitions.write.repository.spec.ts:54,65,71` の 3 アサーションは戻り値が
  `TagDefinitionRow | null` 前提（`toMatchObject({...})` / `toBeNull()`）。新返却型（discriminated union）へ更新する：
  - L54-63: `updated`（label/category 更新）→ `expect(updated).toMatchObject({ ok: true, row: { tagId:"tag_eng", code:"engineer", label:"Engineer", category:"role" } })`。
  - L65-70: `updateTagDefinition(...,{label:"Engineer 2"})` 後の `getTagDefinitionByIdRaw` 検証はそのまま維持（raw getter の戻り型は不変）。
  - L71: `expect(await updateTagDefinition(env.ctx, "missing", { label: "x" })).toEqual({ ok:false, reason:"not_found" })`（旧 `toBeNull()` を置換）。

## 3. contract テスト（`tags.contract.spec.ts`）

既存ヘルパを再利用：`makeEnv(env)` / `adminAuthHeader()` / `auditCount(env, action)` / `seedTags(env)`
（`tag_eng`/`engineer`, `tag_mgr`/`manager`, `tag_old`/`old`(active=0)）。admin auth は `adminAuthHeader()` mock。

### C-1: PATCH code 正常
- **Arrange**: `createAdminTagsRoute()`、seed 済。
- **Act**: `PATCH /tags/tag_eng` body `{ "code": "engineer2" }`、`content-type: application/json` + `adminAuthHeader()`。
- **Assert**: `res.status === 200`、body `toMatchObject({ tagId:"tag_eng", code:"engineer2" })`。
  `auditCount(env, "admin.tag.code_renamed") === 1`。

### C-2: 既存 code へ rename
- **Act**: `PATCH /tags/tag_eng` body `{ "code": "manager" }`（`tag_mgr` が使用中）。
- **Assert**: `res.status === 409`、`await res.json()` が `{ ok: false, error: "tag_code_conflict" }`。
  `auditCount(env, "admin.tag.code_renamed") === 0`（audit は発火しない）。

### C-3: expectedCode mismatch
- **Act**: `PATCH /tags/tag_eng` body `{ "code": "engineer3", "expectedCode": "WRONG" }`。
- **Assert**: `res.status === 409`、`{ ok: false, error: "tag_stale_conflict" }`。
  `auditCount(env, "admin.tag.code_renamed") === 0`。

### C-4: 不存在 tagId
- **Act**: `PATCH /tags/missing` body `{ "code": "whatever" }`。
- **Assert**: `res.status === 404`、`{ ok: false, error: "tag_not_found" }`。

### C-5: code 変更で `admin.tag.code_renamed` audit に old/new code
- **Act**: `PATCH /tags/tag_eng` body `{ "code": "engineer_new" }`。
- **Assert**: `res.status === 200`。audit_log を直接照会し old/new を検証：
  ```sql
  SELECT before_json, after_json FROM audit_log
  WHERE target_type='tag' AND target_id='tag_eng' AND action='admin.tag.code_renamed'
  ```
  `before` に `{ code: "engineer" }`、`after` に `{ code: "engineer_new" }` が含まれること
  （JSON parse 後 `before.code === "engineer"` / `after.code === "engineer_new"`）。AC-4 を証明。

### C-6: code 未指定・label のみ → `admin.tag.updated` のみ
- **Act**: `PATCH /tags/tag_eng` body `{ "label": "Engineer X" }`。
- **Assert**: `res.status === 200`、body.code は `engineer` 不変。
  `auditCount(env, "admin.tag.updated") === 1` かつ `auditCount(env, "admin.tag.code_renamed") === 0`。

## 4. 回帰テスト（Reg-1 / Reg-2）

### Reg-1: rename 後の member tag 解決（`members.tags.contract.spec.ts`）
- **Arrange**: `seedMembers(env)`（`m1` + `tag_eng`/`engineer` 等）。`createAdminMembersRoute()` で `POST /members/m1/tags` body `{ tagId: "tag_eng" }` を実行し付与済にする。
  別途 `createAdminTagsRoute()` で `PATCH /tags/tag_eng` body `{ "code": "engineer_renamed" }` を実行（200）。
- **Act**: `GET /members/m1/tags`（`createAdminMembersRoute()`）。
- **Assert**: `body.assigned.map(t => t.tagId)` に `tag_eng` が含まれる（code 変更が assigned 解決を壊さない＝tag_id 経由）。
  assigned 内の当該 tag の `code` は新値 `engineer_renamed`（tag master を JOIN 解決するため最新 code を反映）。AC-3 を route 層でも証明。

### Reg-2: `admin.tag.code_renamed` 文字列 append（`auditLog.repository.spec.ts`）
- **Arrange**: `setupD1()` + `seedAuditLog` fixture。
- **Act**: `await auditLog.append(env.ctx, { actorId: null, actorEmail: adminEmail("owner@example.com"), action: auditAction("admin.tag.code_renamed"), targetType: "tag", targetId: "tag_001", before: { code: "old" }, after: { code: "new" } })`。
- **Assert**: 型エラーなし（`AuditAction` は `RepoBrand<string>` のため enum 拡張不要）。
  `listByTarget(env.ctx, "tag", "tag_001", 10)` で 1 件取得でき、`before: { code: "old" }` / `after: { code: "new" }` が round-trip すること。

## 5. TDD Red の期待

- 実装前（Phase 5 適用前）は以下が **fail（Red）** する：
  - R-1..R-5（`code` / `expectedCode` 入力が未対応・戻り型が `TagDefinitionRow | null` のため `toEqual({ok:...})` が不一致）。
  - R-6 既存 3 アサーションの新返却型移行（旧 `toBeNull()` / `toMatchObject(row)` のままなら型・値不一致）。
  - C-1..C-5（`UpdateTagBodyZ` が `code` を弾き `no_update_fields`/`invalid_body`、`tag_stale_conflict` 未定義、`admin.tag.code_renamed` 未発火）。
  - Reg-1（rename 自体が PATCH で不可能なため 200 が得られない）。
  - Reg-2 は型上は通る可能性があるが、action 文字列の round-trip を明示 assert する追加ケースとして Red→Green を確認。
- C-6 / 既存 admin.tag.updated・created・deactivated は実装後も **非破壊（Green 維持）** であることを併せて確認する。

## 6. 観測点まとめ（捏造防止チェック）

- error code は全て snake_case、audit action は全て dot 区切りで DESIGN-BRIEF §5 と逐語一致。
- D1 config 必須（unit config では本 spec 群が exclude）。
- 全テストは public 関数 / route のみを対象（private テスト方針なし）。
