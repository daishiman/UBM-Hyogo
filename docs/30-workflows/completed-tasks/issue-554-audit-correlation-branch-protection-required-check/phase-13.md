# Phase 13: commit / PR 作成（user gate）

## 目的

CLAUDE.md「PR 作成の完全自律フロー」に従い、本タスクの差分を `dev` 向け PR として提出する。

## 前提

- Phase 1-12 が DoD 完了
- 作業ブランチ: `docs/issue-554-branch-protection-required-check`
- ローカルが `origin/dev` と integrated

## 実装手順

### 13.1 dev 同期 + マージ

```bash
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout docs/issue-554-branch-protection-required-check
git merge dev   # コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従う
```

### 13.2 品質検証 3 コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

失敗時は CLAUDE.md「品質検証失敗時の自動修復」に従い最大 3 回まで自動修復してコミット。

### 13.3 user decision gate: branch protection drift

Before any `gh api -X PUT`, the user must explicitly choose one of these options:

1. contexts-only apply: add `audit-correlation-verify / verify` and preserve current drift values from the fresh before snapshot.
2. same-operation drift correction: add the context and also correct branch protection invariants to the CLAUDE.md intended contract.
3. separate task creation: do not correct drift in this operation; create a dedicated follow-up before closing the governance drift.

The default payload in Phase 2/5/6 is option 1. Options 2 or 3 require explicit user instruction.

### 13.4 branch protection PUT + after evidence

After the user approves the operation, run Phase 5 for `dev`, verify the pending required check behavior, then run Phase 6 for `main`. Save `payload-{dev,main}-protection.json`, `after-{dev,main}-protection.json`, and diff files under `outputs/phase-11/`.

### 13.5 ステージ + コミット

```bash
git status --porcelain
git add CLAUDE.md \
        .claude/skills/aiworkflow-requirements/references/branch-protection.md \
        .claude/skills/aiworkflow-requirements/indexes/ \
        docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/

git commit -m "$(cat <<'EOF'
docs(issue-554): prepare audit-correlation-verify required check governance

- dev / main branch protection の required_status_checks.contexts に
  `audit-correlation-verify / verify` を追加する手順と evidence path を整備
- CLAUDE.md「ブランチ戦略」「Governance / CODEOWNERS」章に
  required contexts 注記を追記
- aiworkflow-requirements skill に references/branch-protection.md を
  追加し、indexes を rebuild

Refs: #554

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### 13.6 push + PR 作成

```bash
git push -u origin docs/issue-554-branch-protection-required-check

gh pr create \
  --base dev \
  --head docs/issue-554-branch-protection-required-check \
  --title "docs(issue-554): register audit-correlation-verify as required status check on dev/main" \
  --label priority:medium --label type:security --label scale:small \
  --body "$(cat <<'EOF'
## Summary

- `audit-correlation-verify / verify` を `dev` / `main` branch protection の required status check に登録する governance workflow を整備
- governance 文書（CLAUDE.md / aiworkflow-requirements）に intended contract と user-gated execution boundary を同期
- `outputs/phase-11/` に read-only before protection snapshots を保存。after snapshots は approved PUT 後に追加

## 関連

- Refs: #554（Issue は CLOSED のまま運用）
- 親 Issue: #516
- 親タスク: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`

## Evidence

- `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/outputs/phase-11/before-dev-protection.json`
- `.../before-main-protection.json`
- `.../diff-summary.md`
- `.../payload-dev-protection.json` / `.../after-dev-protection.json`（approved PUT 後）
- `.../payload-main-protection.json` / `.../after-main-protection.json`（approved PUT 後）

## Test plan

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -r '.required_status_checks.contexts[]' | grep -F 'audit-correlation-verify / verify'` が hit
- [ ] 同じく `branches/main/protection` も hit
- [ ] `mise exec -- pnpm typecheck` clean
- [ ] `mise exec -- pnpm lint` clean
- [ ] `verify-indexes-up-to-date` CI gate green
- [ ] UT-GOV-001 不変条件 grep（Phase 10）全項目 OK

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## DoD（Phase 13）

- [ ] PR が `dev` 向けで作成されている
- [ ] PR labels: `priority:medium`, `type:security`, `scale:small`
- [ ] PR 本文に `Refs: #554` / evidence 参照が含まれる
- [ ] PR の checks に `audit-correlation-verify / verify` が Required として表示されている（Phase 5 完了後）

## 注意事項

- Issue #554 は CLOSED のまま運用。本 PR ではいかなる reopen / close 操作も行わない（`Closes #554` / `Fixes #554` は使わず `Refs: #554` のみ）。
- `--no-verify` は使用しない。hook が誤検知する場合は CLAUDE.md「sync-merge」セクションの方針に従い hook 自体を改善する。
