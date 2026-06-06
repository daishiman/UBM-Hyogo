# Phase 6: テスト拡充（fail path / 回帰 guard）

> 正本: `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/DESIGN-BRIEF.md` §6。
> Phase 4 の Happy/主要 fail path に加え、**回帰 guard・複合ケース・既存 audit 非破壊** を補強する。
> 全テストは D1 config（`vitest.d1.config.ts`）で実行。public route / public 関数のみ対象。

## 0. 実行コマンド（再掲・D1 必須）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

## 1. 回帰 guard（Reg-1 / Reg-2）の追加

### Reg-1: rename 後の member tag 解決（`members.tags.contract.spec.ts`）
- **狙い**: code rename が assigned/available の解決を壊さないこと（tag_id 経由・AC-3）を route 層で証明。
- **Arrange**: `seedMembers(env)` → `POST /members/m1/tags` `{ tagId:"tag_eng" }` で付与 → `createAdminTagsRoute()` の
  `PATCH /tags/tag_eng` `{ "code":"engineer_renamed" }`（200）。
- **Act**: `GET /members/m1/tags`。
- **Assert**:
  - `body.assigned.map(t => t.tagId)` に `tag_eng` を含む（rename で消えない）。
  - 当該 assigned tag の `code` は新値 `engineer_renamed`（tag master JOIN が最新 code を反映）。
  - `body.assigned` の件数は rename 前後で不変。

### Reg-2: 新 action 文字列 `admin.tag.code_renamed` の append（`auditLog.repository.spec.ts`）
- **狙い**: `AuditAction` が `RepoBrand<string>` のため新 action 文字列が型エラーなく append/round-trip できること。
- **Arrange**: `setupD1()` + `seedAuditLog`。
- **Act**: `auditLog.append(env.ctx, { ..., action: auditAction("admin.tag.code_renamed"), targetType:"tag", targetId:"tag_001", before:{ code:"old" }, after:{ code:"new" } })`。
- **Assert**: 型エラーなし。`listByTarget(env.ctx, "tag", "tag_001", 10)` が 1 件、`before:{code:"old"}` / `after:{code:"new"}` round-trip。

## 2. 複合・fail path ケースの追加（`tags.contract.spec.ts`）

### 2.1 code + label 同時更新 → audit 2 行発火
- **Act**: `PATCH /tags/tag_eng` body `{ "code":"engineer_x", "label":"Engineer X" }`。
- **Assert**:
  - `res.status === 200`、body `toMatchObject({ code:"engineer_x", label:"Engineer X" })`。
  - `auditCount(env, "admin.tag.code_renamed") === 1`（before `{code:"engineer"}` / after `{code:"engineer_x"}`）。
  - `auditCount(env, "admin.tag.updated") === 1`（before `{label:"エンジニア",category:"occupation"}` / after `{label:"Engineer X",...}`）。
  - 2 種が **独立に** 1 行ずつ append されること（合計 2 行）。

### 2.2 空 body → `no_update_fields`（400）
- **Act**: `PATCH /tags/tag_eng` body `{}`。
- **Assert**: `res.status === 400`、`{ ok:false, error:"no_update_fields" }`。audit 0 行（code_renamed / updated とも 0）。
- 補足: `expectedCode` のみ（`{ "expectedCode":"engineer" }`）も refine で `no_update_fields`（更新対象なし）。

### 2.3 CODE_RE 違反 → `invalid_body`（400）
- **Act**: `PATCH /tags/tag_eng` body `{ "code":"Bad Code!" }`（大文字・空白・記号で `/^[a-z0-9][a-z0-9_]*$/` 違反）。
- **Assert**: `res.status === 400`、`{ ok:false, error:"invalid_body" }`。tag_eng の code は `engineer` 不変。audit 0 行。
- **境界**: `{ "code":"_leading" }`（先頭 `_`）も CODE_RE 違反 → `invalid_body`。`{ "code":"a" }`（最小 1 文字）は通過。

### 2.4 expectedCode 一致時は rename 成功（CAS 正常系の補完）
- **Act**: `PATCH /tags/tag_eng` body `{ "code":"engineer_cas", "expectedCode":"engineer" }`。
- **Assert**: `res.status === 200`、body.code === `engineer_cas`。`auditCount(env, "admin.tag.code_renamed") === 1`。

## 3. 既存 audit 系の回帰非破壊確認

DESIGN-BRIEF §4 の通り、既存 contract test（`tags.contract.spec.ts`）の以下は **変更後も Green 維持** を確認する。

| 既存ケース | action | 期待 | 非破壊確認 |
| --- | --- | --- | --- |
| POST /tags 正常 | `admin.tag.created` | 201 / audit 1 | `appendTagAudit` union 拡張で型は広がるが既存呼び出し不変 |
| POST /tags 重複 code | `admin.tag.created` | 409 `tag_code_conflict` / audit 0 | `ERROR_TO_STATUS` 既存キー不変 |
| PATCH label/category | `admin.tag.updated` | 200 / audit 1 | `samePatchValues` 判定・既存 body（code 含む `{label,category,code:"ignored"}`）が `code` を反映するようになる点に注意 |
| PATCH no-op（同値 label） | `admin.tag.updated` | 200 / audit 増えない | `before.code !== after.code` も false・label 同値で発火なし |
| DELETE 冪等 | `admin.tag.deactivated` | 204 / audit 1（2 回目も 1） | 本サイクル非変更 |
| queue route 優先 | — | queue が CRUD より先にマッチ | route mount 不変 |

> **既存テスト L143 の挙動変化に注意**: 現行 contract test の
> `PATCH /tags/tag_eng body { label:"Engineer", category:"role", code:"ignored" }` は、これまで `code` を無視していたが、
> 本サイクル後は `code:"ignored"` が CODE_RE 通過（`ignored` は小文字英字で合法）し **rename される**。
> このテストは「label/category のみ更新し code は ignored」という意図のため、Phase 6 で body から `code:"ignored"` を除去するか、
> 別途 `admin.tag.code_renamed` も 1 行発火する前提へアサーションを更新する。**前者（body から code 除去）を採用** し、
> 既存意図（label/category 更新）を保つ。これにより `auditCount(env, "admin.tag.updated") === 1` のままで Green。

## 4. 観測点まとめ

- fail path: `no_update_fields`（空 body）/ `invalid_body`（CODE_RE 違反）/ `tag_code_conflict`（UNIQUE）/ `tag_stale_conflict`（CAS）/ `tag_not_found`（不存在）の 5 種を網羅。
- 複合: code + label 同時更新で audit 2 行独立発火。
- 回帰: rename 後の member tag 解決（tag_id 経由）/ 新 action 文字列 append。
- 非破壊: created / updated / deactivated の既存 audit ケースを Green 維持。
