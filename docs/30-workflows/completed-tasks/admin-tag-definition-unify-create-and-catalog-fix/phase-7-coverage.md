# Phase 7 — カバレッジ

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-6-test-additions.md`](./phase-6-test-additions.md)。
> 方針: **変更行保護**（変更ファイル/ブロックのみ対象。Feedback BEFORE-QUIT-002）。全リポジトリ網羅は求めない。

## 1. 対象範囲（変更行保護スコープ）

| 対象 | 範囲 | 備考 |
|------|------|------|
| `tagDefinitionView.ts`（新規） | **line / branch 100% 目標**（Feedback 5） | `reduce`/`filter` を閉じ込めた純関数群。クラッシュ class の核 |
| `TagDefinitionCreateForm.tsx`（新規） | 変更行（= 全行） | 失敗パス（409/検証）含む |
| `TagDefinitionPanel.tsx`（新規） | 変更行（= 全行） | トグル境界 / 作成反映 / lifecycle 回帰 |
| `features/admin/api/tags.ts`（`createTag` 追加分） | **追加した `createTag` ブロックのみ** | 既存 `updateTag` 等の未変更行は対象外 |
| `tag-master/page.tsx`（編集） | 変更ブロック（panel 差替 + 防御正規化） | 未変更 import 等は対象外 |
| `tags/catalog/page.tsx`（redirect 化） | 変更ブロック（redirect 全体） | |
| `shell-config.ts`（nav 整理） | 変更ブロック（`buildAdminGroup` の tag items / union / icon） | 他 nav group は対象外 |
| `globals.css`（`.tag-definition-*`） | カバレッジ計測対象外（CSS）。`verify-design-tokens` で別途 gate | |

> **対象外（明示）**: `tagCatalogLifecycle.ts`（再利用・無変更）、`apps/api/**`（不変条件 #1・diff 空）、`useAdminMutation`（既存・無変更）、その他 admin 画面。これらは本タスクで変更しないためカバレッジ後退の評価対象外（Feedback BEFORE-QUIT-002）。

## 2. `tagDefinitionView` の 100% 観点（Feedback 5）

`reduce` / `filter` の branch を取りこぼさない:

| 関数 | branch | カバーするケース（Phase 6） |
|------|--------|--------------------------|
| `normalizeTagDefinitionList` | raw が null/undefined | C-3-1, C-3-2 |
| | items が欠落/null/非配列 | C-3-3, C-3-4, C-3-5 |
| | total が数値 / 非数値（length フォールバック） | C-3-6 |
| | item フィールドの coerce 分岐（active boolean / string） | C-3-7, C-3-8 |
| `filterTagDefinitions` | showInactive true / false | C-3-9, C-3-10 |
| | query 空 / 部分一致 / 非一致 | C-3-11, C-3-12 |
| `countTagDefinitions` | **空配列 reduce（0 件で落ちない）** | C-3-13（クラッシュ回帰 guard） |
| | active/inactive 混在 / 全 inactive | C-3-14, C-3-15 |

> 純関数に防御ロジックを隔離した設計（Phase 2 §3）ゆえ、line/branch 100% が現実的に到達可能。panel 側には `reduce` を残さないため、UI テスト（jsdom）での網羅依存を減らせる。

## 3. concern × dependency edge カバレッジマトリクス

| concern | 主依存 edge | unit/component | 失敗パス | カバー source |
|---------|-------------|----------------|----------|--------------|
| 作成（create） | `createTag` → `POST /api/admin/tags` proxy | Yes | 409 / 401 / 400 / 非JSON | T-1, T-2 |
| 編集（edit） | `updateTag` → `PATCH /admin/tags/:id`（既存・再利用） | Yes | 既存カバー流用 | T-4(C-4-6) |
| lifecycle（停止/有効化/完全削除） | `tagCatalogLifecycle` descriptor → reactivate/deactivate/physical | Yes | **409 referenceCount 使用中** | T-4(C-4-7, C-4-8) |
| フィルタ（停止中トグル/検索） | `filterTagDefinitions` / `countTagDefinitions` 純関数 | Yes | 空配列境界 | T-3, T-4(C-4-2..4-4) |
| 正規化（防御） | `normalizeTagDefinitionList`（server + client 両経路） | Yes | undefined/null/非配列 | T-3, T-5(C-5-2) |
| nav | `buildAdminGroup` / `ShellNavItemId` / icon resolver | Yes | union 漏れ → typecheck | T-7 |
| redirect | catalog page → `redirect("/admin/tag-master")` | Yes | 旧 panel 非 import | T-6 |

## 4. AC ↔ テスト追跡（漏れなし確認）

| AC | カバー |
|----|--------|
| AC-1 クラッシュなし + EmptyState | C-4-1 |
| AC-2 防御正規化（items/total 欠落） | C-3-1..3-6, C-5-2 |
| AC-3 作成導線 + 3 入力 | C-2-5, C-4-5 |
| AC-4 既存 POST のみ / 即時反映 + 選択 | C-1-1, C-4-5 |
| AC-5 409 重複フォーム内表示 / 一覧不変 | C-2-1 |
| AC-6 クライアント検証（code/label/category） | C-2-2, C-2-3 |
| AC-7 nav 2 本化 | C-7-1, C-7-2 |
| AC-8 catalog redirect | C-6-1 |
| AC-9 作成/編集/有効化/停止/完全削除 | C-2-4, C-4-5, C-4-6, C-4-7, C-4-8 |
| AC-10 既定有効のみ + トグル + 件数チップ | C-4-2, C-4-3, C-4-4 |
| AC-11 タグキュー不変 | C-7-3 |
| AC-12 HEX 0 | Phase 9 `verify-design-tokens`（テスト外 gate） |
| AC-13 apps/api diff 空 | Phase 9 `git diff --stat`（テスト外 gate） |
| AC-14 spec のみ / typecheck / lint | Phase 9 gate |

## 5. 現サイクルのカバレッジ境界（local verified / runtime visual pending）

focused vitest は本サイクルで実行済み（7 files / 33 tests PASS）。上記マトリクスの AC は local unit/component/server-page specs で検証済み。変更行保護スコープ外（既存資産・apps/api）はカバレッジ評価対象に含めない。ブラウザ runtime visual evidence は user-gated のため Phase 11 境界に残す。
