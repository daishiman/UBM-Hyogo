# Phase 13: PR 作成

## 前提

- Phase 1-12 全完了
- Phase 9 ゲートコマンドが全 green
- `outputs/phase-11/` の PR 前 evidence と `outputs/phase-12/` の必須成果物が揃っている
- user_approval 取得済（commit / push / PR は user 明示指示まで実行禁止）

## PR 作成手順

1. branch 確認: `feat/ut-08a-04-d1-migration-test-guideline` 等
2. `git fetch origin dev && git merge origin/dev`（コンフリクト解消）
3. `mise exec -- pnpm install --force && mise exec -- pnpm typecheck && mise exec -- pnpm lint`
4. `git add -A && git commit`（CLAUDE.md `Co-Authored-By` 仕様準拠）
5. `git push -u origin <branch>`
6. `gh pr create --base dev --title "feat(docs): add d1 migration test guideline runbook (#323)" --body "$(cat <<'EOF'
## Summary
- governance runbook 作成: `docs/30-workflows/runbooks/d1-migration-test-guideline.md`
- `apps/api/migrations/README.md` に runbook link
- `.github/workflows/d1-migration-verify.yml` に PR comment step 追加（idempotent）
- `scripts/d1/__tests__/migration-guideline-presence.bats` で必須見出し presence assertion

Refs #323

## Test plan
- [ ] bats `migration-guideline-presence.bats` 全 4 ケース pass
- [ ] 既存 bats suite 回帰なし
- [ ] 本 PR の comment に runbook link bot が 1 件 post される
- [ ] 追加 push で comment が update され重複しない

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"`

## チェック

- base ブランチが `dev`（CLAUDE.md 既定）
- PR comment に runbook link bot が 1 件投稿される
- PR comment URL / comment id / workflow run URL を `outputs/phase-13/ci-comment-evidence.md` に記録する
- issue #323 は CLOSED のまま再 OPEN しない（`Refs #323` のみで `Closes` は使わない）

## DoD

- PR URL 取得
- CI green（全 required status check）
- 本タスク完了報告（user に PR URL 提示）

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 13 |
| status | blocked_until_user_approval |

## 目的

ユーザー明示承認後に commit / push / PR 作成と PR comment runtime evidence を扱う。

## 実行タスク

- user approval 後にPRを作成する。
- CI comment URL、comment id、workflow run URL を Phase 13 evidence として記録する。

## 参照資料

- `phase-11.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物/実行手順

`outputs/phase-13/ci-comment-evidence.md` と PR 情報を記録する。

## 完了条件

- PR URL と Phase 13 evidence が揃う。
