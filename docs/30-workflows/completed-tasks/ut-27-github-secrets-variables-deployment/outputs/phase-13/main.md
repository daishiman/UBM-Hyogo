# Phase 13 outputs / main — PR 作成 / ユーザー承認後 secret 配置実行

> **本 Phase 13 のすべてのアクション（PR 作成 / 実 secret 配置 / 実 dev push smoke）は user の三段明示承認後にのみ実行する。**
> 仕様書整備（本 PR の差分）まで完了した状態で待機する。

## 位置付け

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | pending（NOT EXECUTED — awaiting user approval） |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true**（PR 作成 / 実 secret 配置 / 実 dev push の 3 段独立） |

## user 三段承認モデル

| # | 承認 | 対象オペレーション | 状態 |
| --- | --- | --- | --- |
| 1 | PR 作成承認 | `git commit` / `git push` / `gh pr create` | 承認待ち |
| 2 | 実 secret 配置承認 | `gh api ... -X PUT`（environment 作成） / `gh secret set` / `gh variable set` | 承認待ち（PR マージ後） |
| 3 | 実 dev push 承認 | `git commit --allow-empty && git push origin dev` / `gh run watch` | 承認待ち（実 secret 配置完了後） |

## 成果物リンク

| ファイル | 状態 | 役割 |
| --- | --- | --- |
| `apply-runbook.md` | 仕様レベル固定済（NOT EXECUTED） | 実 secret 配置の `op read` → `gh secret set` 手順 spec |
| `cloudflare-api-token-setup-runbook.md` | 作成済 | Cloudflare API Token の取得、1Password 保存、GitHub Environment Secret 設定までの詳細手順 |
| `op-sync-runbook.md` | 予約成果物作成済（NOT EXECUTED） | 1Password ↔ GitHub 同期実走 runbook |
| `verification-log.md` | 予約成果物作成済（NOT EXECUTED） | dev push smoke 実走ログ（commit SHA / run URL / 通知到達） |

## 承認ゲート総括

- Phase 1〜3 = `completed`
- Phase 4〜10 = `pending`（仕様書整備のみ）
- Phase 11 必須 4 outputs = 揃っている
- Phase 12 必須 6+1 outputs = 揃っている
- secret 値転記 = 0 件
- 計画系 wording = 0 件
- 上流 3 件（UT-05 / UT-28 / 01b）completed = 実 secret 配置直前に再確認

## PR 草案サマリ

- title: `docs(workflow): add UT-27 GitHub Secrets/Variables deployment Phase 11-13 task spec (Issue #47)`
- base: `dev`
- head: `feat/issue-47-ut-27-github-secrets-variables-task-spec`
- linked issue: `Refs #47`（クローズは別 PR）

## 詳細

詳細は `phase-13.md`、`apply-runbook.md`、`cloudflare-api-token-setup-runbook.md` を参照。
