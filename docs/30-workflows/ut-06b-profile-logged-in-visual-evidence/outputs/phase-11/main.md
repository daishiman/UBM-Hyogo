# Phase 11 Output: 手動 smoke

## observation note template

| evidence | UTC | env | invariant | result | note |
| --- | --- | --- | --- | --- | --- |
| M-08-profile.png | TBD | local | #4/#5 | TBD | logged-in profile |
| M-09-no-form.devtools.txt | TBD | local | #8 | TBD | count 0 |
| M-10-edit-query-ignored.devtools.txt | TBD | local | #11 | TBD | count 0 |
| M-14-staging-profile.png | TBD | staging | #4/#5 | TBD | logged-in profile |
| M-15-edit-cta.png | TBD | staging | #11 | TBD | Google Form edit CTA |
| M-16-localstorage-ignored.devtools.txt | TBD | staging | #8 | TBD | sanitized localStorage ignored |

実 screenshot / devtools txt はこの Phase の実行時に保存する。仕様作成時点では placeholder evidence を置かない。

## canonical evidence inventory

Phase 11 visual evidence is exactly 10 files when captured:

- 6 screenshots: `M-08-profile.png`, `M-09-no-form.png`, `M-10-edit-query-ignored.png`, `M-14-staging-profile.png`, `M-15-edit-cta.png`, `M-16-localstorage-ignored.png`
- 3 DevTools txt files: `M-09-no-form.devtools.txt`, `M-10-edit-query-ignored.devtools.txt`, `M-16-localstorage-ignored.devtools.txt`
- 1 parent evidence diff: `manual-smoke-evidence-update.diff`

The four Phase 11 support files in this directory are metadata / run records, not captured visual evidence.
