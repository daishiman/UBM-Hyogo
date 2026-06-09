# issue-1137 production runtime smoke same-cycle implementation

## Lesson

Implementation target が明確な runtime smoke 拡張は、仕様書作成だけで閉じず同一 cycle で runner / SQL fixture / CI job / local stub test / Phase 11 evidence ledger まで反映する。

## Applied Case

- Workflow: `docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/`
- State: `implemented_local_runtime_pending / implementation / NON_VISUAL`
- Local evidence: `runtime-tag-bulk.test.sh` PASS、`production-runtime-smoke.yml` actionlint PASS
- User-gated boundary: production real D1 seed / mutation / cleanup evidence、commit、push、PR

## Rule

- `spec_created` は、実コード変更が技術的に不要な純仕様化か、ユーザーが明示的に実装を禁じた場合に限る。
- production write を伴う smoke では、local implementation と production runtime execution を分離する。local implementation は同一 cycle で完了し、production runtime evidence は user approval gate に残す。
