# UI Sanity Visual Review — admin-schema-terminology-clarity

## 状態

本タスクは VISUAL UI task。視覚的差分は表示文字列の日本語化と生 revisionId の非表示であり、レイアウト構造・スタイル・色トークンは変更しない。local evidence は captured、authenticated staging screenshot は user-gated。

## 視覚レビュー観点

| 観点 | 判定方法 |
| --- | --- |
| 画面名 | `/admin/schema` が「フォーム項目の対応づけ」として読める |
| 現在構成 | 生 revisionId / hash が表示されず、「最新版」「適用中」「取得日」で読める |
| 操作語 | `Bulk Resolve` / `Bulk Rollback` / `resolve` が「まとめて対応づけ」「まとめて取り消し」「対応づけ」へ置換されている |
| ダッシュボード | 「Schema issues」ではなく「未対応のフォーム項目」として表示される |

## 不変条件

- 新規 CSS / token / primitive なし。
- API / D1 / Google Form / endpoint surface 不変。
- staging screenshot は Phase 13 前の user-gated operation として扱う。
