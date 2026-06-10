# Phase 11 Manual Test Spec — admin-schema-diff-review-resolve-ux

## テストケース

| TC-ID | 画面 | 操作 | 期待 |
|-------|------|------|------|
| TC-01 | `/admin/schema` | ページを開く | 目的説明 `SchemaReviewGuide` が冒頭に表示される |
| TC-02 | `/admin/schema` | 差分カード未操作 | 差分カード一覧が表示され、割当フォームはまだ開いていない |
| TC-03 | `/admin/schema` | `所属部署` カードをクリック | 当該カード直下に `schema-assign-inline-form` が開く |
| TC-04 | `/admin/schema` | TC-03 の展開状態を確認 | 文脈ヘルプとやさしい用語（技術名併記）が見える |

## 画面カバレッジマトリクス

| TC-ID | 対象状態 | スクリーンショット |
|-------|----------|------------------|
| TC-01 | 目的説明表示 | `screenshots/schema-review-guide-default.png` |
| TC-02 | フォーム未展開 | `screenshots/schema-diff-card-collapsed.png` |
| TC-03 | カード直下フォーム展開 | `screenshots/schema-diff-card-inline-form-expanded.png` |
| TC-04 | 文脈ヘルプ表示 | `screenshots/schema-assign-help-visible.png` |

