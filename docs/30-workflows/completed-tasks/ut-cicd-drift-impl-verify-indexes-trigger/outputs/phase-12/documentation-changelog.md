# Phase 12 — Documentation Changelog

## Entry Checklist

```bash
git status --porcelain apps/ packages/ 2>/dev/null
# output: 0 lines

git status --porcelain -- infra/ scripts/ .github/ tests/fixtures/ docs/30-workflows/runbooks/ 2>/dev/null
# output: 0 lines for task-owned implementation targets
```

`lefthook.yml` は task-owned hook config として再分類済み。`apps/` / `packages/` / runtime code は変更なし。

## Changed Files

| Path | Change |
| --- | --- |
| `docs/00-getting-started-manual/lefthook-operations.md` | trigger 条件 / SOP A-B / 厳守事項を追加 |
| `lefthook.yml` | fail_text に runbook 詳細リンクを追加 |
| `scripts/hooks/indexes-drift-guard.sh` | ユーザー向け復旧コマンド表記を `mise exec -- pnpm indexes:rebuild` に統一 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/artifacts.json` | root artifacts 追加 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/artifacts.json` | output artifacts mirror 追加 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/phase-11/manual-smoke-log.md` | template から実検証ログへ更新 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/phase-12/*.md` | strict 7 を正規名で補完 |
| `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` | consumed trace 追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow entry 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | quick reference 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active ledger 追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴に本 workflow sync を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260517-verify-indexes-trigger-recovery-sop.md` | changelog 追加 |

## Validator / Verification Records

| Command | Expected |
| --- | --- |
| `rg -n "skill indexes drift gate" docs/00-getting-started-manual/lefthook-operations.md` | match >= 1 |
| `rg -n "verify-indexes-up-to-date" docs/00-getting-started-manual/lefthook-operations.md lefthook.yml` | match >= 2 |
| `rg -n "mise exec -- pnpm indexes:rebuild" docs/00-getting-started-manual/lefthook-operations.md` | match >= 2 |
| `find docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/phase-12 -maxdepth 1 -type f` | strict 7 files |
| `cmp -s docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/artifacts.json docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/artifacts.json` | exit 0 |

## Executed Validation Results

| Command | Result |
| --- | --- |
| `mise exec -- pnpm indexes:rebuild` | exit 0; regenerated `indexes/topic-map.md` / `indexes/keywords.json` |
| `pnpm indexes:rebuild` | exit 0; regenerated `indexes/topic-map.md` / `indexes/keywords.json` |
| `pnpm exec lefthook validate` | exit 0; `All good` |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `git diff --check` | exit 0 |

## Skill Ledger

| Category | Status |
| --- | --- |
| skill 正本 | 更新済み: `.claude/skills/aiworkflow-requirements/SKILL.md` 変更履歴に workflow sync を追加 |
| skill 履歴 | 更新済み: `changelog/20260517-verify-indexes-trigger-recovery-sop.md` を追加 |
| skill reference / template | 該当なし: 既存 Phase 12 rule の適用のみ |
| workflow artifacts | 更新済み |
| workflow outputs | 更新済み |
| system spec / indexes | aiworkflow-requirements indexes / task workflow 更新 |
| validator 実行記録 | Phase 11 / compliance check に記録 |
