# unassigned task detection

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| `POST /me/visibility-request` 用 confirm dialog | 本タスクは login + profile read-only に集中 | 後続 wave（公開状態切替 UI 専用 task） |
| `POST /me/delete-request` 用 confirm dialog | 同上 | 後続 wave |
| 退会復元 UI（admin 経由） | 本タスクは会員視点のみ | 06c admin |
| profile fields のラベル日本語化（stableKey → 表示名 mapping） | 12-search-tags の表示名辞書次第 | 12-search-tags 関連 task |
| `/profile` の i18n（ja のみ） | MVP は ja のみ | 将来 wave |
| Magic Link 再送 cooldown の永続化（reload 後も継続） | URL query で代替、優先度低 | 後続 wave |
| 06b `/profile` ログイン後 visual evidence 取得 | 実 session / API fixture / staging deploy がこの review turn では未準備 | `docs/30-workflows/unassigned-task/UT-06B-PROFILE-VISUAL-EVIDENCE.md` |
| 06b Magic Link 429 `Retry-After` UI 復元 | client cooldown は補助で、API rate limit を正本にした復元表示が未実装 | `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` |
| Next.js middleware -> proxy convention migration | Next.js 16 dev server が `middleware` file convention deprecated warning を出す | `docs/30-workflows/unassigned-task/UT-06B-NEXT-PROXY-MIGRATION.md` |

## Phase 10 引継ぎ minor

| ID | 内容 | 解消条件 |
| --- | --- | --- |
| M-01 | `editResponseUrl` null 時の tooltip 文言 | 文言運用ガイド整備時 |
| M-02 | mobile MagicLinkForm cooldown 表示折り返し | 09-ui-ux 対応時 |
| M-03 | 参加履歴の空状態文言 | EmptyState 文言定数化時 |
