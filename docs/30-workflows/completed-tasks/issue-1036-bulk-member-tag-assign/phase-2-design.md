# Phase 2: 設計

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 前提 | Phase 1 完了 |
| 設計区分 | 実装仕様書（endpoint shape / repository signature / UI 契約を確定） |

## 真の論点（要件レビュー思考法）

### 1. 真の論点は何か
「複数 member × 複数 tag を一括で書き込む際、**部分失敗をどう正確にレポートし、再送を冪等に保つか**」が主問題。単なる UI ボタン追加ではなく、write 経路の整合（不変条件 #13）と冪等性設計が核心。

### 2. 依存関係・責務境界の問題点
- member_tags への write 経路は不変条件 #13 で 2 経路に限定済み。bulk を **第3経路** として明示的に追加し、type-level gate と先頭コメントを同時更新しないと境界が崩れる。
- 状態所有権: 選択 state（`selected: Set<string>`）は `MembersClientShell` が所有。BulkActionBar は受領するのみ。tag picker の選択 state（選んだ tag 群・op モード）は BulkActionBar 内 local state とする（既存 publish/hide の busy state 所有と同じレイヤ）。

### 3. 価値とコストの不均衡箇所
- 最大価値: 管理者が N 人 × M タグをワンクリックで処理（運用コスト削減）。
- 最大コスト部品: 部分失敗レポート UI と冪等性。ここを #913 idempotency store に依存させると別タスク待ちで完結不能 → **DB 自然冪等で代替**しコストを初期層に収める。

### 4. 改善優先順位
batch endpoint + repository（task-A） > bulk UI（task-B） > 不変条件 doc（task-C）。task-A が UI のデータ契約を固定するため最優先。

### 5. 4条件の評価
- **価値性**: 管理者の一括 tag 運用コストを削減。受益者と削減コストが明確。
- **実現性**: 既存単一 endpoint・選択基盤・audit・TagPill をすべて再利用。新規実装の厚みは batch loop + UI 1 セクションに収まる。
- **整合性**: 不変条件 #13 を第3経路として閉じ、type-level gate で機械強制。状態所有権は MembersClientShell（選択）/ BulkActionBar（tag picker・op）で分離。
- **運用性**: #913 非依存で resume 可能。audit batchId で監査追跡可能。

### 因果ループ
- バランスループ: 「bulk write 経路追加 → 不変条件 #13 違反リスク増 → type-level gate で allow list 強制 → 違反検出 → 経路抑制」。
- 強化ループ: 「一括処理で運用効率↑ → tag 付与頻度↑ → audit 量↑ → batchId 相関で追跡性維持」。

## 状態所有権テーブル

| 状態 | 所有者 | 受け渡し |
|------|--------|----------|
| 選択 member 集合（`selected: Set<string>`） | `MembersClientShell`（既存） | `BulkActionBar` に `selectedIds: ReadonlyArray<string>` で props 受領（既存契約のまま） |
| 選択 tag 集合（bulk 対象 tag） | `BulkActionBar` local state（`useState<Set<string>>`） | tag picker（BulkTagPicker）に渡す |
| op モード（assign/unassign） | `BulkActionBar` local state（`useState<"assign"\|"unassign">`） | 実行ボタンが参照 |
| 進行/部分失敗結果 | `BulkActionBar` local state（useBulkRepublish 類似の progress shape） | 結果表示セクションが参照 |
| tag master（available tags） | `BulkActionBar` が `fetchTagMaster()` で取得し local state 保持 | tag picker に渡す |

## task-A: API 設計（apps/api）

### A-1. repository helper — `bulkApplyMemberTagsByAdmin`

ファイル: `apps/api/src/repository/memberTags.ts`

