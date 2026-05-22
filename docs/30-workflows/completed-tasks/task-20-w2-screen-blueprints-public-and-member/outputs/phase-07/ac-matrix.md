# AC マトリクス

| AC | 内容 | 検証 | evidence | 不変条件 | 結果 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 09e 新規作成（公開 6 画面 + §99） | `wc -l` 実体確認 + 章数 grep | `phase-11/evidence/wc-lines.log` | — | PASS |
| AC-2 | 09f 新規作成（会員 2 画面 + §99） | `wc -l` 実体確認 + 章数 grep | 同上 | — | PASS |
| AC-3 | 09e §数 = 7 | `grep -cE '^## [0-9]+\. '` | `phase-11/evidence/grep-section-count.log` | — | PASS |
| AC-4 | 09f §数 = 3 | 同上 | 同上 | — | PASS |
| AC-5 | 全 8 画面で実装に必要な 7 以上の節が揃う | `grep '### [0-9]+\.[1-7] '` + 節タイトル review | `phase-11/evidence/grep-section-count.log` | — | PASS |
| AC-6 | login 5+1 状態 mermaid 列挙 | `grep` 6 状態語 | `phase-11/evidence/grep-copy-text.log` | — | PASS |
| AC-7 | profile 4 領域網羅 | `grep` banner / summary / request / delete | 同上 | — | PASS |
| AC-8 | register / privacy / terms 派生ルール正本転記 | 目視 + grep | 同上 | #1 #7 | PASS |
| AC-9 | 視覚値 0 件（fenced jsx 除外） | `grep` visual literal | `phase-11/evidence/grep-visual-values.log` | #6 | PASS |
| AC-10 | §X.4 と現行 API 正本一致 | API trace check（apps/api + apps/web BFF + aiworkflow-requirements） | `phase-11/evidence/grep-api-trace.log` | #5 | PASS |
| AC-11 | 不変条件反映 | `publicConsent` / `rulesConsent` / `responseEmail` grep | 同上 | #2 #3 #5 | PASS |
| AC-12 | markdown validation | lint runner なしのため JSON parse + grep gates で代替 | `phase-11/evidence/markdown-lint.log` | — | PASS_WITH_SUBSTITUTION |
| AC-13 | 09b/09c/09d/09a link 全 §X.7 | grep | `phase-11/link-checklist.md` | — | PASS |
