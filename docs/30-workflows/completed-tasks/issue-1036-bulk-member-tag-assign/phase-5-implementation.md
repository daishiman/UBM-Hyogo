# Phase 5: 実装（TDD Green）

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 前提 | Phase 4 の RED テストが全て失敗していること |
| Phase 区分 | 実装（TDD Green）。Phase 4 の spec を最小実装で green にする |
| CONST_005 | 「新規作成」「修正」ファイルパス一覧 + 実装手順 + 検証コマンド + DoD を含む |
| 対象 AC | AC-1〜AC-7 |

## 新規作成 / 修正ファイル一覧（Feedback RT-03）

### 新規作成

| パス | 内容 |
|------|------|
| `apps/api/src/routes/admin/tags-master.contract.spec.ts` | Phase 4 で作成済み（RED）。本 Phase では参照のみ |
| `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts` | Phase 4 で作成済み（RED） |
| `apps/api/src/repository/__tests__/memberTags.bulk.repository.spec.ts` | Phase 4 で作成済み（RED） |

> tag master read endpoint は **`members.ts` 内の `/admin` ルータに新設せず**、既存 router 構成を確認の上、最も近い mount 先に置く。新規ファイル `apps/api/src/routes/admin/tags.ts` を作る場合のみここに追加（Phase 5 手順 3 で確定）。

### 修正

| パス | 修正内容 |
|------|----------|
| `apps/api/src/repository/memberTags.ts` | 型 export（`BulkTagOp`/`BulkTagItemStatus`/`BulkTagOpResultItem`/`BulkApplyMemberTagsResult`）+ `bulkApplyMemberTagsByAdmin` 実装 + 不変条件 #13 第3経路コメント追記 |
| `apps/api/src/routes/admin/members.ts` | `BulkTagBodyZ` zod schema + `POST /members/tags/bulk` route を **`:memberId` 系より前に登録** + `GET /tags`（または別 router）mount |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | TC-D-03 の allow list 明示（同 wave 実施） |
| `apps/web/src/features/admin/api/members.ts` | `BulkTagItemStatus`/`BulkTagResultItem` 型 + `bulkApplyMemberTags` + `fetchTagMaster` |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | tag picker（TagPill 再利用）+ op 切替 + 実行（useAdminMutation 経由）+ 部分失敗集計表示 |

> docs（不変条件 #13 第3経路の memberTags.ts 先頭コメント、CLAUDE.md 整合）は task-C の責務。memberTags.ts 先頭コメントの追記は本 Phase で同時に行う（コードと同居のため）。

## 実装手順

### 手順 1: repository helper `bulkApplyMemberTagsByAdmin`（memberTags.ts）

`apps/api/src/repository/memberTags.ts` に追記する。

**型 export**（Phase 2 A-1 / task-A 確定値を転記）:

```typescript
export type BulkTagOp = "assign" | "unassign";

export type BulkTagItemStatus =
  | "assigned"        // assign で新規 INSERT（meta.changes > 0）
  | "unassigned"      // unassign で実 DELETE（meta.changes > 0）
  | "noop"            // assign で既存 / unassign で未存在（changes = 0・冪等）
  | "skipped_deleted" // member が is_deleted=1 もしくは member_identities に不在（D-1）
  | "tag_not_found";  // tag_definitions.active=1 に該当なし

export interface BulkTagOpResultItem {
  readonly memberId: string;
  readonly tagId: string;
  readonly status: BulkTagItemStatus;
}

export interface BulkApplyMemberTagsResult {
  readonly batchId: string;
  readonly results: ReadonlyArray<BulkTagOpResultItem>;
}
```

**関数シグネチャ**（task-A 確定）:

```typescript
export async function bulkApplyMemberTagsByAdmin(
  c: DbCtx,
  input: { memberIds: MemberId[]; tagIds: string[]; op: BulkTagOp },
  actor: { id: AdminId | null; email: AdminEmail | null },
): Promise<BulkApplyMemberTagsResult>;
```

