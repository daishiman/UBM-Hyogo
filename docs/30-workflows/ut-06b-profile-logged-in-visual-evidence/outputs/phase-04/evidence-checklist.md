# Evidence Checklist

Canonical inventory is 10 Phase 11 evidence files: 6 screenshots, 3 DevTools txt files, and 1 parent evidence diff. Phase 11 metadata files (`screenshot-plan.json`, `manual-test-result.md`, `ui-sanity-visual-review.md`, `phase11-capture-metadata.json`) support the capture process but are not visual evidence.

| # | ファイル | 取得 | 内容 | hygiene |
| --- | --- | --- | --- | --- |
| 1 | M-08-profile.png | □ | logged-in 表示 | □ |
| 2 | M-09-no-form.png | □ | form 視覚的不在 | □ |
| 3 | M-09-no-form.devtools.txt | □ | `count: 0` | □ |
| 4 | M-10-edit-query-ignored.png | □ | `?edit=true` read-only | □ |
| 5 | M-10-edit-query-ignored.devtools.txt | □ | `count: 0` | □ |
| 6 | M-14-staging-profile.png | □ | staging logged-in | □ |
| 7 | M-15-edit-cta.png | □ | Google Form 編集導線 | □ |
| 8 | M-16-localstorage-ignored.png | □ | localStorage 改変無視 | □ |
| 9 | M-16-localstorage-ignored.devtools.txt | □ | sanitized localStorage / DOM 観測 | □ |
| 10 | manual-smoke-evidence-update.diff | □ | 6 行 captured 化 | □ |
