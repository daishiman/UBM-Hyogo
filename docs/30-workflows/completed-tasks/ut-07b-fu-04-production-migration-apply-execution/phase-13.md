# Phase 13: PR 作成 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 1〜12 の成果物（仕様書 + Phase 11 evidence + Phase 12 system spec 同期差分）を 1 つの PR としてまとめ、CI gate / branch protection を経て main へ取り込む準備を行う。**実行は user 明示指示後**。

## 実行タスク（user 明示指示後）

1. ブランチ命名:
   - 仕様書のみの段階: `docs/issue-424-ut-07b-fu-04-production-migration-apply-task-spec`
   - read-only runtime verification 後 evidence は同ブランチに追加コミット、または `feat/ut-07b-fu-04-production-migration-verification-evidence` を新規作成
2. `git status --porcelain` で未コミット変更を確認
3. evidence / spec / system spec 同期差分をまとめてコミット
4. CLAUDE.md「PR作成の完全自律フロー」に従い `gh pr create` で通常 PR 作成
5. CI（typecheck / lint / verify-indexes / staged-task-dir-guard / coverage-guard）を確認
6. branch protection の `required_status_checks` を満たすことを確認
7. user が明示した場合だけ Issue #424 へ PR リンクをコメント（Issue は **CLOSED のまま**）

## 自動実行禁止

- user 明示指示なしで `git commit` / `git push` / `gh pr create` を実行しない
- secret 値（CLOUDFLARE_API_TOKEN / OAuth token / Account ID）を含む変更を含めない
- production read-only verification を本 PR で勝手に実行しない（Phase 11 で user 明示指示後にのみ実行）
- production D1 mutation / duplicate apply は実行しない
- `--no-verify` の利用は禁止（hook が誤検知する場合は hook 自体を改善する）

## PR 本文要素

- 概要: `apps/api/migrations/0008_schema_alias_hardening.sql` の production 既適用 fact を検証し、duplicate apply を禁止する operations verification タスク。本 PR は spec + evidence 取り込み（または spec のみ）を含む
- 対応 Issue: #424（**CLOSED のまま**、再オープンしない）
- 含むもの:
  - phase-01〜13 仕様書一式
  - artifacts.json
  - Phase 11 redacted runtime evidence（read-only verification 後）
  - aiworkflow-requirements 同期差分（task-workflow-active.md / artifact-inventory）
  - 必要なら `.claude/skills/aiworkflow-requirements/indexes/` 再構築結果
- 含まないもの:
  - secret 値 / Account ID 値 / OAuth token / cookie
  - migration ファイル本体の変更（`0008_schema_alias_hardening.sql` は不変）
  - apps/api 側コード変更
  - apps/web 側コード変更
- スクリーンショット: 本タスクは NON_VISUAL のため画像参照なし（セクションを設けない）

## CI / branch protection 観点

- `required_pull_request_reviews=null`（solo dev）
- `required_status_checks` を全て PASS させる
- `required_linear_history` / `required_conversation_resolution` 遵守
- coverage-guard / staged-task-dir-guard の merge skip 規則が誤発動しないこと
- `verify-indexes-up-to-date` を PASS させる（aiworkflow-requirements 更新時は事前に `pnpm indexes:rebuild`）

## 完全自律フロー（CLAUDE.md 準拠の参照）

1. `git fetch origin main` → ローカル `main` を fast-forward
2. 作業ブランチに `main` をマージ（コンフリクト解消は CLAUDE.md「コンフリクト解消の既定方針」に従う）
3. `pnpm install --force` → `pnpm typecheck` → `pnpm lint`（必要に応じ `pnpm indexes:rebuild`）
4. `git add -A` → `git commit`（HEREDOC で commit message、Co-Authored-By 付与）
5. `git push -u origin <branch>`
6. `gh pr create` で本 PR 本文を投稿

## サブタスク管理

- [ ] user 明示指示を得る
- [ ] CLAUDE.md「PR作成の完全自律フロー」に従って commit → push → PR 作成
- [ ] CI gate を確認
- [ ] outputs/phase-13/main.md に PR URL / CI 結果を記録

## 成果物

- `outputs/phase-13/main.md`（PR URL / CI 結果 / マージ可否）

## 完了条件

- PR が作成され CI が PASS
- 必要 status check が全て green
- Issue #424 の状態は CLOSED のまま
- secret 値・Account ID 値・PII が PR diff に含まれていない

## タスク100%実行確認

- [ ] user 明示指示後にのみ実行している
- [ ] secret 値・Account ID 値・PII が含まれていない
- [ ] CI が PASS している
- [ ] Issue #424 が CLOSED のまま維持されている
- [ ] `--no-verify` を使用していない

## 完了後

- `task-workflow-active.md` 上の本タスク entry を `completed` に更新（既適用検証 PASS 後のみ）
- `unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` を `completed-tasks/` 配下に移動するかの判定（user 明示指示後）
- task-specification-creator skill / aiworkflow-requirements skill の indexes 更新差分を取り込む（必要時）
- post-check FAIL があった場合は forward-fix migration（`0009_*`）の起票要否を `unassigned-task-detection.md` の結果で判定
## 参照資料

- `phase-11.md`
- `phase-12.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

PR作成はユーザー明示指示後のみ。現サイクルでは local spec validation と index consistency を確認し、commit / push / PR は実行しない。
