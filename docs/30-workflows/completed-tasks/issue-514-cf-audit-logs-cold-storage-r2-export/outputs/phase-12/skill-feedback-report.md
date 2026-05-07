# Skill Feedback Report

## テンプレート改善

| Item | Routing | Evidence |
| --- | --- | --- |
| Irreversible NON_VISUAL tasks need explicit migration-before-export examples | no-op current cycle | Existing G1-G4 rules are sufficient after this spec correction |
| Strict Phase 12 files must be materialized before PASS wording | no-op current cycle | This cycle created all 7 files |

## ワークフロー改善

| Item | Routing | Evidence |
| --- | --- | --- |
| Daily export cadence is required for a 26-29 day window | promote to workflow spec only | Reflected in index / Phase 1 / Phase 3 / Phase 5 / SSOT |
| Manifest table must precede first export | promote to workflow spec only | Reflected in Phase 13 G2 before G3-prod |

## ドキュメント改善

| Item | Routing | Evidence |
| --- | --- | --- |
| aiworkflow-requirements should expose Issue #514 from quick-reference/resource-map/task-workflow-active | promote to SSOT | Updated in this wave |
| Runtime evidence pending must not be treated as implementation complete | promote to workflow package | Root artifacts and Phase 11/12 use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