```typescript
export type BulkTagOp = "assign" | "unassign";

export type BulkTagItemStatus =
  | "assigned"        // assign で新規 INSERT（changes > 0）
  | "unassigned"      // unassign で実 DELETE（changes > 0）
  | "noop"            // assign で既存 / unassign で未存在（changes = 0・冪等）
  | "skipped_deleted" // member_status.is_deleted = 1 で skip
  | "tag_not_found";  // tag_definitions.active = 1 に該当なし

export interface BulkTagOpResultItem {
  readonly memberId: string;
  readonly tagId: string;
  readonly status: BulkTagItemStatus;
}

export interface BulkApplyMemberTagsResult {
  readonly batchId: string;
  readonly results: ReadonlyArray<BulkTagOpResultItem>;
}

/**
 * 不変条件 #13 第3経路（bulk admin manual write）。
 * 複数 member × 複数 tag を直積で assign/unassign する。
 * - 削除済み member は skipped_deleted で skip し、他 member は継続（AC-4）
 * - 未登録 tag は tag_not_found（AC-2）
 * - assign は INSERT OR IGNORE（複合 PK 自然冪等）、unassign は DELETE
 * - changes=0 は noop（再送冪等・AC-5）
 * - 実 mutation（assigned/unassigned）した item だけ audit append（AC-3）
 *   audit after_json に batchId を埋めて bulk 相関（correlation_id 列は無いため）
 */
export async function bulkApplyMemberTagsByAdmin(
  c: DbCtx,
  input: { memberIds: MemberId[]; tagIds: string[]; op: BulkTagOp },
  actor: { id: AdminId | null; email: AdminEmail | null },
): Promise<BulkApplyMemberTagsResult>;
```

#### 実装アルゴリズム（N+1 回避）

1. `batchId = crypto.randomUUID()`
2. **事前一括取得**:
   - tag master active set: `getTagDefinitionMaster(c)` → `Set<tagId>`（active=1 のみ）
   - member deleted map: memberIds をまとめて 1 クエリで取得
     ```sql
     SELECT mi.member_id, COALESCE(ms.is_deleted, 0) AS is_deleted
     FROM member_identities mi
     LEFT JOIN member_status ms ON ms.member_id = mi.member_id
     WHERE mi.member_id IN (?, ?, …)
     ```
     存在しない member_id は map に含まれない → `tag_not_found` ではなく member 不在は本 endpoint では `skipped_deleted` 扱いにはせず、後述の precondition で扱う。
     **設計判断**: member 不在も `skipped_deleted` には該当しないため、本 bulk では「存在し is_deleted=1」を `skipped_deleted`、「存在しない member」は item 自体を生成せず results から除外せず `skipped_deleted` に寄せると意味が崩れる。→ **member 不在は `skipped_deleted` とは別概念だが、AC では未定義。Phase 3 でレビューし、`skipped_deleted` は is_deleted=1 限定とし、存在しない member は `skipped_deleted` に含めず results に `status: "skipped_deleted"` を返さない方針**。実装は「存在チェックで未存在 member は全 tag を `skipped_deleted` として返す」で AC-4 の「他 member は継続」を満たす（呼び出し側の堅牢性優先）。最終決定は Phase 3。
3. **直積 loop**（memberId × tagId）:
   - member が削除済み(or 不在) → `skipped_deleted`、continue
   - tagId が tag master active set に無い → `tag_not_found`、continue
   - op = assign:
     ```sql
     INSERT OR IGNORE INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
     VALUES (?1, ?2, 'manual', NULL, ?3)
     ```
     `meta.changes > 0` → `assigned` + audit append、`= 0` → `noop`
   - op = unassign:
     ```sql
     DELETE FROM member_tags WHERE member_id = ?1 AND tag_id = ?2
     ```
     `meta.changes > 0` → `unassigned` + audit append、`= 0` → `noop`
4. audit append（実 mutation した item のみ・AC-3）:
   ```typescript
   await append(c, {
     actorId: actor.id, actorEmail: actor.email,
     action: auditAction(op === "assign" ? "admin.member.tag_assigned" : "admin.member.tag_unassigned"),
     targetType: "member", targetId: memberId,
     before: op === "assign" ? null : { tagId },
     after:  op === "assign" ? { tagId, source: "manual", batchId } : null,
   });
   ```
   > unassign 時に `batchId` を残すため、unassign は `before: { tagId, batchId }` でも良い。Phase 3 で before/after の batchId 配置を確定。
