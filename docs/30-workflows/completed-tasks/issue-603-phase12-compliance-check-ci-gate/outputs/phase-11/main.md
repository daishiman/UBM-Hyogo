# Phase 11 Evidence (NON_VISUAL)

## NON_VISUAL 縮約 3 点

1. 入出力契約: PR diff で変更された `docs/30-workflows/<root>/**` を列挙し、各 root の `outputs/phase-12/phase12-task-spec-compliance-check.md` が存在し canonical heading 9 項目を含むことを検査して exit 0/1/2 を返す
2. 観測点: stdout の JSON サマリ（`status` / `template` / `roots` / `results` / `reason`）と process exit code
3. 失敗時挙動: `verify-phase12-compliance` job が non-zero で fail し PR merge を block。緊急時は workflow disable または `continue-on-error: true`

## Evidence files

| Evidence | Path | Status |
| --- | --- | --- |
| typecheck log | `outputs/phase-11/evidence/typecheck.log` | PASS |
| lint log | `outputs/phase-11/evidence/lint.log` | PASS |
| focused test log | `outputs/phase-11/evidence/test.log` | PASS (6/6) |
| local verify run | `outputs/phase-11/evidence/local-verify.log` | PASS (status=pass, 1 root) |
| canonical headings parse | `outputs/phase-11/evidence/canonical-headings.json` | 9 items 1..9 |
| PR CI job log | `outputs/phase-11/evidence/ci-job.log` | user-gated (PR 作成後取得) |
