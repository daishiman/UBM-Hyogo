# Phase 11 Script Execution Evidence

## Command

```bash
tmp=$(mktemp -d)
mkdir -p "$tmp/phase-11"
printf '# evidence\n' > "$tmp/phase-11/main.md"
printf 'rollback completed\ncommand: rollback\nresult: ok\ntime: 2026-05-05T00:10:00Z\n' > "$tmp/rollback.md"
mise exec -- pnpm postmortem:generate -- \
  --release v0.0.0 \
  --commit deadbee \
  --evidence "$tmp/phase-11" \
  --rollback-evidence "$tmp/rollback.md" \
  --occurred-at 2026-05-05T00:00:00Z \
  --detected-at 2026-05-05T00:05:00Z \
  --resolved-at 2026-05-05T00:20:00Z \
  --severity sev2
```

## Result

PASS: exit 0. Generated markdown contains `# Postmortem: v0.0.0`, `## メタ情報`, `## Timeline`, `## Impact`, `## Detection`, `## Response`, `## Root Cause`, `## Prevention`, and `## Follow-up Issues`.

Note: Node 24 emits `MODULE_TYPELESS_PACKAGE_JSON` for direct TypeScript execution. This is non-fatal. `tsx` was tested and rejected for this worktree because the installed esbuild host/binary versions are mismatched.
