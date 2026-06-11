# Phase 1 — 要件定義

> 正本: [`_shared-context.md`](./_shared-context.md)。本書はそれを要件視点で固定する。

## 1. 真の論点（1 文）

「タグ定義の**作成導線が存在せず**、**ライフサイクル画面がクラッシュし**、**編集とライフサイクルが別画面に分裂**しているため、管理者がタグを運用できない」を、**API を一切変更せず web 表現層の統合**で解決する。

## 2. 課題の切り分け（3 課題は別問題）

| # | 現象 | 真因（裏取り済み） | 層 |
|---|------|-------------------|----|
| 課題1 | カタログがエラーバウンダリに落ちる | `TagCatalogPanel.tsx:44,71` の `initial.items` 防御欠如（タグ管理は `?? []` 防御済み）。API は常に `{total,items}` 返却で無罪 | web 表現層 |
| 課題2 | 新規タグを作れない | 作成 UI 不在。API `POST /admin/tags`・web proxy・repo は配線済み。`TagMasterEditForm` は編集専用 | web 表現層（UI 欠落） |
| 課題3 | タグ系画面が複雑 | `タグ管理`(編集) と `タグカタログ`(lifecycle) が同一タグ定義テーブルを別画面操作。どこで作るか不明 | IA / web 表現層 |

> 3 課題はすべて **apps/web 表現層**で閉じる。`apps/api` / D1 / Google Form は無罪。

## 3. 受入条件（AC）

### 課題1（クラッシュ修正）
- **AC-1**: `/admin/tags/catalog` 相当（統合後 `/admin/tag-master`）に遷移してもエラーバウンダリに落ちない。タグ 0 件時は EmptyState「該当するタグはありません」を表示。
- **AC-2**: list レスポンスの `items` が `undefined` / `null` / 欠落でも UI は空配列として安全に描画する（防御正規化）。`total` 欠落時は 0 として扱う。

### 課題2（新規作成）
- **AC-3**: 統合画面に「新規タグ作成」導線があり、`code` / `label`(表示名) / `category` を入力して作成できる。
- **AC-4**: 作成は既存 `POST /api/admin/tags` のみ消費する（新 endpoint 追加なし）。成功時は一覧へ即時反映し、作成したタグを選択状態にする。
- **AC-5**: `code` 重複（`tag_code_conflict` 409）時は「同じコードのタグが既にあります」をフォーム内に表示し、一覧は壊さない。
- **AC-6**: `code` は `^[a-z0-9][a-z0-9_]{0,63}$` を満たさないとクライアント側で送信前に弾く（API `CODE_RE` と一致）。`label` / `category` は必須。

### 課題3（統合整理）
- **AC-7**: nav の admin グループは tag 関連が `タグ定義`(`/admin/tag-master`) / `タグキュー`(`/admin/tags`) の 2 本に整理され、`タグカタログ` エントリは消える。
- **AC-8**: `/admin/tags/catalog` は `/admin/tag-master` へリダイレクトする（既存ブックマーク互換）。
- **AC-9**: 統合「タグ定義管理」画面で、作成・編集・有効化・停止（論理削除）・完全削除がすべて行える。
- **AC-10**: 一覧の既定表示は**有効タグのみ**。「停止中も表示」トグルで停止中（論理削除済み）を含める。有効/停止/全体の件数チップを表示。
- **AC-11**: タグキュー（`/admin/tags` TagQueuePanel）の挙動・ラベルは変更しない。

### 横断
- **AC-12**: 色は `tokens.css` の `var(--ubm-*)` 経由のみ。HEX 直書き 0（`verify-design-tokens` PASS）。
- **AC-13**: `apps/api` / D1 migrations の diff が空（`git -C apps/api diff --stat` が空）。
- **AC-14**: 新規テストは `*.spec.{ts,tsx}` のみ。`pnpm typecheck` / `pnpm lint` が green。

## 4. スコープ外（本タスクで触らない）

- タグキュー（AI 提案レビュー）のロジック・UI。
- タグ ⇔ メンバー付与（`/admin/members` の tag picker）。
- API endpoint surface・D1 schema・Google Form schema。
- Sentry のブラウザ拡張ノイズ（当アプリ無関係）。

## 5. 既存命名規約（FB-01 / FB-SDK-07-4 準拠で記録）

| 観点 | 現行規約 | 新規で踏襲する形 |
|------|---------|-----------------|
| component | PascalCase（`TagCatalogPanel` `TagMasterEditForm`） | `TagDefinitionPanel` / `TagDefinitionCreateForm` |
| 純関数 module | camelCase ファイル（`tagCatalogLifecycle.ts`） | `tagDefinitionView.ts` |
| web api fn | `updateTag(tagId, input)`（`features/admin/api/tags.ts`） | `createTag(input)` 同ファイルに追加 |
| mutation | `useAdminMutation`（`@/features/admin/hooks/...`） | 同 hook 再利用 |
| 型 | `AdminTagRef`(active 無) / `TagDefinitionItem`(active 有) | 統合は `TagDefinitionItem` 系を正本 |
| test | `*.spec.ts(x)` / `__tests__/` 配下 | 同様 |
| lifecycle | `TAG_LIFECYCLE_DESCRIPTORS` / `applyLifecycleSuccess` 等 | **既存を再利用**（再実装しない） |

## 6. inventory（実コード裏取り済みファイル）

| ファイル | 役割 | 本タスクでの扱い |
|---------|------|----------------|
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | タグ管理 server page | 統合パネル描画へ編集 |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | カタログ server page | redirect 化 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | タグキュー server page | **変更なし** |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | lifecycle client panel | 統合先へ吸収 |
| `apps/web/src/components/admin/TagCatalogRow.tsx` | lifecycle row | 再利用 or 吸収 |
| `apps/web/src/components/admin/tagCatalogLifecycle.ts` | lifecycle 純関数 | **再利用** |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | edit panel | 統合先へ吸収 |
| `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | edit form | 再利用 or 吸収 |
| `apps/web/src/features/admin/api/tags.ts` | web api（updateTag 等） | `createTag` 追加 |
| `apps/web/src/components/shell/shell-config.ts` | nav 構成純関数 | nav 整理 |
| `apps/web/src/styles/globals.css` | tag CSS | 統合スタイル |
| `apps/api/src/routes/admin/tags.ts` | API surface | **読むだけ・変更禁止** |

## 7. P50 前提チェック

| 確認項目 | 結果 |
|---------|------|
| current branch に実装が存在する | Yes（web 表現層の統合実装・focused Vitest・typecheck・lint・design token gate は local PASS。ブラウザ runtime visual / commit / PR / push は user-gated） |
| upstream にマージ済み | No |
| 前提タスク完了済み | 課題2 の transport（API POST + proxy + repo）は **既に完成**。本サイクルで UI も実装済み（`implementation_mode: "new"` だった Lane B を local 完了へ昇格） |

## 8. リスク / 注意

- 統合で旧パネル（`TagCatalogPanel` / `TagMasterPanel`）を削除する場合、live import 0 を `grep` 証跡化（Phase 9・FB-UI-02-1）。
- `shell-config.ts` の `ShellNavItemId` union / icon resolver から `tag-catalog` を除去する際、参照箇所（テスト含む）を same-wave で更新（Feedback 6 型 navigation 3 点更新漏れ防止）。
- `tag-master` の既存テスト（`page.spec.tsx` / `TagMasterPanel.spec.tsx` 等）は統合に伴い更新が必要。describe.skip 残存に注意（FB-TASK-01/02）。
