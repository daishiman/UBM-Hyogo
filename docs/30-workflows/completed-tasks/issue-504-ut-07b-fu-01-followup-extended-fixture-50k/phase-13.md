# Phase 13: commit / PR 作成（user gate）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-13/phase-13.md` |
| user gate | **YES** — commit / push / PR 作成は明示承認後に実行 |

## 目的
Phase 1-12 の成果物を 1 つの PR にまとめ、CLAUDE.md「PR 作成の完全自律フロー」に従い `gh pr create` を実行する。

## 実行タスク
1. user 承認取得。
2. ブランチ確認: `feat/issue-504-ut-07b-fu-01-followup-extended-fixture-50k`（artifacts.json `claudeCodeContext.branchNameSuggestion` 正本）
3. main 同期: `git fetch origin main && git merge origin/main`、コンフリクトは CLAUDE.md の既定方針で解消。
4. 品質検証: `mise exec -- pnpm install --force && mise exec -- pnpm typecheck && mise exec -- pnpm lint`、失敗時は最大 3 回まで自動修復。
5. 全変更を `git add -A` で取り込みコミット。
6. PR 作成:
   ```bash
   gh pr create \
     --title "feat(test): issue-504 schema alias back-fill 50k row extended fixture / staging stress trial" \
     --label priority:low --label type:improvement --label scale:small --label area:api --label area:testing \
     --body "$(cat <<'EOF'
   ## Summary
   - Issue #504 / UT-07B-FU-01-FOLLOWUP の formal 化
   - 50k synthetic fixture 生成 / staging 投入 / cleanup / 10 trials stress trial driver を `scripts/schema-alias-backfill/` に追加
   - aiworkflow-requirements に 50k stress trial 導線を SSOT として反映

   ## Test plan
   - [ ] vitest `scripts/schema-alias-backfill` PASS
   - [ ] bats / shellcheck PASS
   - [ ] production guard 二重化を grep で確認
   - [ ] redaction grep no-match
   - [ ] staging 10 trials evidence（user 承認後）

   Refs: #504
   EOF
   )"
   ```

## 完了条件
- PR が作成され、URL が報告されている
- PR 本文に `Refs: #504` を含む
- 5 label がすべて付与
- CI gate PASS（typecheck / lint / verify-indexes-up-to-date）

## 参照資料
- `CLAUDE.md` 「PR 作成の完全自律フロー」
- `.claude/commands/ai/diff-to-pr.md`

## 成果物
- `outputs/phase-13/phase-13.md`（PR URL / 採用ブランチ / 自動修復ログ）
