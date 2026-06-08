# Phase 11: 手動テスト（root summary）

canonical output: `outputs/phase-11/phase-11.md`

## テストケース

| TC-ID | 画面状態 | 期待結果 |
| --- | --- | --- |
| TC-01 | tag master 一覧 | `/admin/tag-master` で一覧と sidebar 導線が表示される |
| TC-02 | 編集フォーム | 一覧行選択で code / label / category 編集フォームに到達できる |
| TC-03 | code conflict | 409 `tag_code_conflict` を「同じコード」文言で表示する |
| TC-04 | stale conflict | 409 `tag_stale_conflict` を「別の変更」文言で表示する |

## 画面カバレッジマトリクス

| TC-ID | 画面 | スクリーンショット証跡 |
| --- | --- | --- |
| TC-01 | 一覧 | `screenshots/tag-master-list.png` |
| TC-02 | 編集フォーム | `screenshots/tag-master-edit-form.png` |
| TC-03 | code conflict | `screenshots/tag-master-code-conflict.png` |
| TC-04 | stale conflict | `screenshots/tag-master-stale-conflict.png` |

## 参照資料

- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/manual-test-result.md`
