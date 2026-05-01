# Evidence Naming

| ID | 環境 | ファイル | 観測対象 |
| --- | --- | --- | --- |
| M-08 | local | M-08-profile.png | logged-in `/profile` 表示 |
| M-09 | local | M-09-no-form.png | read-only 画面 |
| M-09 | local | M-09-no-form.devtools.txt | DOM count 0 |
| M-10 | local | M-10-edit-query-ignored.png | `/profile?edit=true` read-only |
| M-10 | local | M-10-edit-query-ignored.devtools.txt | DOM count 0 |
| M-14 | staging | M-14-staging-profile.png | staging logged-in 表示 |
| M-15 | staging | M-15-edit-cta.png | Google Form 編集導線 |
| M-16 | staging | M-16-localstorage-ignored.png | localStorage 改変無視 |
| M-16 | staging | M-16-localstorage-ignored.devtools.txt | sanitized localStorage / DOM 観測 |
| diff | parent | manual-smoke-evidence-update.diff | 6 行 `pending` から `captured` |

DevTools txt は `outputs/phase-11/evidence/screenshot/`、diff は `outputs/phase-11/evidence/` に保存する。M-15/M-16 の png 名は親 06b `manual-smoke-evidence.md` と一致させる。
