# Phase 9: 品質保証

## 実行結果

| 項目 | コマンド | 結果 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| ユニットテスト | `mise exec -- pnpm --filter @ubm-hyogo/web test` | PASS — 7 files / 36 tests |

## 新規テスト

| ファイル | テスト |
| --- | --- |
| `apps/web/src/lib/admin/__tests__/api.test.ts` | profile 本文 mutation 不在 (#11) / tag 直接 mutation 不在 (#13) / 主要 mutation 関数 export |
| `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` | profile 本文 input 不在 (#4 #11) / tag 編集リンクのみ (#13) |
| `apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` | `filterCandidates` が削除済み除外 (#15) |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 4 ペイン分類 (#14) |

## 不変条件 trace

| 不変条件 | 防御点 | 検証 |
| --- | --- | --- |
| #4 | MemberDrawer に profile 本文 input なし | MemberDrawer test |
| #5 | apps/web は INTERNAL_API_BASE_URL 経由のみで apps/api へ。D1 import なし | コードレビュー (grep) |
| #11 | profile 本文編集 mutation を export しない | api.test.ts |
| #12 | 管理メモ post API 呼び出しは MemberDrawer 内のみ | コードレビュー (grep) |
| #13 | resolveTagQueue のみ export、Drawer は Link のみ | api.test.ts + MemberDrawer.test |
| #14 | SchemaDiffPanel は schema/page.tsx のみで import | grep |
| #15 | UI 側 filter + option disabled + 422 toast | MeetingPanel.test + 実装 |
