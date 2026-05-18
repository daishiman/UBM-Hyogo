# Phase 8: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 種別 | ドキュメント |
| 入力 | Phase 4-7 成果物 |
| 出力 | `outputs/adoption-tracker.md`、`CLAUDE.md` 不変条件追補（任意） |

## 新規ファイル: `outputs/adoption-tracker.md`

Phase 4 完了後の最終状態を表す 19×6 採用 matrix を生成する。`X` セルが残らないことが DoD。

template:

```md
# Adoption Tracker — Issue #749 (post-implementation)

更新日: <YYYY-MM-DD>
検証コマンド: `bash scripts/verify-primitive-adoption.sh`（exit 0）

| # | route | FormField | EmptyState | Pagination | Icon | Breadcrumb | useAdminMutation |
| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `/` | - | - | - | O | - | - |
| 2 | `/(public)/members` | - | O | O | O | - | - |
| ...（19 行）|
```

凡例: `O` = 採用済 / `-` = 該当UI要素なし / `X` = 残置（DoD 違反、PR merge 不可）

## CLAUDE.md 追補（同一サイクルで実施）

不変条件として「admin panel の form input は `FormField` 経由標準」「admin mutation は `@/features/admin/hooks/useAdminMutation` 経由標準」を CLAUDE.md `重要な不変条件` に追記済み。別 task への切り出しは不要。

## 完了条件

- [ ] `outputs/adoption-tracker.md` が生成され、`X` セル 0
- [ ] 検証日時とコマンド exit code が記載されている
- [x] CLAUDE.md 追補の要否が結論付けされ、同一サイクルで実施済み

## 次Phase

→ Phase 9（a11y / regression）