5. return `{ batchId, results }`

> **D1 batch vs loop**: 部分成功レポート（AC-2）と「実 mutation のみ audit」（AC-3）を両立するため `db.batch()`（all-or-nothing）は使わず、既存 `assignTagsToMember` と同じ **逐次 loop** で実装する。tag master / deleted map の事前一括取得で N+1 を回避する。

### A-2. bulk endpoint — `POST /admin/members/tags/bulk`

ファイル: `apps/api/src/routes/admin/members.ts`

```typescript
// zod schema
const BulkTagBodyZ = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(200),
  tagIds: z.array(z.string().min(1)).min(1).max(50),
  op: z.enum(["assign", "unassign"]),
});

// route — 具体パスを :memberId/tags より前に登録（Hono ルート順序）
app.post("/members/tags/bulk", async (c) => {
  const parsed = BulkTagBodyZ.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: "invalid_body" }, 400);
  const authUser = /* 既存 admin auth context */;
  const db = ctx({ DB: c.env.DB });
  const out = await bulkApplyMemberTagsByAdmin(
    db,
    {
      memberIds: parsed.data.memberIds.map(asMemberId),
      tagIds: parsed.data.tagIds,
      op: parsed.data.op,
    },
    { id: authUser.id ?? null, email: authUser.email ?? null },
  );
  return c.json({ ok: true, batchId: out.batchId, results: out.results }, 200);
});
```

- ステータス: 成功 200（部分失敗も 200 + results で表現）、body 不正 400、未認証 401/403（既存 admin guard）
- **ルート順序の注意**: `/members/tags/bulk` は `/members/:memberId/tags` の `:memberId="tags"` と誤マッチしうる。Hono は登録順マッチのため、**bulk route を `:memberId` 系より前に配置**する。Phase 3/4 でルート mount 順を検証。

### A-3. tag master read endpoint — `GET /admin/tags`

ファイル: `apps/api/src/routes/admin/members.ts`（または新規 `apps/api/src/routes/admin/tags.ts`。既存 mount に合わせ Phase 3 で確定）

```typescript
app.get("/tags", async (c) => {
  const db = ctx({ DB: c.env.DB });
  const available = await getTagDefinitionMaster(db); // active=1 のみ
  return c.json({ available }, 200);
});
```

- レスポンス: `{ available: TagRef[] }`（`TagRef = { tagId, code, label, category }`）
- read-only。tag master write は #1035 の責務（本タスクでは触れない）

### A-4. type-level write gate 更新

ファイル: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`

- `bulkApplyMemberTagsByAdmin` は `assign*`/`insert*`/`update*`/`delete*`/`upsert*`/`unassign` prefix に該当しない命名のため **write keyword gate には抵触しない**。
- ただし不変条件 #13 の write 経路明示のため、allow list（`assignTagsToMember` / `assignTagToMemberByAdmin`）と並べて `bulkApplyMemberTagsByAdmin` を「許可された write 入口」として test で明示参照する（`expectTypeOf<ModuleExports["bulkApplyMemberTagsByAdmin"]>().not.toBeAny()`）。
- production reference allow list（`memberTags.repository.spec.ts` の `ALLOWED_ASSIGN_TAGS_PRODUCTION_FILES`）に新 helper を呼ぶファイル（`members.ts`）が既登録か確認し、未登録なら追加。

## task-B: UI 設計（apps/web）

### B-1. API client — `apps/web/src/features/admin/api/members.ts`

```typescript
export type BulkTagItemStatus =
  | "assigned" | "unassigned" | "noop" | "skipped_deleted" | "tag_not_found";

export interface BulkTagResultItem {
  memberId: string; tagId: string; status: BulkTagItemStatus;
}

