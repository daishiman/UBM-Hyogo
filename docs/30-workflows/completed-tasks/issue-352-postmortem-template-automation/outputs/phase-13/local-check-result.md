# Phase 13 Local Check Result

## Commands

```bash
mise exec -- pnpm vitest run scripts/postmortem --coverage.enabled=false
mise exec -- pnpm vitest run scripts/postmortem --coverage '--coverage.include=scripts/postmortem/**'
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee --evidence <tmp>/phase-11 --rollback-evidence <tmp>/rollback.md --occurred-at 2026-05-05T00:00:00Z
```

## Results

- Unit: PASS, 13 tests.
- Coverage: PASS, statements 89.44%, branches 73.61%, functions 100%, lines 89.44%.
- CLI smoke: PASS, exit 0.
- Empty rollback evidence warning: PASS, exit 0 + warning.
