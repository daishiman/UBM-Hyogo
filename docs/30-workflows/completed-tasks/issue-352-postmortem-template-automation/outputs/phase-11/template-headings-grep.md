# Phase 11 Template Headings Evidence

## Command

```bash
rg -n '^## ' docs/30-workflows/runbooks/postmortem/template.md
```

## Result

PASS.

```text
6:## メタ情報
20:## Timeline
31:## Impact
37:## Detection
43:## Response
49:## Root Cause
56:## Prevention
62:## Follow-up Issues
```

The shipped template is also covered by `scripts/postmortem/__tests__/generate-postmortem.test.ts`.
