# manual smoke evidence 一覧

## 状態

実 evidence は **partial captured**。2026-04-29 のレビュー改善で local `/login` 5 状態 screenshot と `/profile` 未ログイン redirect curl を取得した。`/profile` ログイン後 screenshot と staging smoke は実 session / API fixture / staging deploy が必要なため pending。

## evidence path

| 種別 | パス | 用途 | 状態 |
| --- | --- | --- | --- |
| curl log | outputs/phase-11/evidence/curl/M-01.log | smoke 根拠 | captured |
| curl log | outputs/phase-11/evidence/curl/M-02.log | sent state | pending |
| curl log | outputs/phase-11/evidence/curl/M-03.log | unregistered | pending |
| curl log | outputs/phase-11/evidence/curl/M-04.log | rules_declined | pending |
| curl log | outputs/phase-11/evidence/curl/M-05.log | deleted | pending |
| curl log | outputs/phase-11/evidence/curl/M-06.log | input fallback | captured |
| curl log | outputs/phase-11/evidence/curl/M-07.log | profile redirect | captured |
| curl log | outputs/phase-11/evidence/curl/M-12.log | staging login | pending |
| curl log | outputs/phase-11/evidence/curl/M-13.log | staging profile redirect | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-01-input.png | input state | captured |
| screenshot | outputs/phase-11/evidence/screenshot/M-02-sent.png | sent Banner | captured |
| screenshot | outputs/phase-11/evidence/screenshot/M-03-unregistered.png | unregistered CTA | captured |
| screenshot | outputs/phase-11/evidence/screenshot/M-04-rules-declined.png | responderUrl CTA | captured |
| screenshot | outputs/phase-11/evidence/screenshot/M-05-deleted.png | deleted（form 不在） | captured |
| screenshot | outputs/phase-11/evidence/screenshot/M-08-profile.png | profile 全体 | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-09-no-form.png | DevTools form 検索 0 件 | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.png | edit query 無視 | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-11-magic-link-sent.png | Magic Link 送信後 | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-14-staging-profile.png | staging profile | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-15-edit-cta.png | Google Form 編集導線 | pending |
| screenshot | outputs/phase-11/evidence/screenshot/M-16-localstorage-ignored.png | localStorage 無視 | pending |

## 取得手順

1. `pnpm dev` で apps/web 起動
2. M-01〜M-11 を順次実行し、curl 出力を `outputs/phase-11/evidence/curl/` に保存
3. ブラウザで M-08〜M-11 を実行し screenshot を保存
4. staging deploy 後 M-12〜M-16 を実行
5. 全 evidence 取得後、本ドキュメントの状態欄を「pending」→「captured」に更新

## 不変条件 trace

| 不変条件 | evidence ID |
| --- | --- |
| #1 | M-08 |
| #2 | M-08 |
| #4 | M-09, M-10 |
| #5 | M-08（Network panel） |
| #6 | violation 試行（localStorage） |
| #7 | M-08 API レスポンス |
| #8 | M-11, M-16 |
| #9 | violation 試行（`/no-access` 404） |
| #10 | M-12, M-13 |
| #11 | M-09 |
