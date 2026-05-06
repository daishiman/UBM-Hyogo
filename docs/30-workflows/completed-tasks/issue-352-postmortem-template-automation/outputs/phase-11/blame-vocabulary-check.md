# Phase 11 Blame Vocabulary Check

## Command

```bash
rg -n -i "\b(owner|responsible|blame|fault)\b|責任|誰が悪い" docs/30-workflows/runbooks/postmortem scripts/postmortem/generate-postmortem.ts
```

## Result

PASS: 0 hits.

The grep target is the generated-template/runtime surface. Test files and workflow review documents intentionally contain forbidden terms to assert the guard.
