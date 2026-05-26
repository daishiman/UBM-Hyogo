# Phase 13 — Commit & PR

## コミット粒度

1 commit に集約推奨（docs-only / 小規模）。複数に分ける場合の推奨分割:

- `docs(serial-06): backfill Phase 6 §3 SSR fetch intercept note (#884)` — T1
- `docs(serial-06): backfill Phase 10 page.route wording to mockApi fixture (#884)` — T2
- `docs(skill): add SSR fetch lesson cross-link to patterns-lessons-and-pitfalls (#884)` — T3
- `docs(workflow): consume unassigned-task → canonical workflow root (#884)` — T4, T6

## PR 作成（ユーザー承認後のみ）

以下は承認後の実行例。ユーザーの明示指示なしに `git push` / `gh pr create` / Issue close は実行しない。

```bash
git push -u origin docs/issue-884-serial06-phase6-topology-sync-backfill

gh pr create --base dev --title "docs(issue-884): serial-06 Phase 6 topology sync backfill" --body "$(cat <<'EOF'
## Summary
- Issue #884 DoD のうち未完項目（Phase 6 §3 SSR intercept note / Phase 10 page.route 文言 / patterns-lessons cross-link）を backfill
- 既に `server-component-e2e-pattern.md` 等の専用 reference に体系反映済みのため、patterns-lessons-and-pitfalls.md には cross-link 1 行 entry を 2 つ追加（SSOT 重複回避）
- unassigned-task を consumed 化し canonical_workflow pointer を付与
- Issue #884 は OPEN のまま保持（ユーザー明示指示）
- Refs #884

## Test plan
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `grep` ベースの V1-V4 全 hit 整合
- [ ] indexes drift 0
EOF
)"
```

## Issue 状態

Issue #884 は **OPEN のまま保持**（ユーザー明示指示）。`gh issue close` は実行禁止。
PR 本文に `Refs #884`（`Closes` ではなく）を含める。
