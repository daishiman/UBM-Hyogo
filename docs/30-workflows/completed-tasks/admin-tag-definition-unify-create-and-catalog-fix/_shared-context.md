# _shared-context.md — admin-tag-definition-unify-create-and-catalog-fix

> 全 Phase 仕様書・タスク lane が参照する **SSOT（Single Source of Truth）**。
> ここに書かれた事実・型・パス・決定はすべて実コード裏取り済み（2026-06-09）。
> 仕様書本文と矛盾した場合は本ファイルを正本とする。

---

## 0. タスク識別

| 項目 | 値 |
|------|-----|
| workflow_id | `admin-tag-definition-unify-create-and-catalog-fix` |
| taskId | `TASK-ADMIN-TAG-DEFINITION-UNIFY-CREATE-AND-CATALOG-FIX-001` |
| taskType | `implementation` |
| 実装区分 | **[実装区分: 実装仕様書]**（コード変更を伴う。docs-only ではない） |
| visualEvidence | `VISUAL_ON_EXECUTION`（UI 変更あり。local code/tests は完了、browser/staging screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending` |
| relatedIssue | null（staging 観察起点。Issue 未起票） |
| branch | `feat/admin-tag-definition-unify-create-and-catalog-fix` |
| PR base | `dev`（CLAUDE.md 既定） |

---

## 1. ユーザー要求（原文要約）

staging `/admin/tags/catalog` で操作中に以下 3 点を報告:

1. **新規タグ作成ができない** —「このタグ管理で新規のタグ作成とかってできないんですか？ 新規のタグ作成できるように設定してほしい。タグキューの方で設定しているのか、タグのカタログですか。仕様がよく分からない」
2. **タグカタログがエラー** —「タグのカタログではこのようなエラーが発生している」（`TypeError: Cannot read properties of undefined (reading 'reduce')` でエラーバウンダリ「管理画面を表示できませんでした」に落ちる）
3. **タグ系 UI/UX が複雑** —「タグキューがあったり、タグのカタログがあったりとか複雑化しているので、UI/UX エンジニアとして整えてほしい」

> 補足: console の `[Sentry] You cannot use Sentry.init() in a browser extension` は**ユーザーのブラウザ拡張由来のノイズ**で当アプリのバグではない（実害なし・対象外）。修正対象は `reduce` クラッシュ。

---

## 2. ユーザー意思決定（AskUserQuestion 確定済み）

| 設問 | 決定 |
|------|------|
| **Q1 IA 統合の深さ** | **タグ管理＋タグカタログを 1 画面「タグ定義管理」に統合**。作成/編集/有効化/停止/完全削除を集約。nav は `タグ定義` / `タグキュー` の 2 本に整理。旧 `/admin/tag-master`・`/admin/tags/catalog` は統合画面へ集約（カタログ route はリダイレクト維持）。新規作成導線はこの統合画面に置く。タグキュー（AI 提案レビュー）は**別ドメインのため統合しない**。 |
| **Q2 停止中タグの既定表示** | **既定は有効タグのみ＋トグルで停止中表示**。有効/停止の件数チップは常時表示。 |

---

## 3. 現状アーキテクチャ（実コード裏取り済み）

### 3.1 ルート（`apps/web/app/` 配下。`src/app/` ではない点に注意）

| route | ファイル | 役割 | nav ラベル | 状態 |
|-------|---------|------|-----------|------|
| `/admin/tag-master` | `apps/web/app/(admin)/admin/tag-master/page.tsx` | タグ定義の**作成/編集/lifecycle 統合**（TagDefinitionPanel） | タグ定義 | local implemented |
| `/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | **AI 提案キュー**レビュー（TagQueuePanel） | タグキュー | 動作（別ドメイン・統合対象外） |
| `/admin/tags/catalog` | `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | `/admin/tag-master` へ redirect | nav なし | local implemented |

### 3.2 クラッシュ真因（確定）

- `apps/web/src/components/admin/TagCatalogPanel.tsx:44` `const [items, setItems] = useState(initial.items);`
- 同 `:69-80` `useMemo(() => items.reduce(...), [items])` → `items` が `undefined` で `Cannot read properties of undefined (reading 'reduce')`。
- **対照**: `tag-master/page.tsx:28` は `initialTags={result.data.items ?? []}` と防御済み → 同じ `/admin/tags` を叩くタグ管理はクラッシュしない。
- **API は無罪**: `apps/api/src/routes/admin/tags.ts:139-158` の GET `/tags` は常に `{ total, items: result.items.map(rowBody) }` を返す。`items` は配列固定。
- **結論**: `TagCatalogPanel` / catalog page に防御フォールバックが欠落した **UI adapter 層の堅牢化欠如**。型 `TagCatalogListView.items: TagDefinitionItem[]`（非 optional）が runtime 値（undefined になり得る）と乖離。
- **実装結果**: `tagDefinitionView.normalizeTagDefinitionList()` が `items` 欠落/非配列を空配列へ正規化し、`countTagDefinitions()` が配列だけを集計する。`tag-master/page.tsx` は必ず正規化済み view を `TagDefinitionPanel` へ渡す。`/admin/tags/catalog` は `redirect("/admin/tag-master")` へ縮約。

### 3.3 新規タグ作成（transport は配線済み・UI のみ欠落）

- **API**: `apps/api/src/routes/admin/tags.ts:167-191` `POST /tags` 実装済み。`CreateTagBodyZ`（`code` 英小文字数字_ 1-64 / `label` 1-120 / `category` 1-64）→ 201 `rowBody`。重複は `tag_code_conflict` 409。audit `admin.tag.created` 記録。
- **web proxy**: `apps/web/app/api/admin/[...path]/route.ts`（catch-all）が `POST /api/admin/tags` → API `POST /admin/tags` を転送。
- **repo**: `createTagDefinition`（`apps/api/src/repository/tagDefinitions.ts`）実装済み。
- **欠落**: **作成 UI が存在しない**。`TagMasterEditForm.tsx:79` は `endpoint = tag ? PATCH : "/api/admin/tags"` と作成パスを計算するが、`:82` `mutationFn` が `if (!tag) throw` で作成不可。`:144` `if (!tag) return "左の一覧からタグを選択してください"`。→ 全画面が空でユーザーがタグを増やせない根本原因。
- **修正方針**: 既存 `POST /api/admin/tags` のみ消費する**作成 UI を統合画面に追加**（新 endpoint 不要・不変条件 #1 準拠）。

### 3.4 関連型（裏取り済み）

| 型 | 定義 | フィールド |
|----|------|-----------|
| `AdminTagRef` | `apps/web/src/features/admin/api/members.ts:6` | `{ tagId, code, label, category }`（**active 無し**） |
| `TagDefinitionItem` | `apps/web/src/components/admin/tagCatalogLifecycle.ts:5` | `{ tagId, code, label, category, active }` |
| `TagCatalogListView` | `TagCatalogPanel.tsx:20` | `{ total: number; items: TagDefinitionItem[] }` |

> 統合パネルは **`active` を含む shape（`TagDefinitionItem`）を正本**とする。API rowBody は `active` を返すため、web 側で `active` を含む型を採用すればよい（**API 変更不要**）。

### 3.5 lifecycle ヘルパー（再利用する純関数）

`apps/web/src/components/admin/tagCatalogLifecycle.ts`:
- `TAG_LIFECYCLE_DESCRIPTORS`（reactivate=POST `/api/admin/tags/:id/reactivate` / deactivate=DELETE `/api/admin/tags/:id` / physical-delete=DELETE `/api/admin/tags/:id/physical`）
- `visibleLifecycleOperations(tag)` / `applyLifecycleSuccess(...)` / `parseTagLifecycleError(error)` / `statusLabel(active)`
- 統合パネルはこれらを**そのまま再利用**（新規 lifecycle ロジックを生やさない）。

### 3.6 nav（`apps/web/src/components/shell/shell-config.ts`）

- `ShellNavItemId` union は `"tag-master" | "tag-queue"` の 2 値へ整理済み。
- `buildAdminGroup` の admin tag items:
  - `{ id: "tag-master", href: "/admin/tag-master", label: "タグ定義", icon: "tag-master" }`
  - `{ id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" }`
- `tag-catalog` は nav/icon map から除去済み。`/admin/tags` 完全一致特例はタグキュー active 誤判定防止のため維持。

### 3.7 CSS

- 正本: `apps/web/src/styles/globals.css`（`.tag-master-panel` `.tag-master-grid` `.tag-master-card` `.tag-catalog-panel` `.tag-catalog-toolbar` `.tag-catalog-list` 等）。
- tokens: `apps/web/src/styles/tokens.css`（`var(--ubm-color-*)` 系・**存在確認済み**）。
- 色は **OKLch トークン経由のみ**。HEX 直書き / `bg-[#xxx]` 禁止（CI gate `verify-design-tokens`）。

---

## 4. 不変条件（全タスク共通）

1. **既存 API のみ接続**: `apps/api/src/routes/admin/tags.ts` の現行 endpoint surface（GET `/tags` / POST `/tags` / PATCH `/tags/:id` / DELETE `/tags/:id` / POST `/tags/:id/reactivate` / DELETE `/tags/:id/physical`）のみ消費。**新 endpoint 追加・D1 schema 変更・API レスポンス shape 変更は禁止**。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を触らない（不変条件 #5 / CLAUDE.md）。
3. **OKLch トークン正本化**: 色は `tokens.css` の `var(--ubm-*)` 経由のみ。HEX 直書き禁止。
4. **プロトタイプ primitives 準拠**: `Button` / `Card` / `Chip` / `Input` / `FormField` / `EmptyState` / `ConfirmDialog` 等の既存 primitive を再利用。**新規 primitive を生やさない**（プロトタイプ未掲載画面でも既存 primitive 群で構成）。
5. **admin form input は FormField 経由**: 作成・編集フォームの input は `apps/web/src/components/ui/FormField` 経由を標準（CLAUDE.md 不変条件 #9）。`apps/web/src/components/admin/` 配下で直接 `<input>` を増やさない。
6. **admin mutation は新 hook 経由**: `@/features/admin/hooks/useAdminMutation` を標準（CLAUDE.md 不変条件 #10）。legacy `@/lib/useAdminMutation` 新規参照禁止。
7. **テスト命名**: `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止。lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）。
8. **API 乖離は UI adapter で吸収**: 既存 API shape と UI 期待が乖離する場合、API を変更せず web 側に adapter / 防御正規化を置く。
9. **タグキューは統合対象外**: `/admin/tags`（TagQueuePanel）は AI 提案レビューの別ドメイン。本タスクで挙動を変えない（nav ラベル「タグキュー」維持）。

---

## 5. 統合後の到達点（設計ターゲット）

### 5.1 ルート最終形

| route | 最終役割 |
|-------|---------|
| `/admin/tag-master` | **統合「タグ定義管理」** = 作成 + 編集 + 有効化/停止/完全削除（canonical route として再利用） |
| `/admin/tags/catalog` | `/admin/tag-master` への **redirect**（既存ブックマーク / nav 互換維持） |
| `/admin/tags` | タグキュー（**変更なし**） |

> route 命名: 既存 `/admin/tag-master` を統合 canonical として再利用する（新 route 新設より churn 最小・既存テスト資産流用可）。nav ラベルは「タグ定義」へ改称。

### 5.2 nav 最終形（admin group の tag 関連）

```
・タグ定義   → /admin/tag-master  （作成/編集/有効化/停止/完全削除を集約）
・タグキュー → /admin/tags        （AI 提案レビュー・別ドメイン）
```
（`tag-catalog` nav エントリは除去）

### 5.3 統合パネル UI（`TagDefinitionPanel`）構成

```
[タグ定義管理]
 ┌── toolbar ──────────────────────────────────────────┐
 │ [検索 code/表示名/category]  [+ 新規タグ作成]          │
 │ チップ: 有効 N件 / 停止中 M件 / 全体 T件                │
 │ トグル: [□ 停止中も表示]  ← 既定OFF（有効のみ）(Q2)     │
 └──────────────────────────────────────────────────────┘
 ┌── 左: タグ一覧 ──────┬── 右: 詳細パネル ───────────────┐
 │ 状態バッジ付き行       │ 選択タグの編集(code/表示名/ｶﾃｺﾞﾘ) │
 │ (有効/停止中)          │ ＋ ライフサイクル操作              │
 │                       │ (有効化/停止/完全削除)            │
 │                       │ ※未選択時: 「+ 新規タグ作成」導線  │
 └──────────────────────┴───────────────────────────────┘
```
- 既定一覧 = 有効タグのみ（Q2）。「停止中も表示」トグル ON で停止中を含める。
- 作成フォームはモーダル or 右パネル切替（Phase 2 で確定）。FormField 経由。
- ライフサイクルは `tagCatalogLifecycle.ts` の既存ヘルパー再利用。

---

## 6. 実装スコープ（1 サイクル / 1 PR・CONST_007 先送りなし）

3 lane に分割（並列実装可。Lane C が A/B を統合）:

| Lane | 主題 | 主な変更 | 区分 |
|------|------|---------|------|
| **A** | カタログクラッシュ修正 + 統合データ層 | web 側 list 正規化 adapter（`active` 含む shape + `items ?? []` 防御）。新パネルが消費する server fetch helper。 | 実装仕様書 |
| **B** | 新規タグ作成 UI + 配線 | 既存 `POST /api/admin/tags` 消費の `createTag()` web api fn ＋作成フォーム。重複(409)ハンドリング。 | 実装仕様書 |
| **C** | IA 統合（統合パネル + nav + redirect + 視覚整理） | `TagDefinitionPanel`（A データ層 + B 作成 + 既存 edit + lifecycle を統合）。`tag-master` page 差替。`tags/catalog` page → redirect。shell-config nav 整理。CSS 統合（tokens 準拠）。 | 実装仕様書 |

> **依存**: A（データ shape）→ C（統合）。B（作成 api fn）は A と独立に着手可。C は A+B の surface 確定後に統合。
> **先送り禁止**: 「停止中フィルタ」「作成」「lifecycle」「nav 整理」すべて本サイクルで完了。別 PR / バックログ送り無し。

---

## 7. 想定変更ファイル（Phase 2/5 で確定。網羅的初期見積もり）

### 新規作成
- `apps/web/src/components/admin/TagDefinitionPanel.tsx` — 統合パネル（client）
- `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` — 作成フォーム（FormField 経由）
- `apps/web/src/components/admin/tagDefinitionView.ts` — list 正規化 adapter（純関数 + 型）
- `apps/web/src/features/admin/api/tagCreate.ts`（or `tags.ts` 拡張）— `createTag()` web api fn
- 各 `__tests__/*.spec.tsx|.spec.ts`

### 編集
- `apps/web/app/(admin)/admin/tag-master/page.tsx` — 統合パネル描画 + 防御正規化
- `apps/web/app/(admin)/admin/tags/catalog/page.tsx` — redirect 化
- `apps/web/src/components/shell/shell-config.ts` — nav 整理（tag-catalog 除去 / tag-master ラベル「タグ定義」）
- `apps/web/src/styles/globals.css` — `.tag-definition-*` 統合スタイル（tokens 準拠）
- 既存 `TagMasterPanel.tsx` / `TagMasterEditForm.tsx` / `TagCatalogPanel.tsx` / `TagCatalogRow.tsx` の統合に伴う再編（再利用 or 吸収）

### 削除（統合に吸収される場合）
- 旧 `TagCatalogPanel.tsx` / `TagMasterPanel.tsx` は統合先へ吸収。stub 化ではなく実削除 or 統合（Phase 8 で判断）。削除時は `grep` で live import 0 を証跡化。

> 確定リストは Phase 5 + `artifacts.json.metadata.implementation_files` を正本とする。

---

## 8. テンプレート / 正本順位

- 仕様書フォーマット正本: `.claude/skills/task-specification-creator/`（Phase 1-13）
- システム正本仕様: `.claude/skills/aiworkflow-requirements/`
- テンプレ参照ワークフロー: `docs/30-workflows/public-header-logged-in-nav-cleanup`（spec_created / VISUAL_ON_EXECUTION / strict 7 の実例）
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/`
- spec: `docs/00-getting-started-manual/specs/01-api-schema.md`（タグ schema）

## 9. Phase 11/12/13 境界

- Phase 11 = `local_verification_passed_runtime_visual_pending`。local focused tests/typecheck/lint/design-token gate は green。browser/staging screenshot は user-gated。
- Phase 12 = strict 7（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）。
- Phase 13 = `pending_user_approval`（commit / push / PR は user-gated）。
- `outputs/phase-11/screenshots/` には local unauthenticated auth-boundary PNG を保存する。authenticated admin UI-state screenshot は user-gated（VISUAL_ON_EXECUTION）。
