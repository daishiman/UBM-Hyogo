# Phase 13: PR 作成 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 13 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 1〜12 の成果物（仕様書 + 実 staging evidence + system spec 更新）を 1 つの
PR としてまとめ、CI gate / branch protection を経て main へ取り込む準備を行う。
**実行は user 明示指示後**。

## 実行タスク（user 明示指示後）

1. ブランチ命名: `docs/issue-339-ut-09a-exec-staging-smoke-task-spec` 系（spec_created 段階）
   または `feat/ut-09a-exec-staging-smoke-evidence`（実 staging 実行 PASS 後）
2. `git status --porcelain` で未コミット変更を確認
3. evidence / spec / system spec 更新差分をまとめてコミット
4. `gh pr create` で通常 PR 作成（CLAUDE.md「PR作成の完全自律フロー」に従う）
5. CI（typecheck / lint / verify-indexes / staged-task-dir-guard / coverage-guard）を確認
6. branch protection の `required_status_checks` を満たすことを確認
7. user が明示した場合だけ Issue #339 へ PR リンクをコメント（Issue は CLOSED のまま）

## 参照資料

- CLAUDE.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-12/phase12-task-spec-compliance-check.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 自動実行禁止

- user 明示指示なしで `git commit` / `git push` / `gh pr create` を実行しない
- secret 値を含む変更を含めない
- production deploy（09c）を本 PR で実行しない

## PR 本文要素

- 概要: 09a placeholder 置換タスクの spec / evidence
- 対応 Issue: #339（CLOSED のまま）
- 含むもの: phase-01〜13 仕様書 / 実 staging evidence（実行 PASS 後）/ system spec 更新差分
- 含まないもの: production deploy / 09c の GO 判定 / secret 値
- スクリーンショット: `outputs/phase-11/playwright-staging/` 配下（実行 PASS 後）

## CI / branch protection 観点

- `required_pull_request_reviews=null`（solo dev）
- `required_status_checks` を全て PASS させる
- `required_linear_history` / `required_conversation_resolution` 遵守
- `--no-verify` の利用は禁止（hook が誤検知する場合は hook 自体を改善する）

## サブタスク管理

- [ ] user 明示指示を得る
- [ ] CLAUDE.md「PR作成の完全自律フロー」に従って commit → push → PR 作成
- [ ] CI gate を確認
- [ ] outputs/phase-13/main.md に PR URL / CI 結果を記録

## 成果物

- outputs/phase-13/main.md（PR URL / CI 結果 / マージ可否）

## 完了条件

- PR が作成され CI が PASS
- 必要 status check が全て green
- Issue #339 の状態は CLOSED のまま
- secret 値や個人情報が PR diff に含まれていない

## タスク100%実行確認

- [ ] user 明示指示後にのみ実行している
- [ ] secret / 個人情報が含まれていない
- [ ] CI が PASS している

## 完了後

- 09c production deploy タスクの blocker 状態が更新済みであることを再確認
- task-specification-creator skill / aiworkflow-requirements skill の indexes 更新差分を取り込む（必要時）
- 後続 `Refs #339` タスクの起票要否を unassigned-task-detection の結果で判定
