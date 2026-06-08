# Phase 1: 要件定義（issue-1116 admin tag master code edit UI）

## 1.1 タスク identity

| key | value |
| --- | --- |
| workflow_id | `issue-1116-admin-tag-master-code-edit-ui` |
| taskId | `TASK-ISSUE-1116-ADMIN-TAG-MASTER-CODE-EDIT-UI` |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1116-admin-tag-master-code-edit-ui` |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/1116 （**CLOSED**・2026-06-06 時点 CLOSED・状態変更しない / `Refs #1116` のみ） |
| recovered_from_unassigned | `docs/30-workflows/unassigned-task/task-issue-1069-followup-001-admin-tag-code-edit-ui.md` |
| 親タスク | `issue-1069-tag-code-rename`（completed・API 本体） |
| taskType | `implementation` |
| visualEvidence | `VISUAL`（admin 新規ページ・スクリーンショット証跡あり） |
| implementation_mode | `new` |
| workflow_state | `implemented_local_evidence_captured` |
| spec_creation_strategy | `optimize_to_current_codebase` |
| 実装区分 | **[実装区分: 実装仕様書]** |

## 1.2 タスク分類（docs-only でない理由）

本タスクは **implementation / VISUAL / implementation_mode=new** に分類する。Issue #1116 の達成条件「admin tag master の `code` を UI から安全に編集できる**導線を作る**」は、新規 admin ルート・client component・web API client・sidebar nav 配線という **apps/web の実コード追加なしには達成不可能**である。したがって docs-only ではなく実装仕様書として作成する（CONST_004 デフォルト）。admin 画面を新設し画面状態（一覧・編集フォーム・conflict 表示）のスクリーンショット証跡を生むため `VISUAL`。tag master 編集 UI 経路はこれまで存在しないため `implementation_mode=new`。

## 1.3 CLOSED Issue 鮮度調査（一次根拠 = current codebase）

> 本タスクは CLOSED Issue を reopen せず canonical workflow 化する recovery（[closed-issue-canonical-workflow-recovery.md](../../../../.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md) §7）。Issue 本文ではなく現コードベースを一次根拠とするため、以下 2 表を gate として置く。

### 1.3.1 実装済み判定表（§7.1）

| 確認対象 | 現コードベース実態（HEAD=origin/dev d2c7124b0 / 2026-06-06） | 結論 |
| --- | --- | --- |
| API `PATCH /admin/tags/:tagId` の `code` / `expectedCode` 受付・409 `tag_code_conflict` / `tag_stale_conflict` 分離 | `apps/api/src/routes/admin/tags.ts:31-44,180-233` + `apps/api/src/repository/tagDefinitions.ts:65,128-155` で実装済み（issue-1069） | **実装済み** |
| API tag reactivate / physical delete | `apps/api/src/routes/admin/tags.ts:251-284`（issue-1070） | **実装済み**（本タスクスコープ外） |
| apps/web の tag master code 編集 UI（一覧→編集フォーム→PATCH） | **未実装**。`rg expectedCode apps/web` = 0 件。`fetchTagMaster` / `fetchAllTagMaster`（`apps/web/src/features/admin/api/members.ts:120-180`）は定義のみでテスト以外から未参照 | **未実装** |
| `/admin/tags` ページの中身 | tag QUEUE（タグ提案レビュー）= `apps/web/app/(admin)/admin/tags/page.tsx`。tag master CRUD ではない | **別機能（占有済み）** |
| web proxy `PATCH /api/admin/tags/:tagId` | catch-all `apps/web/app/api/admin/[...path]/route.ts` が転送（新規 proxy 不要） | **実装済み（再利用）** |
| web API client `updateTag(tagId, ...)` | 未実装（`members.ts` には read `fetchTagMaster` と create 系のみ） | **未実装** |
| `tag_code_conflict` の web ハンドリング | `MemberTagInlineCreate.tsx:139` に **create 文脈のみ**存在。code rename / stale conflict 表示は無い | **未実装（別文脈）** |

**結論**: Issue #1116 の目的（tag master code 編集 UI 導線）は**他タスクでも未解決**であり、本タスクの実装が必要。API は完備のため UI 層のみ追加する。

### 1.3.2 最新コードへの最適化表（§7.2）

