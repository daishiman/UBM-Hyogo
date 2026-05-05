[実装区分: 実装仕様書]
> 根拠: docs-only ラベルだが、目的達成に `apps/api` / `apps/web` / `packages/shared` の実コード変更が必要なため、CONST_004 例外として実装仕様書扱いとする。

# Phase 2: 設計 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 2 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 で確定した契約・ギャップを、`apps/api` / `apps/web` / `packages/shared` のファイル単位の構造設計に落とす。後続 Phase 5 ランブックが「設計通り実装するだけ」で完了できる粒度まで詳細化する。

## 実行タスク

1. `packages/shared` / `apps/api` / `apps/web` の責務境界を分解し、query schema、route handler、UI state の正本を 1 箇所ずつ定義する。
2. `tag` unknown、`pageSize`、`VISUAL_ON_EXECUTION` evidence の扱いを Phase 1〜13 で同じ語彙に揃える。
3. `completed-tasks/06c-B-admin-members` が実装正本であることを前提に、本 workflow は implementation execution spec と runtime evidence contract に限定する。
4. downstream 08b / 09a へ渡す evidence handoff と、本 workflow 内で実体化する outputs を分離する。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
- .claude/skills/aiworkflow-requirements/references/workflow-06c-B-admin-members-artifact-inventory.md

## 設計図（Mermaid）

```mermaid
flowchart LR
  Browser[Admin Browser] -->|cookie| WebGate[apps/web middleware]
  WebGate --> Page[apps/web /admin/members page.tsx (RSC)]
  Page -->|fetchAdmin| Proxy[apps/web /api/admin proxy]
  Proxy --> Guard[apps/api requireAdmin middleware]
  Guard --> Handler[apps/api admin/members handler]
  Handler --> Repo[(D1: members / member_tags / tag_definitions)]
  Handler -->|listByTarget| Audit[(audit_log)]
  Page --> Client[MembersClient (URL state, paging)]
  Client --> Drawer[MemberDrawer (detail, delete/restore)]
  Drawer -->|fetchAdmin POST| ProxyDel[/api/admin/members/:id/delete or /restore]
  ProxyDel --> Guard
```

## env / dependency matrix

| 層 | 入力 | 出力 | 依存 |
| --- | --- | --- | --- |
| apps/web `page.tsx` | cookie / search params | SSR HTML + initial data | apps/api GET list |
| apps/web `MembersClient` | initial data, URL params | client UI state, fetch trigger | URLSearchParams, `toAdminApiQuery()` |
| apps/web `MemberDrawer` | selected member id | client drawer + actions | apps/api GET detail / POST delete / POST restore |
| apps/web middleware | Auth.js cookie | admin HTML access decision | JWT `isAdmin` |
| apps/api `requireAdmin` | forwarded cookie | session + admin role | AUTH_SECRET (Cloudflare Secret) |
| apps/api `members.ts` | parsed query | JSON list | D1 binding |
| apps/api `member-delete.ts` | path id, `{ reason }`, actor | delete / restore JSON + audit row | D1 `DB.batch()` |

## ファイル単位の変更設計

### 1. `packages/shared/src/admin/search.ts`（新規）

- export `ADMIN_SEARCH_LIMITS = { Q_LIMIT: 200, TAG_LIMIT: 5, PAGE_SIZE: 50 } as const`
- export `AdminMemberSearchZ`（zod schema）
  - `filter: z.enum(["published","hidden","deleted"]).optional()`
  - `q: z.string().max(200).optional()`
  - `zone: z.enum(["all","0_to_1","1_to_10","10_to_100"]).default("all")`
  - `tag: z.array(z.string()).max(5).default([])`
  - `sort: z.enum(["recent","name"]).default("recent")`
  - `density: z.enum(["comfy","dense","list"]).default("comfy")`
  - `page: z.coerce.number().int().min(1).default(1)`
