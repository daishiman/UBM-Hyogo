# Phase 11: 証跡取得（NON_VISUAL 宣言）

## タスク種別判定

| 判定軸           | 値                                                                 |
| ---------------- | ------------------------------------------------------------------ |
| visualEvidence   | **NON_VISUAL**                                                      |
| 影響レイヤ       | API 層のみ（`apps/api` + `packages/shared` の型 / zod 契約 / use-case 配線） |
| UI への影響      | なし（`apps/web` のレンダリング差分ゼロ・スコープ外）              |
| 主証跡           | 自動テスト（contract spec + use-case unit test）                  |

> 本タスクは `outputs/phase-1/requirements.md`「実装区分」（実装仕様書 / NON_VISUAL）および `phase-2.md` のデータフロー（API 層のみ）の通り **NON_VISUAL** に分類される。
> `index.md` を導入する場合は `| visualEvidence | NON_VISUAL |` キーを本ファイルと逐語一致させること。

## 非視覚的である理由

- 変更対象は次の 5 ファイル（編集）と 1 helper（再利用・無改変）に閉じる:
  - `apps/api/src/_shared/search-query-parser.ts`（`expand: ("tags")[]` パース追加）
  - `packages/shared/src/zod/viewmodel.ts`（`PublicMemberTagZ` 新規 + `PublicMemberListItemZ.tags` optional）
  - `packages/shared/src/types/viewmodel/index.ts`（`PublicMemberListItem.tags?`）
  - `apps/api/src/view-models/public/public-member-list-view.ts`（`PublicMemberListItemSource.tags?`）
  - `apps/api/src/use-cases/public/list-public-members.ts`（`query.expand.includes("tags")` 時のみ `listTagsByMemberIds` を 1 回・memberId で groupBy）
  - `apps/api/src/repository/memberTags.ts` の `listTagsByMemberIds`（既存 helper を再利用し、公開 API 応答順序を安定化する `ORDER BY` を追加）
- これらは HTTP JSON 応答の shape と D1 query 回数にのみ影響し、画面描画・配色・レイアウトに一切影響しない。
- 公開 UI における tags 表示（`apps/web`）は受け入れ条件に含まれず、issue #1006 等の別レーン射程（スコープ外）。
- したがって **スクリーンショットは取得不要**。視覚回帰の観点が存在しない。

## 代替証跡（NON_VISUAL の主証跡）

| 証跡種別           | ソース                                                                                       | 検証する AC          |
| ------------------ | -------------------------------------------------------------------------------------------- | -------------------- |
| contract spec      | `apps/api/src/routes/public/index.contract.spec.ts`                                          | AC-1 / AC-3 / AC-4   |
| use-case unit test | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`                        | AC-2 / AC-3 / AC-5   |
| 手動 smoke         | `outputs/phase-11/manual-smoke-log.md`（ローカルサーバー未起動のため自動テストで代替）       | AC-1 / AC-3          |

詳細な TC 一覧・件数・証跡計画は `outputs/phase-11/main.md` を参照。

## 取得タイミング

本ファイルは `implemented_local_evidence_captured` 段階の宣言である。実コードは `apps/` / `packages/` に反映済み。
証跡（自動テスト実行ログ）は `outputs/phase-11/main.md` に記録済み。UI 変更なしのためスクリーンショットは不要。
