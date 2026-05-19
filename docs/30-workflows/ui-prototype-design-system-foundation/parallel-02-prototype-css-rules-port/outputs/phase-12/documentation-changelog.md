# Documentation Changelog

## 2026-05-18

| file | change |
|------|--------|
| `apps/web/src/styles/globals.css` | parallel-02 G3 marker blocksへCSS hookを正規化 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | active tag button に `data-component="tag-pill"` / `aria-selected="true"` を追加 |
| `apps/web/app/visual-harness/[name]/*` | parallel-02 visual harness scenarioを追加 |
| `apps/web/playwright/tests/visual/parallel-02-css-rules.spec.ts` | Phase 11 screenshot 9件を保存するPlaywright specを追加 |
| `phase-05-implementation-guide.md` | 固定行番号前提を撤回し、暫定hook正規化手順を追加 |
| `phase-06-test-plan.md` | 実URLと9 screenshot inventoryへ統一 |
| `phase-08-dod.md` | visual snapshot 6種表記を9種へ修正 |
| `phase-11-evidence-inventory.md` | parser-compatible `Classification / Path / Status` tableへ変更 |
| `phase-12-compliance-check.md` | task-specification-creator canonical 9 headingsへ変更 |
| `outputs/phase-12/*` | sub-workflow strict 7を追加 |

## Entry Checklist

```bash
git status --short
git diff --stat
```
