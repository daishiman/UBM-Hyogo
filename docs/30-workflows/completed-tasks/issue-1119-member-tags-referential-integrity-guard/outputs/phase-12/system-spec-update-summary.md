# System Spec Update Summary（issue-1119-member-tags-referential-integrity-guard）

> **status: implemented_local** / NON_VISUAL
> aiworkflow-requirements 正本（SSOT）への反映判定。Step 1（既存 spec 更新）/ Step 2（新規インターフェース登録）。

---

## Step 1 判定 — 既存 system spec の更新要否

### Step 1-A: `docs/00-getting-started-manual/specs/` の更新

**判定: 非該当。**

- D1 schema 変更なし（migration 追加なし）。`member_tags` / `tag_definitions` のテーブル定義は不変。
- API schema（`01-api-schema.md`）への影響なし（Google Form 項目に関与しない admin-managed data 領域の read-only 監査）。
- `08-free-database.md` の D1 構成に変更なし（追加クエリは read-only の軽量 COUNT / SELECT のみ・書き込み副作用ゼロ）。

### Step 1-B: `references/api-endpoints.md` への新 endpoint 登録

**判定: 該当（本レビューで反映済み）。**

- 新 endpoint `GET /admin/tags/orphans`（read-only 監査 surface）を登録する設計。
- レスポンス shape: `{ ok: true, count: number, orphans: OrphanMemberTag[] }`。
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` に本レビューで追記済み。

### Step 1-C: aiworkflow-requirements index / resource-map / quick-reference / task-workflow-active への workflow 登録

**判定: 該当（本レビューで反映済み）。**

- issue-1119 workflow を skill 索引（resource-map / quick-reference / task-workflow-active）と artifact inventory へ登録済み。
- topic-map / keywords は本レビューで workflow 到達性を同期済み。

---

## Step 2 判定 — 新規インターフェース（公開関数 / 型 / endpoint）の SSOT 登録

**判定: 該当。** 新規 read 関数 2 + endpoint 1 + 型 1 を追加するため Step 2 に該当する。

| 種別 | 名称 | シグネチャ / 形 | 公開先 |
|------|------|------------------|--------|
| 型 | `OrphanMemberTag` | `{ memberId: string; tagId: string; source: string; assignedAt: string; assignedBy: string \| null }` | `apps/api/src/repository/memberTags.ts` |
| 関数（read） | `detectOrphanMemberTags` | `(c: DbCtx) => Promise<OrphanMemberTag[]>` | 同上 |
| 関数（read） | `countOrphanMemberTags` | `(c: DbCtx) => Promise<number>` | 同上 |
| endpoint（read-only） | `GET /admin/tags/orphans` | `() => { ok: true, count, orphans }` | `apps/api/src/routes/admin/tags.ts` |

### invariant #13 整合

- 追加 export は read 2 関数のみ。`detect`/`count` prefix は `memberTags.readonly.test-d.ts` の禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）に非該当。
- member_tags の write 経路（`assign*` 4 関数）は不変。

### SSOT 登録対象

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`（`GET /admin/tags/orphans`）: 本レビューで反映済み
- `.claude/skills/aiworkflow-requirements/indexes/`（topic-map / keywords）: 本レビューで到達性同期済み
- `resource-map.md` / `quick-reference.md` / `task-workflow-active.md`: 本レビューで workflow 登録済み
- `workflow-issue-1119-member-tags-referential-integrity-guard-artifact-inventory.md`: 本レビューで新規作成済み

---

## まとめ

| Step | 該当 | 反映タイミング |
|------|------|----------------|
| Step 1-A（specs 更新） | 非該当 | — |
| Step 1-B（api-endpoints.md） | 該当 | 本レビューで反映済み |
| Step 1-C（index / resource-map / quick-reference / task-workflow-active） | 該当 | 本レビューで workflow 登録済み |
| Step 2（新規インターフェース登録） | 該当 | 本レビューで反映済み |

implemented_local 段階で workflow の discoverability と endpoint SSOT は正本へ同期済み。commit / push / PR / deploy / 実 D1 orphan query は user-gated。
