# Phase 13 — PR 作成 main 成果物

## サマリ

UT-11（管理者向け Google OAuth + PKCE ログインフロー）の PR 作成 Phase の成果物。本タスクは implementation であり、`apps/web` runtime 実装と仕様 close-out を含む。**PR 本体作成はユーザーの明示承認後にのみ実行する**。

## ユーザー承認

- [ ] チャット内で明示承認（"approve" 等）を得た
- [ ] 承認なしの状態では `gh pr create` / `git push` / `git commit` を実行しない

## 生成ドキュメント

| # | ドキュメント | パス |
| --- | --- | --- |
| 1 | local-check-result.md | outputs/phase-13/local-check-result.md |
| 2 | change-summary.md | outputs/phase-13/change-summary.md |
| 3 | pr-body.md | outputs/phase-13/pr-body.md |

## branch / base

| 項目 | 値 |
| --- | --- |
| feature branch | `feat/ut-11-google-oauth-admin-login-flow` |
| base branch | `main`（または運用中の `dev`、CLAUDE.md branch 戦略に従う） |
| PR タイトル | `docs(ut-11): 管理者向け Google OAuth + PKCE ログインフロー仕様策定` |

## 影響範囲

- 種別: implementation
- 影響パス: `docs/30-workflows/ut-11-google-oauth-admin-login-flow/` 配下のみ
- コード差分: なし

## 不変条件への対応

- #5: 差分が docs only、コード差分 0
- #6: GAS prototype 由来コード片なし

## 既知制約（PR 本文に明記）

- B-01: session 24h exp、refresh は MVP 範囲外
- B-02: Google verification 申請は MVP 後
- B-04: プレビュー URL を redirect URI に登録しない（staging 固定 URL 集約）

## close-out

- [ ] artifacts.json の全 phase が completed
- [ ] UT-03 と OAuth client 共有方針を双方の implementation-guide に明記
- [ ] 本タスク完了後、管理画面機能タスク群が「ログイン済み管理者前提」で着手可能
