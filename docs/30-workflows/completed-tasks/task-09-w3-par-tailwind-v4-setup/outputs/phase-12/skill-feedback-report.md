# Skill Feedback Report — task-09

## テンプレ改善

| item | routing | promotion target | evidence path |
| --- | --- | --- | --- |
| VISUAL_ON_EXECUTION で generated CSS grep を `var(--ubm-*)` と utility selector の 2 点にする | owning skill | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `outputs/phase-11/main.md`, `outputs/phase-11/generated.css`, `apps/web/src/__tests__/build-output.test.ts` |

## ワークフロー改善

| item | routing | promotion target | evidence path |
| --- | --- | --- | --- |
| build pipeline task では Phase 4 に placeholder token grep 0 件 gate を前倒し配置する | owning skill | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | `outputs/phase-4/hex-grep-gate.sh`, `outputs/phase-11/evidence/hex-grep-zero.log` |

## ドキュメント改善

| item | routing | no-op reason | evidence path |
| --- | --- | --- | --- |
| 09b design tokens の task-09 bridge contract | no-op | 09b §10 が既に Tailwind v4 template を持つ | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
