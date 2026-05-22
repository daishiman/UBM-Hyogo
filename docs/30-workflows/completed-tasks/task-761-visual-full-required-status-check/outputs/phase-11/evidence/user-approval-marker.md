# user 明示承認 marker

| 項目 | 値 |
|------|------|
| approval 対象 | `dev` / `main` branch protection の `required_status_checks.contexts` に 3 viewport context を追加 |
| 承認文言テンプレ | 「`dev` / `main` の branch protection に `visual-full (desktop) / (tablet) / (mobile)` を required status check として追加することを承認する」 |
| 承認日時 | 2026-05-17 21:49 JST (UTC 2026-05-17T12:49:39Z) |
| 承認媒体 | Claude Code AskUserQuestion チャット |
| Phase 5 実行可否 | Phase 13 の timestamped approval marker が存在し、承認日時・承認者・文言が placeholder でないこと |

## 承認内容

承認対象の不可逆操作:

1. `gh api -X POST repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts` 実行
2. `gh api -X POST repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks/contexts` 実行

## 承認スコープ外（別承認が必要）

- workflow yaml の変更
- 既存 5 context の削除
- `enforce_admins` などの他フィールド変更

## 承認記録

```
[2026-05-17 21:49 JST / 2026-05-17T12:49:39Z]
user: daishiman (manju.manju.03.28@gmail.com)
媒体: Claude Code AskUserQuestion 単一選択回答
文言: 「承認する（dev → main の順で実行）」
質問文: 「dev / main branch protection の required_status_checks.contexts に
  `visual-full (desktop)`, `(tablet)`, `(mobile)` の 3 件を
  追加する不可逆 governance mutation を、今この場で実行しますか?」
備考: fresh evidence (check-runs API) で実測した結果、check run 名は
  workflow prefix なしの `visual-full (desktop)` / `(tablet)` / `(mobile)` であり、
  既存 contexts (`ci`, `Validate Build` 等) と同形式。本承認はこの実測形式での POST
  を含む。
```

## 実行結果サマリ

| 対象 | before contexts 数 | after contexts 数 | 追加 contexts | 不変条件 |
|------|--------|---------|---------|----------|
| dev  | 5 | 8 | `visual-full (desktop)` / `(tablet)` / `(mobile)` | `required_pull_request_reviews=null` / `enforce_admins=true` / `lock_branch=false` / `required_linear_history=true` / `required_conversation_resolution=true` 保持 |
| main | 5 | 8 | 同上 | 同上 |
