# Implementation guide

> **本書のステータス**: `implemented_local_runtime_pending`（2026-06-01 本サイクルで実装完了）。
> 下記の型定義・signature・status・定数のとおり apps/api / apps/web に実装済み。
> ローカル検証は全 green（api/web typecheck exit 0 / lint exit 0 / 新規 36 + 既存 regression 21 = テスト計 57 passed / type-level gate 6 passed / verify-design-tokens 同期）。
> 残（user-gated）は本書末尾「残作業」を参照（Phase 11 screenshot は staging 認証必須・commit/PR は明示承認後）。

## Part 1: 中学生レベル

会員の一覧画面で、何人もの会員にいっぺんに「興味タグ」のシールを貼ったり剥がしたりできるようにする。

今までは会員を 1 人ずつ開いて、シールを 1 枚ずつ貼り外ししていた。たとえば「この 20 人に
『初参加』のシールを貼りたい」というとき、20 回も同じ作業をくり返すのは大変だった。
そこで、リストでチェックを入れた会員みんなに、選んだシールをまとめて貼る（または剥がす）
ボタンを作る。

大事なのは「途中でうまくいかなかった分も、ちゃんと結果が分かる」こと。たとえば、
もう退会した会員が混ざっていたら、その人だけは飛ばして、残りの人にはちゃんと貼る。そして
「この人は退会済みだから飛ばしたよ」と画面に出す。さらに、同じ操作をもう一度押しても
二重に貼られたりしないようにする（すでに貼ってあるシールはそのまま）。誰がいつ貼ったかの
メモ（記録）も、実際に貼り変えた分だけ残す。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| タグ（tag） | 会員に貼る分類シール |
| bulk（一括） | 何人ぶんもまとめて一度に |
| API / endpoint | 画面と保存場所をつなぐ連絡口 |
| 冪等（べきとう） | 同じボタンを何回押しても結果が変わらないこと |
| audit | 誰が何をしたかのメモ |
| repository | 保存場所へ読み書きする係 |
| batchId | 「この 1 回のまとめ操作」につける番号（あとで一括分を探せる） |

## Part 2: 技術者レベル

### 全体構成

3 task に分割する（すべて同一サイクル内で完結 / 先送りなし＝CONST_007）。

| task | 領域 | 責務 |
| --- | --- | --- |
| task-A | apps/api | bulk endpoint + repository helper + tag master read endpoint + audit + type-level gate |
| task-B | apps/web | BulkActionBar tag picker + assign/unassign + 部分失敗表示 + API client |
| task-C | docs | 不変条件 #13 第3経路（bulk admin write）再定義 |

### API contract（task-A）

| Method | Path | Contract |
| --- | --- | --- |
| POST | `/admin/members/tags/bulk` | body `{ memberIds, tagIds, op }`、200 + `{ batchId, results }`（部分失敗も 200） |
| GET | `/admin/tags` | `{ available: TagRef[] }`（active=1 の tag master read のみ） |

> **ルート順序（Phase 3 D-2 確定）**: `POST /members/tags/bulk` は `POST/GET/DELETE
> /members/:memberId/tags` **より前に登録**する。Hono は登録順マッチのため、`:memberId="tags"`
> への誤マッチを避ける。`GET /admin/tags` は members prefix 外（`/admin` 直下）に mount する。

### 型定義（TypeScript・確定）

repository（`apps/api/src/repository/memberTags.ts`）:

```typescript
export type BulkTagOp = "assign" | "unassign";

export type BulkTagItemStatus =
  | "assigned"        // assign で新規 INSERT（meta.changes > 0）
  | "unassigned"      // unassign で実 DELETE（meta.changes > 0）
  | "noop"            // assign で既存 / unassign で未存在（changes = 0・冪等）
  | "skipped_deleted" // member が書き込み対象外（is_deleted=1 または member 不在）
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
 * - 書き込み対象外 member（is_deleted=1 / 不在）は skipped_deleted で skip し他 member は継続（AC-4）
 * - 未登録 tag は tag_not_found（AC-2）
 * - assign は INSERT OR IGNORE（複合 PK 自然冪等）、unassign は DELETE
 * - changes=0 は noop（再送冪等・AC-5）
 * - 実 mutation（assigned/unassigned）した item だけ audit append（AC-3）。
 *   audit に batchId を埋めて bulk 相関（correlation_id 列は無いため）
 */
export async function bulkApplyMemberTagsByAdmin(
  c: DbCtx,
  input: { memberIds: MemberId[]; tagIds: string[]; op: BulkTagOp },
  actor: { id: AdminId | null; email: AdminEmail | null },
): Promise<BulkApplyMemberTagsResult>;
```

