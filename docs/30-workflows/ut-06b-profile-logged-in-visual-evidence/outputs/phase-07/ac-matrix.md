# AC Matrix

Status note: this matrix is a planned traceability matrix while `artifacts.json.metadata.workflow_state` is `spec_created`. Rows become PASS only after the referenced evidence files exist under `outputs/phase-11/evidence/`.

| AC | evidence | 不変条件 | failure case | verify |
| --- | --- | --- | --- | --- |
| AC-1 | M-08-profile.png | #4, #5 | F-1, F-2, F-9 | 取得 verify |
| AC-2 | M-09-no-form.png, M-09-no-form.devtools.txt | #8 | F-3 | 内容 verify |
| AC-3 | M-10-edit-query-ignored.png, M-10-edit-query-ignored.devtools.txt | #11 | F-3, F-8 | 内容 verify |
| AC-4 | M-14-staging-profile.png, M-15-edit-cta.png, M-16-localstorage-ignored.png, M-16-localstorage-ignored.devtools.txt | #4, #5, #8, #11 | F-4 | 取得 + 内容 verify |
| AC-5 | manual-smoke-evidence-update.diff | process | F-7 | diff verify |
| AC-6 | outputs/phase-11/main.md | #4, #5, #8, #11 | F-1〜F-10 | observation verify |
| AC-7 | runbook.md, grep result | process | F-5, F-10 | hygiene verify |
