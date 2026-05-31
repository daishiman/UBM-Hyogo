# Phase 11: 手動テスト（NON_VISUAL） — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## NON_VISUAL 宣言（WEEKGRD-03 準拠）

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（error class 追加 + 共通正規化強化 + 純関数 unit test） |
| 非視覚的理由 | UI レイアウト/描画/スタイルの変更が一切ない。変更は transport error の型と共通正規化ロジックのみ |
| スクリーンショットを作らない理由 | 視覚的差分が存在しないため。証跡は focused Vitest の PASS 件数で代替する |
| 代替証跡（primary evidence） | `outputs/phase-11/manual-test-result.md`（focused Vitest 結果 + 既知制限） |

> `screenshots/.gitkeep` は作成しない（NON_VISUAL のためディレクトリごと不要）。

## 実地操作可否（FB-BEFORE-QUIT-001）

実地のブラウザ操作は不要・不可（UI 経路に変化なし）。代替として:
1. focused Vitest（新規 `admin-fetch-error.spec.ts` + regression 5 spec）
2. `grep` による旧 throw 撤去確認
3. `typecheck` / `lint`

を `manual-test-result.md` に記録する。

## 実行手順

1. `mise exec -- pnpm install`（worktree 直後の esbuild バイナリ整合確保 / FB-MSO-002）
2. Phase 5 §5 の focused vitest コマンドを実行
3. typecheck / lint
4. 結果を `manual-test-result.md` に記録（PASS/FAIL/SKIP 件数、byte-identical 回帰確認、環境ブロッカーは別カテゴリで記録 / WEEKGRD-01）

## 完了条件（Phase 11）
- [x] NON_VISUAL 宣言を明記
- [x] 代替証跡の主ソース（focused Vitest）を固定
- [x] 実行手順を明記
- [x] `manual-test-result.md` に実測結果を記録