> `AdminId` / `AdminEmail` の brand 型は既存 import（`asAdminId` / `adminEmail` を route で使用）に合わせる。helper 内で audit append するため `auditLog.append` を import する。

**アルゴリズム**（Phase 2 A-1 / Phase 3 D-1/D-3 確定版・N+1 回避）:

1. `const batchId = crypto.randomUUID();`
2. tag master active set を事前一括取得（1 クエリ）:
   ```typescript
   const masters = await getTagDefinitionMaster(c);          // active=1 のみ
   const activeTagIds = new Set(masters.map((m) => m.tagId));
   ```
3. member 存在 + is_deleted を memberIds で 1 クエリ一括取得（N+1 回避）:
   ```sql
   SELECT mi.member_id AS memberId,
          COALESCE(ms.is_deleted, 0) AS isDeleted
   FROM member_identities mi
   LEFT JOIN member_status ms ON ms.member_id = mi.member_id
   WHERE mi.member_id IN (<placeholders(memberIds.length)>)
   ```
   `placeholders()`（`./_shared/sql`）を使う。結果を `Map<memberId, boolean(isDeleted)>` 化。**map に無い memberId = 不在**。
4. 直積 loop（`for memberId of input.memberIds` → `for tagId of input.tagIds`）:
   - member skip 判定を **先**に行う（Phase 3 D-1 / TC-R-09）:
     ```typescript
     const present = deletedMap.has(memberId);
     const isDeleted = deletedMap.get(memberId) === true;
     if (!present || isDeleted) {
       results.push({ memberId, tagId, status: "skipped_deleted" });
       continue; // tag を評価しない
     }
     ```
   - tag master 不在:
     ```typescript
     if (!activeTagIds.has(tagId)) {
       results.push({ memberId, tagId, status: "tag_not_found" });
       continue;
     }
     ```
   - op = assign:
     ```sql
     INSERT OR IGNORE INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
     VALUES (?1, ?2, 'manual', NULL, ?3)
     ```
     `meta.changes > 0` → `assigned` + audit append、`= 0` → `noop`。
     `assigned_by` は `actor.email`（既存 `assignTagToMemberByAdmin` と同じく email を入れる）。
   - op = unassign:
     ```sql
     DELETE FROM member_tags WHERE member_id = ?1 AND tag_id = ?2
     ```
     `meta.changes > 0` → `unassigned` + audit append、`= 0` → `noop`。
5. audit append（実 mutation した item のみ・AC-3 / D-3）:
   ```typescript
   await append(c, {
     actorId: actor.id,
     actorEmail: actor.email,
     action: op === "assign"
       ? "admin.member.tag_assigned"
       : "admin.member.tag_unassigned",
     targetType: "member",
     targetId: memberId,
     before: op === "assign" ? null : { tagId, batchId },
     after:  op === "assign" ? { tagId, source: "manual", batchId } : null,
   });
   ```
   action 名は既存単一経路と完全 parity。`auditAction()` ラッパーが必要なら既存と同様に通す。
6. `return { batchId, results };`

> **db.batch() 不使用**: 部分成功レポート（AC-2）と「実 mutation のみ audit」（AC-3）を両立するため逐次 loop。tag master / deleted map は手順 2/3 で事前一括取得済みなので N+1 にならない（TC-R-10）。

**不変条件 #13 コメント追記**（memberTags.ts 先頭ブロック）:

> 既存 2 経路の記述の後に「第3経路: bulk admin manual write（`bulkApplyMemberTagsByAdmin`）。複数 member × 複数 tag を直積で assign/unassign し、実 mutation した item だけ audit（既存 action 名 parity・batchId 相関）を記録する」を追記する。

### 手順 2: bulk endpoint `POST /members/tags/bulk`（members.ts）

`apps/api/src/routes/admin/members.ts` の `createAdminMembersRoute()` 内、**`/members/:memberId/...` 系 route 群より前**に登録する（Phase 3 D-2）。

zod schema:

```typescript
const BulkTagBodyZ = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(200),
  tagIds: z.array(z.string().min(1)).min(1).max(50),
  op: z.enum(["assign", "unassign"]),
});
```

