# outputs phase 08: ut-web-cov-01-admin-components-coverage

- status: completed
- purpose: DRY 化
- decision: `apps/web/test-utils/admin/` は作成しない。対象 component ごとの mock / fixture 差が大きく、共通 helper 化は今回の coverage hardening では抽象化過多になるため、各 test file 内の局所 fixture と mock reset に留める。
- evidence: runtime evidence is captured in outputs/phase-11/vitest-run.log and outputs/phase-11/coverage-target-files.txt.
