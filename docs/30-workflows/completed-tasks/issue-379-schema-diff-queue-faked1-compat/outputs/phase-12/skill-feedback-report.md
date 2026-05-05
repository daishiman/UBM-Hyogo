# Skill feedback report

## Template improvement

`task-specification-creator` should warn when an implementation workflow hard-codes a fix plan before baseline evidence is captured. Phase 2/5 should allow a `verified_current_no_code_change` branch when Phase 1 shows the reported failure is stale.

Promotion: reflected in `.claude/skills/task-specification-creator/references/task-type-decision.md`, `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`, and `SKILL-changelog.md`.

## Workflow improvement

For package scripts that append a fixed path, focused Vitest evidence should use:

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts <test-file>
```

instead of:

```bash
pnpm --filter <package> test -- <test-file>
```

## Documentation improvement

Phase 12 docs must say `main.md + 補助6ファイル` rather than "必須6成果物" when strict close-out is required.

Promotion: already reflected in `.claude/skills/task-specification-creator/references/phase-12-spec.md`; this workflow uses the strict 7-file wording.
