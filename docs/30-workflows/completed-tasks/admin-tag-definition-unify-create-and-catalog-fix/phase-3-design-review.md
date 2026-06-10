# Phase 3 — 設計レビュー（Phase 4 進行ゲート）

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-2-design.md`](./phase-2-design.md)。

## 1. 不変条件適合マトリクス

| 不変条件 | 設計の適合 | 判定 |
|---------|-----------|------|
| #1 既存 API のみ | GET/POST/PATCH/DELETE `/admin/tags` のみ消費。新 endpoint 0 | PASS |
| #2 D1 直接禁止 | web は proxy 経由のみ。D1 binding 不参照 | PASS |
| #3 OKLch トークン | `.tag-definition-*` は `var(--ubm-*)` のみ。HEX 0 | PASS（Phase 9 gate で実測） |
| #4 primitives 準拠 | Button/Card/Chip/Input/FormField/EmptyState/ConfirmDialog 再利用。新規 primitive 0 | PASS |
| #5 FormField 経由 | 作成/編集 input は FormField | PASS |
| #6 useAdminMutation | 作成/編集/lifecycle すべて新 hook | PASS |
| #7 `.spec` のみ | 新規テストは `*.spec.ts(x)` | PASS |
| #8 adapter で吸収 | `tagDefinitionView.normalizeTagDefinitionList` で API 非変更 | PASS |
| #9 タグキュー不変 | `/admin/tags` 非接触 | PASS |

## 2. 既存資産衝突マトリクス

| 新規/変更 | 既存衝突候補 | 解決 |
|----------|-------------|------|
| `TagDefinitionPanel` | `TagCatalogPanel` / `TagMasterPanel` | 統合先へ吸収。旧 2 panel は削除（live import 0 を Phase 9 で証跡化） |
| `TagDefinitionItem`（tagDefinitionView） | `tagCatalogLifecycle.ts` の同名 interface | **同形**（tagId/code/label/category/active）。lifecycle 側 export を再利用 or view 側へ統一（Phase 5 で `import type` 経路確定。二重定義を避ける） |
| `createTag()` | `updateTag()`（同ファイル） | 並置追加。命名一貫（FB-SDK-07-4） |
| nav `tag-master` ラベル変更 | `shell-config.spec.ts` の nav assertion / ラベル期待 | same-wave 更新（Feedback 6） |
| `tag-catalog` 除去 | `ShellNavItemId` union / icon resolver / 既存 nav テスト | union・icon・テストを same-wave 更新 |
| catalog redirect | `TagCatalogPanel.component.spec.tsx` / catalog page 既存テスト | redirect 化に伴いテスト更新 or 削除（describe.skip 残存禁止・FB-TASK-01/02） |

> **重要（型二重定義回避）**: `TagDefinitionItem` は `tagCatalogLifecycle.ts` に既存。Phase 5 では view 側で**再定義せず** lifecycle の型を `import type` するか、view 側を正本にして lifecycle 側を re-export に寄せる。どちらか一方を正本にし二重定義を作らない（Phase 5 task-a で確定）。

## 3. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者がタグを作成・運用可能になり、クラッシュ解消＋導線の混乱解消。誰の(管理者)どのコスト(運用不能・混乱)を下げるか明確 |
| 実現性 | PASS | 全変更が apps/web 表現層に収まり、API/transport は既存。Lane B は薄い。1 サイクルで完了可能な厚み |
| 整合性 | PASS | 責務境界（view=正規化 / panel=state / form=入力 / lifecycle=操作）が分離。状態所有権は panel に集約。型二重定義は Phase 5 で一本化 |
| 運用性 | PASS | 既存 verify（typecheck/lint/vitest/verify-design-tokens）で担保。redirect で互換維持。タグキュー非接触で回帰面小 |

## 4. リスクと緩和

| リスク | 緩和 |
|--------|------|
| 旧 panel 削除で import 残存 → CI 赤 | Phase 9 で `grep -rn "TagCatalogPanel\|TagMasterPanel" apps/web/` が live import 0（テスト除く）を証跡化 |
| `TagDefinitionItem` 二重定義で型衝突 | Phase 5 task-a で正本を 1 つに固定（lifecycle 既存型を再利用推奨） |
| nav union 変更漏れで型エラー | `ShellNavItemId` / icon resolver / spec を same-wave（Feedback 6 型 3 点更新） |
| 防御正規化の falsy 網羅漏れ | Phase 4 で `undefined`/`null`/`{}`/`{items:null}`/`{items:"x"}` を列挙テスト（UT-W3-HTTP 型） |
| 完全削除の使用中(409) handling 退行 | 既存 `parseTagLifecycleError` 再利用で referenceCount 表示を維持 |

## 5. ゲート判定

**PASS → Phase 4 へ進行可。**

- 設計は 3 lane に分解され、各 lane の責務境界・依存（A→C、B 独立、C 統合）が確定。
- 全変更が apps/web に収まり不変条件に適合。
- 唯一の設計確定残（`TagDefinitionItem` 正本の一本化）は Phase 5 task-a の実装手順内で確定する事項として明示済み。設計ゲートはブロックしない。
