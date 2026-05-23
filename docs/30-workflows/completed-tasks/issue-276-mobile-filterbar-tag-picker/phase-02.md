# Phase 2: 依存関係 / 影響範囲調査

[実装区分: 実装仕様書]

## メタ情報

| Phase | 2 |
| 前提 | Phase 1 完了 |
| 後続 | Phase 3 |

## 目的

`PublicMemberListView` の response 拡張による影響範囲を全件特定し、Phase 4-6 で更新が必要なファイル一覧を確定する。

## 実行タスク

1. zod schema consumer 全件 grep
   ```bash
   grep -rn "PublicMemberListViewZ\|PublicMemberListView" apps/ packages/ --include="*.ts" --include="*.tsx"
   ```
2. fixture / mock 全件 grep
   ```bash
   grep -rln "items:.*\[.*memberId" apps/ packages/ --include="*.ts" --include="*.tsx"
   grep -rln "appliedQuery" apps/ packages/
   ```
3. test fixture json 全件
   ```bash
   find apps packages -name "*.json" -path "*fixture*" | xargs grep -l "publicMembers\|topTags" 2>/dev/null
   ```
4. `apps/api/src/use-cases/public/list-public-members.ts` の current data flow を確認
5. `apps/api/src/repository/publicMembers.ts` の `member_tags` + `tag_definitions` 結合経路を読み取り、`topTags` 集計クエリ案を作成

## 影響範囲アウトプット

`outputs/phase-02/impact-matrix.md` を以下の形で出力:

| カテゴリ | ファイル | 変更種別 | Phase |
|---------|---------|---------|------|
| schema | `packages/shared/src/zod/viewmodel.ts` | 編集 | 5 |
| schema | `packages/shared/src/types/viewmodel/index.ts` | 編集 | 5 |
| api use case | `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | 5 |
| api repository | `apps/api/src/repository/publicMembers.ts` | 編集 | 5 |
| web component | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 | 6 |
| web component | `apps/web/src/components/public/TagPicker.client.tsx` | 新規 | 6 |
| web page | `apps/web/app/(public)/members/page.tsx` | 編集（topTags を props で渡す） | 6 |
| test | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | 4 |
| test | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 新規 | 4 |
| e2e | `apps/web/playwright/tests/members-filter-mobile.spec.ts` | 新規 | 4 |
| fixture | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` / `apps/web/src/test-utils/fixtures/public.ts` / shared zod fixtures | 編集 | 4 |
| contract | `apps/api/src/routes/public/index.contract.spec.ts` | 編集 | 4 |

## 依存順序（NO-GO 条件）

- Phase 5（API 実装）は Phase 4（テスト作成）が完了するまで着手不可
- Phase 6（Web 実装）は Phase 5 が完了するまで着手不可
- contract spec / shared zod schema の更新が無いまま Phase 6 を進めない（`pnpm typecheck` が早期失敗するため）

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/impact-matrix.md`
- `outputs/phase-02/d1-aggregation-query-draft.sql`

## 完了条件

- [ ] impact-matrix が全件埋まっている
- [ ] D1 集計クエリ草案が記述された
- [ ] 上流ブロッカー（Phase 4 未完での実装着手不可）が記録された

## タスク100%実行確認【必須】

- [ ] grep コマンド結果が貼られた
- [ ] api use case / repository の実ファイルパスが特定された

## 次Phase

Phase 3 へ。