export async function bulkApplyMemberTags(
  memberIds: string[], tagIds: string[], op: "assign" | "unassign",
): Promise<{ batchId: string; results: BulkTagResultItem[] }> {
  // call("/members/tags/bulk", "POST", { memberIds, tagIds, op })
}

export async function fetchTagMaster(): Promise<{ available: AdminTagRef[] }> {
  // call("/tags", "GET")
}
```

- 既存 `apps/web/src/lib/admin/api.ts` の `call()` ラッパーを使う（`/api/admin` prefix 自動付与）。

### B-2. BulkActionBar 拡張

ファイル: `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`

- props は既存 `{ selectedIds, onComplete }` を維持（AC-7「既存選択基盤を再利用」）。
- 追加 local state:
  - `tagMode: "assign" | "unassign"`（既定 "assign"）
  - `selectedTagIds: Set<string>`
  - `available: AdminTagRef[]`（初回 `fetchTagMaster()` で取得）
  - `bulkResult: { total; succeeded; failed; items } | null`（部分失敗表示）
- UI 構造（既存 sticky bar の下段に tag セクションを追加）:
  - tag picker: `available` を `TagPill`（`selected`=selectedTagIds に含む / `onClick`=toggle）で列挙。category でグルーピング。
  - op 切替: assign/unassign の `Switch` または segmented `Button`。
  - 実行ボタン: 「{selectedIds.length}人 × {selectedTagIds.size}タグ を{付与/解除}」。`useAdminMutation` 経由で `bulkApplyMemberTags` 呼び出し（不変条件 #10）。
  - 結果表示: `results` を status 別に集計（assigned/unassigned/noop/skipped_deleted/tag_not_found の件数）。失敗系（skipped_deleted/tag_not_found）は member×tag 単位でリスト表示（`useBulkRepublish` の failures 表示パターン流用）。
- 実行後 `onComplete()` で一覧 refresh（既存契約）。

### B-3. tag picker 実装方針

- 新規 primitive は生やさない（不変条件・プロトタイプ正本順位）。既存 `TagPill`（`_shared/TagPill.tsx`）を選択 UI に使う。
- 多数 tag 時の折りたたみは将来課題（scope-out: tag master pagination）。初期は active tag 全件を category グルーピング表示。

## task-C: docs 設計

- `apps/api/src/repository/memberTags.ts` 先頭の不変条件 #13 コメントに「第3経路: bulk admin manual write（`bulkApplyMemberTagsByAdmin`）。必ず audit（既存 action 名 parity）を記録」を追記。
- 必要なら `CLAUDE.md` の不変条件 #13 記述（あれば）を第3経路に整合。無ければ memberTags.ts コメントのみ。
- visual baseline: Phase 11 で BulkActionBar の tag セクション screenshot を canonical 名で取得。

## ライブラリ選定

- 新規ライブラリ採用なし（既存 zod / Hono / D1 / React のみ）。サードパーティの複合フィールド semantics 確認は不要。

## SubAgent lane（Phase 4 以降の並列方針）

| lane | 担当 | 並列性 |
|------|------|--------|
| lane-A | task-A（API: endpoint/repository/audit/type gate）の Phase 4-13 記述 | 並列可 |
| lane-B | task-B（UI: BulkActionBar/API client）の Phase 4-13 記述 | 並列可（task-A の契約に依存するが、契約は本 Phase 2 で確定済み） |
| lane-C | task-C（docs/不変条件/visual） + 横断 Phase（7/8/9/10/12）の記述 | 直列で締める |

> 3 並列以下。validation lane（Phase 9/12 検証）は直列で締める。

## 完了条件 (DoD)

- [x] repository helper のシグネチャと冪等アルゴリズムが確定
- [x] bulk endpoint / tag master read endpoint の path・zod・レスポンス shape が確定
- [x] type-level gate 更新方針が確定
- [x] BulkActionBar の state ownership と UI 契約が確定
- [x] #913 非依存・DB 自然冪等の設計が明記されている
- [ ] Phase 3 レビューゲート通過（member 不在の status 扱い / ルート順序 / batchId 配置の 3 点を確定）