endpoint zod schema（`apps/api/src/routes/admin/members.ts`）:

```typescript
const BulkTagBodyZ = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(200),
  tagIds: z.array(z.string().min(1)).min(1).max(50),
  op: z.enum(["assign", "unassign"]),
});
```

web API client（`apps/web/src/features/admin/api/members.ts`）:

```typescript
export type BulkTagItemStatus =
  | "assigned" | "unassigned" | "noop" | "skipped_deleted" | "tag_not_found";

export interface BulkTagResultItem {
  memberId: string; tagId: string; status: BulkTagItemStatus;
}

export async function bulkApplyMemberTags(
  memberIds: string[], tagIds: string[], op: "assign" | "unassign",
): Promise<{ batchId: string; results: BulkTagResultItem[] }>;

export async function fetchTagMaster(): Promise<{ available: AdminTagRef[] }>;
```

### アルゴリズム（N+1 回避・確定版）

1. `batchId = crypto.randomUUID()`
2. tag master active set を `getTagDefinitionMaster(c)` で取得 → `Set<tagId>`（事前 1 クエリ）。
3. member 存在 + `is_deleted` を memberIds で **1 クエリ一括取得**（`member_identities` LEFT JOIN
   `member_status`）。
4. memberId × tagId 直積 loop:
   - member 不在 or `is_deleted=1` → `skipped_deleted`（tag を評価せず continue）。
   - tagId ∉ active set → `tag_not_found`。
   - op=assign: `INSERT OR IGNORE INTO member_tags (...) VALUES (...)` → `meta.changes > 0` で
     `assigned` + audit、`= 0` で `noop`。
   - op=unassign: `DELETE FROM member_tags WHERE member_id=?1 AND tag_id=?2` → `changes > 0` で
     `unassigned` + audit、`= 0` で `noop`。
5. audit（実 mutation のみ・AC-3）: action は `admin.member.tag_assigned` /
   `admin.member.tag_unassigned`（既存 action 名 parity）、targetType `"member"`、targetId memberId。
   - assign: `before: null`, `after: { tagId, source: "manual", batchId }`
   - unassign: `before: { tagId, batchId }`, `after: null`
6. return `{ batchId, results }`。

> **D1 batch vs loop**: 部分成功レポート（AC-2）と「実 mutation のみ audit」（AC-3）を両立する
> ため `db.batch()`（all-or-nothing）は使わず、既存 `assignTagsToMember` と同じ逐次 loop で実装する。
> tag master / deleted map の事前一括取得で N+1 を回避する。

### エラー / エッジケース

| ケース | 挙動 |
| --- | --- |
| body schema 不正 | 400 `invalid_body`（zod safeParse 失敗） |
| 未認証 / 権限なし | 既存 admin guard により 401 / 403 |
| member 不在 | endpoint 全体を落とさず item を `skipped_deleted`（AC-4「他 member は継続」担保） |
| member 削除済み（is_deleted=1） | `skipped_deleted` |
| tag 未登録 / inactive | `tag_not_found` |
| 既に付与済みに assign 再送 | `noop`（複合 PK 自然冪等・追加 audit なし＝AC-5） |
| 未付与に unassign | `noop`（changes=0・追加 audit なし） |
| memberIds > 200 / tagIds > 50 | 400（zod 上限超過） |
| 不在/削除 member と未登録 tag の混在 | member skip を tag より先に判定（skip 時 tag を評価しない） |

### 定数

