# Phase 13 — commit / PR / release

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`
status: `pending`
pending_reason: `commit / push / PR / GitHub Issue #247 mutation are user-gated`

## 1. 手順（user-gated）

ユーザーから明示承認後にのみ実施する。

```bash
git status
git add docs/30-workflows/issue-247-apps-web-opennext-config-regression-tests/ \
        apps/web/__tests__/opennext-config-regression.spec.ts \
        .github/workflows/ci.yml \
        .claude/skills/aiworkflow-requirements/
git commit -m "feat(issue-247): apps/web OpenNext wrangler 設定回帰テスト追加"
git push -u origin <branch>
gh pr create --base dev --title "feat(issue-247): apps/web OpenNext config regression guard" --body-file -
```

## 2. PR 本文

`.claude/commands/ai/diff-to-pr.md` Phase 13 仕様に従い `outputs/phase-12/implementation-guide.md` を反映。

## 3. user-gated 項目

- commit / push / PR 作成
- GitHub Issue #247 close

## 4. DoD

- PR URL 記録
- CI 全 gate green
- Issue #247 が PR に linked（user 承認後）