route:

```typescript
// 不変条件 #13 第3経路: bulk admin manual tag write。
// 具体パス /members/tags/bulk を /members/:memberId/... より前に登録（D-2: :memberId="tags" 誤マッチ回避）。
app.post("/members/tags/bulk", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid json" }, 400);
  }
  const parsed = BulkTagBodyZ.safeParse(raw);
  if (!parsed.success) {
    return c.json({ ok: false, error: "invalid_body" }, 400);
  }
  const db = ctx({ DB: c.env.DB });
  const authUser = c.get("authUser");
  const out = await bulkApplyMemberTagsByAdmin(
    db,
    {
      memberIds: parsed.data.memberIds.map(asMemberId),
      tagIds: parsed.data.tagIds,
      op: parsed.data.op,
    },
    { id: asAdminId(authUser.memberId), email: adminEmail(authUser.email) },
  );
  return c.json({ ok: true, batchId: out.batchId, results: out.results }, 200);
});
```

- 成功（部分失敗含む）= 200 + results。body 不正 = 400。未認証 = 既存 admin guard が 401。
- **登録順序**: この route を `app.get("/members/:memberId/tags", …)` などより上の行に置く（同一ファイルの route 定義順を D-2 に従って並べ替える）。TC-A-17 で誤マッチ無しを検証。

### 手順 3: tag master read `GET /admin/tags`（members.ts または tags.ts）

read-only endpoint。`getTagDefinitionMaster`（active=1 のみ）を返す。

```typescript
app.get("/tags", async (c) => {
  const db = ctx({ DB: c.env.DB });
  const available = await getTagDefinitionMaster(db);
  return c.json({ available }, 200);
});
```

- **mount 先確定**: `/admin/members/...` prefix と衝突しないよう `/admin` 直下に置く。既存 router 構成（`apps/api/src/routes/admin/` の index mount / `_shared.ts`）を確認し、`/admin/tags` が `/admin/members` ルータの外側に来る位置に mount する。`members.ts` 内ルータが `/admin` 直下なら `app.get("/tags", …)` で良いが、`members` prefix 配下なら別ファイル `tags.ts` を作り `/admin` にぶら下げる。Phase 4 の `tags-master.contract.spec.ts` の path を最終 mount に合わせる。
- tag master write は触れない（#1035 scope-out）。

### 手順 4: type-level gate 更新（memberTags.readonly.test-d.ts・同 wave）

Phase 4 で作成した TC-D-03 を実装側の export と整合させる。`bulkApplyMemberTagsByAdmin` を allow list 入口として明示参照する it を確定し、`bulk*` 命名が write keyword gate / assign gate のどちらにも該当しないことを既存 `WriteExports` / `UnauthorizedAssignExports` の `never` 維持で確認する。**この更新は手順 1 の export 追加と同じ commit wave で行う**（gate 漏れ防止・Phase 3 残リスク対策）。

### 手順 5: web API client（apps/web/src/features/admin/api/members.ts）

```typescript
export type BulkTagItemStatus =
  | "assigned" | "unassigned" | "noop" | "skipped_deleted" | "tag_not_found";

export interface BulkTagResultItem {
  memberId: string;
  tagId: string;
  status: BulkTagItemStatus;
}

const bulkTagsPath = "/api/admin/members/tags/bulk";
const tagMasterPath = "/api/admin/tags";

export async function bulkApplyMemberTags(
  memberIds: string[],
  tagIds: string[],
  op: "assign" | "unassign",
): Promise<{ batchId: string; results: BulkTagResultItem[] }> {
  const res = await fetch(bulkTagsPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ memberIds, tagIds, op }),
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { batchId: string; results: BulkTagResultItem[] };
}

export async function fetchTagMaster(): Promise<{ available: AdminTagRef[] }> {
  const res = await fetch(tagMasterPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { available: AdminTagRef[] };
}
```

- 既存 `AdminTagRef` 型を再利用。既存 `fetchMemberTags` などの fetch 規約（`/api/admin` prefix・`credentials: "same-origin"`）に揃える。