| 定数 | 値 | 根拠 |
| --- | --- | --- |
| memberIds 上限 | 200 | loop 長時間化防止（実運用は数十件想定） |
| tagIds 上限 | 50 | 同上 |
| member_tags source | `'manual'` | 既存単一 admin write と parity |
| audit action（assign） | `admin.member.tag_assigned` | 既存単一 endpoint と parity（AC-3） |
| audit action（unassign） | `admin.member.tag_unassigned` | 同上 |
| audit targetType | `"member"` | 既存 parity |

### UI 契約（task-B）

- props は既存 `{ selectedIds, onComplete }` を維持（AC-7「既存選択基盤を再利用」）。
- local state: `tagMode`（assign/unassign・既定 assign）/ `selectedTagIds: Set<string>` /
  `available: AdminTagRef[]`（初回 `fetchTagMaster()`）/ `bulkResult`（部分失敗集計）。
- tag picker は既存 `TagPill`（`_shared/TagPill.tsx`）を再利用（新規 primitive を生やさない）。
  category でグルーピング。`aria-pressed` で選択状態。
- 実行は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）→ `bulkApplyMemberTags`。
- 実行ボタンラベル「{selectedIds.length}人 × {selectedTagIds.size}タグ を{付与|解除}」。
  disabled = selectedIds 空 or selectedTagIds 空 or busy。
- 結果表示: `results` を status 別集計。skip/not_found は member×tag 単位で `data-testid` 付きリスト。
- 完了後 `onComplete()` で一覧 refresh（既存契約）。
- OKLch トークンのみ（HEX 直書き / `bg-[#xxx]` 禁止・task-18 gate）。

### 不変条件への影響（task-C）

- #5（D1 直接アクセスは apps/api）: bulk write は apps/api repository に閉じる。apps/web は fetch のみ。
- #9（admin form input は FormField 経由）: tag picker は TagPill / 既存 primitive。`<input>` を増やさない。
- #10（admin mutation は features/admin useAdminMutation）: bulk 実行は同 hook 経由。
- #13（member_tags write は限定経路）: **第3経路（bulk admin write）として再定義**。
  `bulkApplyMemberTagsByAdmin` を type-level gate allow list に追加し、memberTags.ts 先頭コメントを更新。

## 視覚証跡（VISUAL_ON_EXECUTION）

実装区分は VISUAL_ON_EXECUTION。screenshot canonical 名は Phase 11 と一致させる。
local fixture による 4 状態の screenshot は取得済み。staging 認証付き `/admin/members`
実機 baseline は user-gated。

| 画面状態 | baseline 名 | 状態 |
| --- | --- | --- |
| tag picker（assign モード） | `bulk-tag-picker-assign-mode.png` | present（local fixture） |
| tag picker（unassign モード） | `bulk-tag-picker-unassign-mode.png` | present（local fixture） |
| 実行結果（全件成功） | `bulk-tag-result-all-success.png` | present（local fixture） |
| 実行結果（部分失敗） | `bulk-tag-result-partial-failure.png` | present（local fixture） |

canonical 名は spec（Phase 11）/ capture metadata / 本ガイド / ledger の 4 か所で一致させる。

## 実装済み（2026-06-01）

- task-A: `bulkApplyMemberTagsByAdmin`（repository）+ `POST /admin/members/tags/bulk` + `GET /admin/tags`
  + audit（実 mutation 単位・batchId 相関）+ type-level gate allow list。contract 11 / repository 6 /
  既存 regression 13 = 30 passed。
- task-B: `bulkApplyMemberTags` / `fetchTagMaster`（web client）+ `BulkActionBar` tag picker
  （TagPill 再利用・op 切替・部分失敗集計・`useAdminMutation` 経由）。component 10 / 既存 8 = 18 passed。
- task-C: memberTags.ts 先頭コメントに不変条件 #13 第3経路を追記。CLAUDE.md は #13 記述が無く N/A。

## 残作業（user-gated）

- staging 認証付き `/admin/members` 実機 baseline 取得（local fixture screenshot は保存済み）。
- commit / push / PR 作成（ユーザー明示承認後のみ）。
- Issue #1036 は CLOSED 維持（reopen しない・PR は `Refs #1036`）。
