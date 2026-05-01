# Phase 6: Failure Cases

| Failure | Detection | Mitigation |
| --- | --- | --- |
| fixtures appear in build artifact | artifact grep finds path or seed value | tighten build input boundary and check import graph |
| tests cannot load shared setup | focused Vitest failure | move test setup under test config include, not production build include |
| production source imports fixture | dependency boundary failure | replace import with production-safe factory or test-only helper |
| command drift | documented command does not exist | re-resolve package scripts and record actual command |
| false PASS from spec-created workflow | Phase 11 says runtime PASS without logs | mark runtime evidence pending |

## Completion

Failure handling prevents the spec from being mistaken for executed production evidence.
