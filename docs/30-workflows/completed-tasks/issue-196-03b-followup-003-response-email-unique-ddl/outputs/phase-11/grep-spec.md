# grep-spec.md

Status: `PASS`

Expected command:

```bash
grep -n "正本 UNIQUE" .claude/skills/aiworkflow-requirements/references/database-schema.md
```

Expected result: at least one hit confirming that the canonical UNIQUE location is `member_identities.response_email`.

Observed result:

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` records `member_responses.response_email` as non-UNIQUE history data.
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` records `member_identities.response_email` as the system-wide **正本 UNIQUE** location.