### 手順 6: BulkActionBar 拡張（apps/web/.../_members/BulkActionBar.tsx）

既存 props `{ selectedIds, onComplete }` を維持（AC-7）。tag セクションを既存 sticky bar の下段に追加する。

local state（task-B 確定）:

```typescript
const [tagMode, setTagMode] = useState<"assign" | "unassign">("assign");
const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
const [available, setAvailable] = useState<AdminTagRef[]>([]);
const [bulkResult, setBulkResult] = useState<{
  assigned: number; unassigned: number; noop: number;
  skipped_deleted: BulkTagResultItem[]; tag_not_found: BulkTagResultItem[];
} | null>(null);
```

- 初回 mount で `fetchTagMaster()` → `setAvailable(res.available)`（`useEffect`）。
- tag picker: `available` を category でグルーピングし `TagPill`（`selected`=selectedTagIds.has(tagId) / `onClick`=toggle / `aria-pressed`）で列挙。新規 primitive を生やさない（不変条件 #9・プロトタイプ正本順位）。
- op 切替: assign/unassign（既定 assign）。既存 `Switch` / segmented `Button` primitive を使う。
- 実行: **`useAdminMutation("/api/admin/members/tags/bulk", "POST", …)` 経由**（不変条件 #10）。`trigger` の中で `bulkApplyMemberTags([...selectedIds], [...selectedTagIds], tagMode)` を呼ぶ、または mutation の body をそのまま渡す。成功時 `results` を status 別集計し `setBulkResult`、`onComplete()` で一覧 refresh。
- 実行ボタンラベル: 「{selectedIds.length}人 × {selectedTagIds.size}タグ を{tagMode==="assign"?"付与":"解除"}」。`disabled` = `selectedIds.length===0 || selectedTagIds.size===0 || busy`。
- 結果表示: assigned/unassigned/noop の件数 + skipped_deleted / tag_not_found を member×tag 単位でリスト（`data-testid` 付き）。`useBulkRepublish` の failures 表示パターンを流用。
- 既存 publish/hide/soft-delete アクションは変更しない（AC-6 regression 防止）。

> OKLch トークンのみ使用（HEX 直書き / `bg-[#xxx]` 禁止・task-18 gate）。既存 bar の `var(--ubm-color-*)` 規約を踏襲。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install --force

# GREEN 確認（Phase 4 の RED が green へ）
mise exec -- pnpm --filter @ubm-hyogo/api test -- members-tags-bulk
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.bulk
mise exec -- pnpm --filter @ubm-hyogo/api test -- tags-master
mise exec -- pnpm --filter @ubm-hyogo/api test -- --typecheck memberTags.readonly
mise exec -- pnpm --filter @ubm-hyogo/web test -- BulkActionBar

# 既存 regression（AC-6）
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags.contract
mise exec -- pnpm --filter @ubm-hyogo/web test -- MembersTable

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件 (DoD)

- [ ] `bulkApplyMemberTagsByAdmin` + 型 export 実装、memberTags.ts 先頭に第3経路コメント追記
- [ ] `POST /admin/members/tags/bulk` が 200 + `{ batchId, results }` を返し `:memberId` 誤マッチ無し（TC-A-17 green）
- [ ] `GET /admin/tags` が `{ available }`（active-only）を返す（TC-T-01〜04 green）
- [ ] type-level gate green（`pnpm test -- --typecheck`）+ allow list 更新が同 wave
- [ ] web API client（`bulkApplyMemberTags`/`fetchTagMaster`）+ BulkActionBar tag セクション実装
- [ ] BulkActionBar は `useAdminMutation` 経由（#10）・`TagPill` 再利用（#9）・OKLch トークンのみ（task-18 gate）
- [ ] Phase 4 RED テストが全て GREEN
- [ ] 既存 `members.tags.contract.spec.ts` / `MembersTable.spec.tsx` regression 無し（AC-6）
- [ ] `pnpm typecheck && pnpm lint` green
