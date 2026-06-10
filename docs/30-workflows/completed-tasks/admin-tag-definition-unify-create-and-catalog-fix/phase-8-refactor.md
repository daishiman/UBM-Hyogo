# Phase 8 — リファクタリング / Elegance Check

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-2-design.md`](./phase-2-design.md) / [`phase-3-design-review.md`](./phase-3-design-review.md)。
> 統合に伴う旧コンポーネントの**吸収・削除・再利用判断**を記録する（Feedback RT-03）。

## 1. 統合判断テーブル（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | catalog page が描画する lifecycle client panel（`:44` `useState(initial.items)` で `reduce` クラッシュ） | **削除**（git delete）。lifecycle 表示は `TagDefinitionPanel` に吸収 | クラッシュ源を残さず、統合パネルへ責務を一本化。live import 0 を Phase 9 grep で証跡化（FB-UI-02-1） |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | tag-master page が描画する edit panel | **削除**（git delete）。編集 + 一覧責務は `TagDefinitionPanel` へ吸収 | 編集とライフサイクルの画面分裂を解消（課題3）。統合パネルが一覧 state を所有 |
| `apps/web/src/components/admin/TagCatalogRow.tsx` | lifecycle 一覧行 | **再利用 or 吸収**（Phase 5 task-c で確定）。状態バッジ付き行表現を統合一覧へ流用、独立価値が薄ければ吸収 | 行表現の重複実装を避ける。再利用なら import 維持、吸収なら delete |
| `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | 編集専用フォーム（`:82` `if(!tag) throw` で作成不可、`:144` 作成不可メッセージ） | **再利用**（編集用として `TagDefinitionPanel` の右パネルに配置）。作成責務は新 `TagDefinitionCreateForm` に分離 | 編集の楽観 expectedCode ロジックは健全。作成と責務混在させない（SRP）。`if(!tag)` 作成不可分岐は新フォーム導入で死コード化 → 該当分岐を整理 |
| `apps/web/src/components/admin/tagCatalogLifecycle.ts` | descriptor / `applyLifecycleSuccess` / `parseTagLifecycleError` / `statusLabel` / `visibleLifecycleOperations` の純関数群 | **そのまま再利用**（無変更） | lifecycle ロジックは正しく動作。再実装せず重複ゼロを担保 |
| `TagDefinitionItem` 型（`tagCatalogLifecycle.ts:5`） | lifecycle 側に既存 interface（tagId/code/label/category/active） | **正本として一本化**。新 `tagDefinitionView.ts` は再定義せず `import type` で参照 | 型二重定義回避（Phase 3 §2 重要事項）。lifecycle 既存型を正本に固定 |

## 2. 型二重定義の解消（lifecycle 型を正本化）

- `TagDefinitionItem` は `apps/web/src/components/admin/tagCatalogLifecycle.ts:5` に既存（実コード裏取り済み・同形 5 フィールド）。
- `tagDefinitionView.ts`（新規）で**同名 interface を再定義しない**。`import type { TagDefinitionItem } from "./tagCatalogLifecycle"` で参照し、`TagDefinitionListView` / `RawTagListResponse` のみ view 側で新規定義する。
- PASS 基準: `grep -rn "interface TagDefinitionItem" apps/web/` の hit が **1 件のみ**（lifecycle）。view / panel / form は import 参照に統一。
- これにより lifecycle ヘルパー（`applyLifecycleSuccess` 等）の入出力型と panel の items 型が同一参照になり、cast 不要・drift 不能。

## 3. 削除 PASS 基準（FB-UI-02-1）

旧 panel を削除する場合の合格条件:

| 旧 component | 合格基準 |
|-------------|---------|
| `TagCatalogPanel` | `git rm`（ファイル実削除）。`grep -rn "TagCatalogPanel" apps/web/` の live import 0（テスト / コメント / describe.skip 除外後 0）。`TagCatalogPanel.component.spec.tsx` も削除 or 内容差替（skip 温存禁止・FB-TASK-01/02） |
| `TagMasterPanel` | `git rm`。`grep -rn "TagMasterPanel" apps/web/` の live import 0。`TagMasterPanel.spec.tsx` / `tag-master/page.spec.tsx:33` の `TagMasterPanel` 参照を `TagDefinitionPanel` へ更新 |

> 方針: **git delete を第一選択**。`export {}` stub 化は live import 0 を満たす場合に限る退避策で、本タスクでは参照元（catalog page / tag-master page）を same-wave で差替えるため実削除が可能。stub を残さない（死コード排除）。

## 4. 重複ロジック排除

| 重複候補 | 排除方針 |
|---------|---------|
| lifecycle 操作（reactivate/deactivate/physical） | `tagCatalogLifecycle.ts` 純関数を**唯一の実装**として再利用。統合パネルに lifecycle ロジックをコピーしない（重複ゼロ） |
| 件数集計 `reduce` | `countTagDefinitions`（view）に**一箇所**へ集約。panel / 旧 catalog の散在 reduce を排除（クラッシュ class 根絶と同義） |
| list 正規化 | `normalizeTagDefinitionList`（view）に集約。server page / client panel の両経路が同一純関数を通す |
| 状態ラベル | `statusLabel(active)`（lifecycle 既存）を再利用。新規ラベル関数を生やさない |

## 5. Over-Engineering として棄却した選択肢

| 棄却案 | 理由 |
|--------|------|
| 新 route `/admin/tag-definitions` 新設 | `/admin/tag-master` を canonical 再利用すれば churn・テスト移行コスト最小（Phase 2 §8）。新 route は不要な複雑性 |
| 作成と編集を 1 フォームに統合 | 作成（code 一意性・新規）と編集（楽観 expectedCode）は責務が異なる。`TagDefinitionCreateForm` に分離（SRP） |
| lifecycle を React context / provider 化 | panel ローカル state（items/selectedId/mode）で十分。provider はオーバースペック |
| 新 API endpoint（一括取得 / 件数専用） | 不変条件 #1 違反。既存 GET `/tags` + web 集計で充足 |
| catalog route 削除（redirect でなく 404） | 既存ブックマーク / nav 履歴互換のため redirect（薄く安全） |
| D1 直接アクセスでの件数取得 | 不変条件 #2 違反。proxy 経由のみ |

## 6. リファクタ後の責務境界（最終形）

```
tagDefinitionView.ts   = 正規化 + フィルタ + 件数（純関数・reduce 隔離）
tagCatalogLifecycle.ts = lifecycle 操作（再利用・無変更・型正本）
TagDefinitionCreateForm = 作成入力（FormField・409 表示）
TagMasterEditForm       = 編集入力（再利用）
TagDefinitionPanel      = state owner（items/selectedId/mode/showInactive/search）+ 統合 UI
tag-master/page.tsx     = server fetch + 防御正規化 + panel 描画
catalog/page.tsx        = redirect のみ
shell-config.ts         = nav 2 本化
```

> 各モジュールは単一責務。lifecycle / 編集 / primitives は既存資産流用で新規実装面積を最小化（Phase 2 §2）。