- export `type AdminMemberSearch = z.infer<typeof AdminMemberSearchZ>`
- export `toAdminApiQuery(search: AdminMemberSearch): URLSearchParams`
  - 空・default は省略してクエリ短縮、`tag[]` を repeated で append
- export `AdminMemberListView` 型に `page?: number` / `pageSize?: number` を後方互換で追加（既存 import 箇所が pre-existing でも optional のため壊れない）
- index barrel から re-export し、`apps/web` / `apps/api` 双方が import 可能にする

### 2. `apps/api/src/routes/admin/members.ts`（拡張）

- ハンドラ冒頭で `AdminMemberSearchZ.safeParse(c.req.query())` を実行し、失敗 → 422 with `{ error: "validation", issues }`
- `filter` 不正は旧契約互換のため 400（既存挙動を保持）
- SQL 組立（D1 prepared statement）
  - `q` は `LOWER(target) LIKE LOWER(?) ESCAPE '\'` で `%escaped%` パターン化
    - escape 対象: `\` `%` `_`
    - target 列: `response_email`, `json_extract(answers_json, '$.fullName')`, `'$.nickname'`, `'$.occupation'`, `'$.location'`, `'$.businessOverview'`, `'$.skills'`, `'$.canProvide'`, `'$.selfIntroduction'` を OR
  - `zone != "all"` のとき `json_extract(answers_json, '$.ubmZone') = ?`
  - `tag[]` 各要素を `EXISTS (SELECT 1 FROM member_tags mt JOIN tag_definitions td ON mt.tag_id = td.id WHERE mt.member_id = mi.member_id AND td.code = ?)` で AND 連結
  - `filter=published` → `is_deleted = 0 AND is_published = 1`
  - `filter=hidden` → `is_deleted = 0 AND is_published = 0`
  - `filter=deleted` → `is_deleted = 1`
  - `sort=recent` → `ORDER BY last_submitted_at DESC`
  - `sort=name` → `ORDER BY json_extract(answers_json, '$.fullName') ASC, last_submitted_at DESC`
  - `LIMIT 50 OFFSET (page-1)*50`
- `total` は同条件で `SELECT COUNT(DISTINCT mi.member_id)`（distinct は tag join での膨張を避けるため）
- response: `{ total, members, page, pageSize: 50 }`
- response item shape: 既存 `AdminMemberListItem` を維持し、追加 field なし
- 関数分割案:
  - `parseAdminMemberQuery(query): AdminMemberSearch` — 上記 zod parse
  - `buildAdminMemberSql(search): { listSql, countSql, params }` — SQL builder（純粋関数、test 容易）
  - handler 本体は parser + builder + repository 呼び出しのオーケストレーションに留める

### 3. `apps/api/src/routes/admin/member-delete.ts`（実装）

- 入力 zod: `{ reason: z.string().min(1).max(500) }`
- 不在 member → 404、既に `is_deleted=1` → 409、不正 body → 422
- status / deleted_members / audit_log は `DB.batch()` で同一実行単位にまとめる。
- 操作:
  - `member_status.is_deleted = 1`
  - `deleted_members` upsert
  - `audit_log` insert (`admin.member.deleted`)
- response: `{ id, isDeleted: true, deletedAt }`

### 4. `apps/api/src/routes/admin/member-delete.ts`（restore 実装）

- 入力: path id のみ
- 不在 member → 404、既に `is_deleted=0` → 409
- 操作:
  - `member_status.is_deleted = 0`
  - `deleted_members` delete
  - `audit_log` insert (`admin.member.restored`)
- response: `{ id, restoredAt }` (`restoredAt = new Date().toISOString()`)

### 5. `apps/web/app/(admin)/admin/members/page.tsx`（拡張・RSC）

- `searchParams: Promise<Record<string, string | string[] | undefined>>` を受け取り、`AdminMemberSearchZ` で parse
- `fetchAdmin('/admin/members?' + toAdminApiQuery(search))` を await、cookie forwarding のみ
- 結果を `<MembersClient initial={...} search={...} />` に渡す
- D1 binding を直接呼ばない（不変条件 #5）

### 6. `apps/web/app/(admin)/admin/members/MembersClient.tsx`（拡張・Client）

- `useRouter()` + `useSearchParams()` で URL 同期
- 検索 input（debounce 300ms、Enter 即時）→ `q` 更新
- select × 3（zone / sort / density）→ URL 更新
- filter ボタン（all / published / hidden / deleted）→ `filter` 更新
- tag 選択 chip（max 5）→ `tag[]` 更新
- ページング nav（prev / next、`page` URL 更新）
- row click → drawer open（`?selected=memberId` 付与）

### 7. `apps/web/app/(admin)/admin/members/MemberDrawer.tsx`（拡張・Client）

- 開閉 = URL `selected` query
- open 時 `fetchAdmin('/admin/members/' + id)` で `{ member, auditLogs }` 取得
- 基本情報セクション、audit log セクション（時系列降順）、delete / restore ボタン
- delete: confirm modal → reason 入力 → POST `/admin/members/:id/delete` → 結果に応じて trigger refetch + toast
- restore: confirm → POST `/admin/members/:id/restore` → 同上
- 409 / 404 / 422 を toast で分岐表示

### 8. test 追加

- `apps/api/src/routes/admin/members.test.ts` に下記 14 ケース
  - filter 各値、`sort=invalid`, `density=invalid`, `zone=invalid`, `q` 201 文字, `q=Test` LIKE hit, `q=NoMatch` 0 件, `page=99999` 200+空, `page=0` 422, `tag=a&tag=b` AND
- `apps/api/src/routes/admin/member-delete.test.ts` に: delete 成功 / restore 成功 / 既削除 409 / 未削除 restore 409 / 不存在 404 / reason 欠落 422 / reason 501 文字超 422
- `packages/shared/src/admin/search.test.ts` に zod / `toAdminApiQuery` の正常異常

## API contract（再掲・要件凍結）

- `GET /api/admin/members?filter&q&zone&tag[]&sort&density&page` → `{ total, members, page, pageSize }`
- `GET /api/admin/members/:memberId` → `{ member, auditLogs[] }`
- `POST /api/admin/members/:memberId/delete` → `{ id, isDeleted: true, deletedAt }`
- `POST /api/admin/members/:memberId/restore` → `{ id, restoredAt }`

## 統合テスト連携

- 上流: 06c admin pages / 06b-A session resolver / 07-edit-delete API / require-admin middleware / 12-search-tags
- 下流: 08b-A playwright admin members E2E / 09a admin staging smoke

## 多角的チェック観点

- #4 / #5 / #11 / #13 の不変条件への適合
- 認可境界（admin / member / guest）の網羅
- 12-search-tags のクエリ仕様と整合
- 07-edit-delete の論理削除/復元ポリシーと整合
- SQL injection 対策 = D1 prepared statement のみ使用、文字列連結禁止
- LIKE escape を必ず適用

## サブタスク管理

- [ ] route 構造を決める
- [ ] API 契約を決める
- [ ] ファイル単位の変更設計を決める
- [ ] dependency matrix を決める
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- [ ] 4 endpoint の I/O が決定している
- [ ] apps/web は `fetchAdmin` 経由のみで D1 直参照しない
- [ ] audit 書込み層が `auditAppend()` で責務分離される
- [ ] `packages/shared/src/admin/search.ts` のシンボルが確定している
- [ ] test 追加対象が列挙されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 実行手順 / 制約

- 対象 directory: docs/30-workflows/06c-B-admin-members-implementation-execution/
- 本仕様書作成では実装、deploy、commit、push、PR を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 次 Phase への引き渡し

Phase 3 へ、設計図、API 契約、ファイル単位設計、dependency matrix、test 追加対象を渡す。
