# Phase 11 Rollback Evidence Warning

## Command

```bash
tmp=$(mktemp -d)
mkdir -p "$tmp/phase-11"
printf '# evidence\n' > "$tmp/phase-11/main.md"
: > "$tmp/empty-rollback.md"
mise exec -- pnpm postmortem:generate -- \
  --release v0.0.0 \
  --commit deadbee \
  --evidence "$tmp/phase-11" \
  --rollback-evidence "$tmp/empty-rollback.md" \
  --occurred-at 2026-05-05T00:00:00Z
```

## Result

PASS: exit 0 with warning.

```text
warning: rollback-evidence is empty: <path>
```

Missing rollback evidence files fail with exit 1; empty files warn but still generate the template so incident documentation can continue while the operator fills the evidence file.
