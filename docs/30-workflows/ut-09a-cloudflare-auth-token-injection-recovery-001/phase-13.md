# Phase 13: PR 作成 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 13 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec, OPEN のまま据え置き) |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 1〜12 の成果物（仕様書 + `scripts/cf.sh` / `scripts/with-env.sh` 最小修正があれば差分 + 復旧 evidence + system spec 更新差分）を 1 つの PR としてまとめ、CI gate / branch protection を経て main へ取り込む準備を行う。**実行は user 明示指示後**。

## 実行タスク（user 明示指示後）

1. ブランチ命名:
   - 仕様書のみの段階: `docs/issue-414-ut-09a-cloudflare-auth-token-injection-recovery-task-spec`（既に切替済み）
   - 実復旧後 evidence は同ブランチに追加コミット、または `feat/ut-09a-cloudflare-auth-token-injection-recovery-evidence` を新規作成
2. `git status --porcelain` で未コミット変更を確認
3. evidence / spec / system spec / `scripts/cf.sh` / `scripts/with-env.sh`（drift 修正があった場合のみ）差分をまとめてコミット
4. `gh pr create` で通常 PR 作成（CLAUDE.md「PR作成の完全自律フロー」に従う）
5. CI（typecheck / lint / verify-indexes / staged-task-dir-guard / coverage-guard）を確認
6. branch protection の `required_status_checks` を満たすことを確認
7. user が明示した場合だけ Issue #414 へ PR リンクをコメント（Issue は **OPEN のまま** 据え置き、本タスクで close しない）

## 参照資料

- `CLAUDE.md`
- `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 自動実行禁止

- user 明示指示なしで `git commit` / `git push` / `gh pr create` を実行しない
- secret 値（CLOUDFLARE_API_TOKEN / OAuth token / cookie 値）/ 1Password vault 名 / item 名 を含む変更を含めない
- `wrangler login` を採用する変更を含めない
- production 認証経路の改修を本 PR に含めない（本タスクは staging 復旧 SOP に閉じる）
- `--no-verify` の利用は禁止（hook が誤検知する場合は hook 自体を改善する）

## PR 本文要素

- 概要: `bash scripts/cf.sh whoami` を `You are not authenticated` 状態から exit 0 に復旧する SOP を確立し、staging evidence パイプラインを再開する
- 対応 Issue: #414（**OPEN のまま据え置き**、本 PR で close しない）
- 含むもの:
  - phase-01〜13 仕様書一式
  - `outputs/phase-11/` 復旧 evidence（PASS 後）
  - `scripts/cf.sh` / `scripts/with-env.sh` 差分（drift 修正があった場合のみ）
  - aiworkflow-requirements indexes / `task-workflow-active.md` 差分
- 含まないもの:
  - secret 値（API Token / OAuth token / cookie）
  - 1Password vault 名 / item 名（具体名）
  - `wrangler login` 採用変更
  - production 認証経路改修
  - 親タスク `ut-09a-exec-staging-smoke-001` 自体の deploy smoke 実行差分
- スクリーンショット: 本タスクは NON_VISUAL のため画像参照を含めない

## CI / branch protection 観点

- `required_pull_request_reviews=null`（solo dev）
- `required_status_checks` を全て PASS させる
- `required_linear_history` / `required_conversation_resolution` 遵守
- coverage-guard / staged-task-dir-guard の merge skip 規則が誤発動しないこと

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
- Issue #414 の状態は OPEN のまま据え置き（本タスクで close しない）
- secret 値・vault 名・item 名 / 個人情報が PR diff に含まれていない

## タスク100%実行確認

- [ ] user 明示指示後にのみ実行している
- [ ] secret / vault 名 / item 名 / 個人情報が含まれていない
- [ ] `wrangler login` 採用変更が含まれていない
- [ ] CI が PASS している
- [ ] Issue #414 が OPEN のまま据え置かれている

## 完了後

- `task-workflow-active.md` 上の本タスク entry を `completed` に更新（実 `whoami` 復旧 PASS 後のみ）
- 親タスク `ut-09a-exec-staging-smoke-001` Phase 11 の再実行を unblock
- `unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md` を `completed-tasks/` 配下に移動するかの判定（user 明示指示後）
- task-specification-creator skill / aiworkflow-requirements skill の indexes 更新差分を取り込む（必要時）
- 後続 `Refs #414` タスクの起票要否を unassigned-task-detection の結果で判定