| 観点 | 原典 Issue #1116 の想定 | 現コードベース実態 | 採る方針 |
| --- | --- | --- | --- |
| ルート配置 | 「admin tag master 専用 CRUD ページがまだ無い」→ `/admin/tags` を master 用に空きと想定 | `/admin/tags` は tag QUEUE で占有（nav id `tag-queue` / `shell-config.ts:82`）。`isNavItemActive`（`shell-config.ts:125-129`）は `pathname.startsWith(href + "/")` で active 判定するため、`/admin/tags/master` 等の**子ルートにすると tag-queue nav が同時 active になる nav 衝突バグ**が発生 | **sibling ルート `/admin/tag-master`** を新設（子ルート禁止）。nav id `tag-master`・label「タグ管理」を追加。`isNavItemActive("/admin/tags","/admin/tag-master")` は false で衝突しないことを test で固定 |
| CRUD 範囲 | 「CRUD ページ」 | create は `MemberTagInlineCreate` に既存・delete/reactivate は issue-1070 API のみ存在 | 本タスクは **list + code/label/category edit + conflict 表示**に限定（Issue AC-1..AC-5 と一致）。create/delete/reactivate UI は別スコープ（先送りでなく既存/別タスク） |
| API 接続 | API rename を本タスクで実装する前提を一部含む | API は issue-1069 で完了済み | UI のみ追加。`apps/api` は一切変更しない（不変条件 #1 / #7） |
| tag master read | 新規 read client 想定 | `fetchTagMaster`（`members.ts`）が既存・未使用 | 既存 read client を再利用し、新規は **`updateTag` (PATCH) client** のみ追加 |
| stale 検出 | 「current code を `expectedCode` として送る」 | API は `code` 指定時 `expectedCode` 必須（`tags.ts:41-44`）。CAS で `tag_stale_conflict` 返却 | 編集フォームが**行ロード時の `code` を `expectedCode` として保持**し code 変更時に同梱。最新値競合は別文言で手動更新を促す |

`spec_creation_strategy = "optimize_to_current_codebase"` を `artifacts.json` に記録済み。

## 1.4 既存コードの命名規則分析（新規識別子の整合）

| 種別 | 既存例（実在） | 規則 | 新規追加 | 整合 |
| --- | --- | --- | --- | --- |
| admin route ディレクトリ | `app/(admin)/admin/tags/`・`app/(admin)/admin/meetings/`・`app/(admin)/admin/schema/` | `app/(admin)/admin/<slug>/page.tsx` | `app/(admin)/admin/tag-master/page.tsx` | ✅ kebab slug |
| feature component dir | `features/admin/components/_members/`・`_dashboard/`・`_layout/` | `_<domain>` snake | `features/admin/components/_tags/` | ✅ `_<domain>` |
| client component | `TagQueuePanel`・`MembersTable`・`MemberDrawer`・`BulkActionBar` | PascalCase + 役割名 | `TagMasterPanel` / `TagMasterEditForm` | ✅ PascalCase |
| web API client 関数 | `fetchMemberTags` / `assignMemberTag` / `fetchTagMaster`（`members.ts`） | camelCase 動詞始まり | `updateTag` | ✅ camelCase |
| web error code 型 | `AdminTagCreateErrorCode`（`members.ts`） | PascalCase + `...ErrorCode` | `AdminTagUpdateErrorCode` | ✅ |
| nav item id | `tag-queue` / `schema` / `members`（`shell-config.ts:9-23`） | kebab | `tag-master` | ✅ kebab |
| nav icon key | `"tag-queue": "M..."`（`icons.tsx:36`） | nav id と同一キー | `"tag-master": "M..."` | ✅ |

新規識別子はすべて既存規則に整合する。

## 1.5 スコープ（CONST_007: 本サイクル 1 回で完了）

### 含む

- 新規 admin ルート `/admin/tag-master`（server component・既存 `safeServerFetch('/admin/tags?...')` で master 一覧読み取り）。
- 新規 client component `TagMasterPanel`（一覧 + 行選択）/ `TagMasterEditForm`（code/label/category 編集・`expectedCode` 保持・conflict 表示）。
- 新規 web API client `updateTag(tagId, {code?, label?, category?, expectedCode?})` と error code 分離（`tag_code_conflict` / `tag_stale_conflict`）。
- sidebar nav 配線（`shell-config.ts` の `ShellNavItemId` 拡張・nav item 追加 / `icons.tsx` の icon 追加）。
- mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）、入力は `FormField` 経由（不変条件 #9）、色は OKLch token（不変条件 #2）。
- focused component / API client test + authenticated visual evidence spec。

### 含まない（先送りではなく別スコープ）

- API rename 実装（issue-1069 完了）・`apps/api` 変更・D1 schema 変更・Google Form 変更（不変条件 #1）。
- tag 物理削除 / reactivate の UI（issue-1070 で API のみ存在・別タスク）。
- member drawer inline-create UI（`task-issue-1035-followup-001`）。
- commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更（全て user-gated）。

## 1.6 受け入れ基準（AC-1..AC-5 / Issue #1116 と 1:1）

