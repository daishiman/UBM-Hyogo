# Link Checklist

| Link | Expected | Status |
| --- | --- | --- |
| `docs/30-workflows/_design/sync-jobs-spec.md` | exists and references TS runtime SSOT | PASS |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | exports enum / TTL / metrics schemas | PASS |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | references `_design/sync-jobs-spec.md` | PASS |
| 03a / 03b related specs | future sync wave must reference `_design/sync-jobs-spec.md`; completed historical specs remain history | PASS_WITH_HISTORY_BOUNDARY |
