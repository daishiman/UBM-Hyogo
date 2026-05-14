# Vitest Config Diff Summary - issue-623

## Summary

`vitest.config.ts` was collapsed from dual `{test,spec}` globs to `*.spec.{ts,tsx}` only.

## Evidence

- `evidence-bundle/ac-2-grep-include.txt`: no `{test,spec}` matches.
- `evidence-bundle/ac-3-grep-exclude.txt`: no `**/*.test.{ts,tsx}` coverage exclude remains.
- `evidence-bundle/ac-2-vitest-config-diff.txt`: raw diff.
