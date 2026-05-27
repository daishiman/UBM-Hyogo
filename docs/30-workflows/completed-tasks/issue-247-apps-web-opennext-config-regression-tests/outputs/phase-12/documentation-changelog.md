# Phase 12 — documentation changelog

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 2026-05-26

- `docs/30-workflows/issue-247-apps-web-opennext-config-regression-tests/` を新規作成（Phase 1-13 + artifacts.json + outputs strict 7）
- source unassigned: `docs/30-workflows/unassigned-task/UT-06-FU-A-open-next-config-regression-tests.md`（consumed source として記録、削除しない）
- 実装:
  - `apps/web/__tests__/opennext-config-regression.spec.ts` 追加
  - `.github/workflows/ci.yml` に OpenNext config regression guard step 追加
- aiworkflow-requirements skill 同期済み:
  - `indexes/quick-reference.md` issue-247 行追加
  - `indexes/resource-map.md` row 追加
  - `references/task-workflow-active.md` active 節追加
  - `references/workflow-issue-247-...-artifact-inventory.md` 新規 inventory
  - `references/deployment-cloudflare-opennext-workers.md` regression guard 節追加
  - `SKILL-changelog.md` / `changelog/20260526-issue-247-apps-web-opennext-config-regression-tests.md` / `LOGS/_legacy.md` / lessons 追加
- `topic-map.md` / `keywords.json` は生成索引として `pnpm indexes:rebuild` で同期する
- CLAUDE.md / `docs/00-getting-started-manual/specs/` への変更は不要

## coverage への影響

- 新規 test file のみ。production source 行追加 0 → coverage 比率影響なし
- `verify-coverage-exclude-ratio` 影響なし

## CI への影響

- vitest 1 spec / 4 it 追加
- `ci` job の Type check 後に focused guard step を追加
