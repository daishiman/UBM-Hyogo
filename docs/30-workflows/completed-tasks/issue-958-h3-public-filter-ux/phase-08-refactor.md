# Phase 8 — リファクタリング

## 1. 想定 refactor 項目（実装後判断）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `useBulkRepublish` の error 解析 | inline `parseError` | 既存 `parseAdminError` helper（あれば）流用 | 重複排除 |
| `BulkRepublishDrawer` の checkbox row | inline JSX | 既存 admin `MemberRow` 型コンポーネント転用検討 | navigation drift 抑止 |
| `hasSearchFilters` 判定 | page.tsx inline | `src/lib/public/has-search-filters.ts` に純関数抽出 | テスト容易性 |
| `Callout` tone 文言定数 | コンポーネント内 hard-code | `src/lib/profile/public-consent-strings.ts` に集約 | i18n 余地 / spec test 容易 |

## 2. しない事

- 新 primitive 追加（HIG / a11y 担保が崩れる）
- `RequestActionPanel` 統合（責務混在）
- bulk endpoint 化（INV-1 違反）

## 3. 判定タイミング

Phase 5 GREEN 直後に上記 4 件を1件ずつ評価し、価値あるもののみ実施。

## 4. 完了条件

- [x] refactor 候補と判定基準明示
- [x] 禁止項目明示