| ID | 受け入れ基準 | 実装での充足ファイル | 現行コード最適化メモ |
| --- | --- | --- | --- |
| AC-1 | admin tag master 一覧から対象 tag を選び、`code` / `label` / `category` の編集 UI に到達できる | `app/(admin)/admin/tag-master/page.tsx` + `TagMasterPanel` + `TagMasterEditForm` | sibling route `/admin/tag-master`（nav 衝突回避） |
| AC-2 | code rename 時は現在の code を `expectedCode` として送信し、stale conflict を検出できる | `TagMasterEditForm`（行 code 保持）+ `updateTag` | API は `code` 指定時 `expectedCode` 必須・CAS |
| AC-3 | 409 `tag_code_conflict` と 409 `tag_stale_conflict` を別メッセージで表示する | `tags.ts`（error parse）+ `TagMasterEditForm`（分離 copy） | code conflict=UNIQUE / stale=最新値競合 で文言を分ける |
| AC-4 | label/category の既存更新と code rename の両方が後方互換に動く | `updateTag`（変更フィールドのみ送信・`code` 単独時のみ `expectedCode` 付与） | `no_update_fields` 防御を UI 側でも担保 |
| AC-5 | focused component/API client tests と visual evidence を取得する | `__tests__/tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / `page.spec.tsx` / `shell-config.spec.ts` / `admin-tag-master-code-edit-ui.spec.ts` | local fixture visual は取得済み。authenticated staging capture は user-gated |

## 1.7 inventory（変更対象ファイル一覧 = DESIGN-BRIEF §4）

| 種別 | パス | 変更 | 内容 |
| --- | --- | --- | --- |
| admin route | `apps/web/app/(admin)/admin/tag-master/page.tsx` | new | server component。`safeServerFetch<TagMasterListView>('/admin/tags?page=1&pageSize=50' + q)` で一覧取得し `TagMasterPanel` を描画。`AdminPageHeader`・`AdminSectionErrorClient` 再利用 |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | new | 一覧テーブル + 行選択 → 編集フォーム表示。mutation 成功後 row を optimistic 置換 or 再 fetch |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | new | `FormField` で code/label/category 入力。行 `code` を `expectedCode` として保持。`useAdminMutation` で PATCH。409 を分離表示 |
| web API client | `apps/web/src/features/admin/api/tags.ts` | new | `updateTag(tagId, input)` + `AdminTagUpdateErrorCode` + `parseTagUpdateErrorCode` |
| nav config | `apps/web/src/components/shell/shell-config.ts` | edit | `ShellNavItemId` に `"tag-master"` 追加・admin group に `{ id:"tag-master", href:"/admin/tag-master", label:"タグ管理", icon:"tag-master" }` 追加 |
| nav icon | `apps/web/src/components/shell/icons.tsx` | edit | `"tag-master"` の SVG path 追加 |
| test | `apps/web/src/features/admin/api/__tests__/tags.update.spec.ts` | new | updateTag 200 / 409 code_conflict / 409 stale_conflict / 404 / no_update_fields |
| test | `apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx` | new | 一覧描画・行選択・編集到達・成功後 row 反映 |
| test | `apps/web/app/(admin)/admin/tag-master/page.spec.tsx` | new | GET `/admin/tags` の `{ total, items }` response shape 固定 |
| regression test | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` / `shell-config.spec.ts` | edit | tag-master nav 追加・active 衝突なし |
| visual | `apps/web/playwright/tests/admin-tag-master-code-edit-ui.spec.ts` | new | 一覧・編集フォーム・conflict 表示の local fixture visual |
| visual (auth) | `apps/web/playwright/tests/visual-staging-authenticated/admin-tag-master-authenticated.spec.ts` | new | 認証済 staging visual（user-gated capture） |

## 1.8 P50 前提確認チェック

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| current branch に実装が存在するか | **No（未実装）** | §1.3.1 の通り `expectedCode` 0 件・`fetchTagMaster` 未使用・`/admin/tag-master` ルート不在 |
| upstream マージ要否 | **N/A（同期済み）** | HEAD=`origin/dev`（d2c7124b0）。本プロンプトは仕様書のみ作成、git mutation は user-gated |
| 依存タスク | **issue-1069 / issue-1070 completed** | API surface（PATCH code/expectedCode・409 分離）は完了済み。本タスクはその surface を UI から消費する |

## 1.9 完了条件（DoD は Phase 11 で詳述）

- Phase 1-13 実装仕様書一式が物理生成され、`verify:phase12-compliance` / `gate-metadata:validate` が緑。
- 本仕様だけで `apps/web` のコード変更（route / components / API client / shell / styles + tests）を 1 サイクルで完遂できる粒度。
