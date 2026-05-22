# Implementation Guide

## Part 1: 中学生レベル

会員サイトには「出席を取ってくる係」があります。このタスクは、その係がテスト用の本物に近い環境でちゃんと任命されているかを確認するための手順です。

もし係が任命されていないと、画面の裏側で静かに間違った答えを返すのではなく、はっきりエラーで止まります。このタスクでは、止まる仕組みがテストで守られていることと、テスト用環境で本当に出席情報を取れることを確認できるようにしました。

確認ログには合言葉やログイン情報を残しません。ログに保存する前に機械的に塗りつぶします。

### ことばの確認

| ことば | 意味 |
| --- | --- |
| runtime smoke | 本物に近い環境で、重要な道だけを短く動かして壊れていないか確認すること |
| staging | 本番の前に使うテスト用の環境 |
| attendanceProvider | 出席情報を取りに行く係 |
| redaction | 合言葉やログイン情報をログに残さないよう塗りつぶすこと |
| evidence | 後から確認できる証拠ログ |

### セルフチェック

| 質問 | 答え |
| --- | --- |
| 画面を変えたか | いいえ。API の確認手順だけです |
| 本番環境で実行するか | いいえ。staging だけです |
| パスワードをログに残すか | いいえ。保存前に塗りつぶします |
| 出席情報を書き換えるか | いいえ。GET の読み取りだけです |
| まだ残っていることは何か | staging 用の認証情報が提供された後に実 runtime smoke を実行することです |

## Part 2: 技術者レベル

Issue #371 の `c.var.attendanceProvider` middleware DI 移行に対して、staging Worker で read-only GET smoke を実行する。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` に限定し、paging endpoints は route-local provider path の availability contract として扱う。

Primary runtime checks:

| label | endpoint | jq contract | DI-bound |
| --- | --- | --- | --- |
| admin-list | `/admin/members` | `.members | type == "array"` | no |
| admin-detail | `/admin/members/:memberId` | `.attendance | type == "array"` | yes |
| admin-attendance | `/admin/members/:memberId/attendance` | `.records | type == "array"` | no |
| me-root | `/me/` | `.user.memberId | type == "string"` | no |
| me-profile | `/me/profile` | `.profile.attendance | type == "array"` | yes |
| me-attendance | `/me/attendance` | `.records | type == "array"` | no |

POST self-request routes are inventory-only because successful execution writes staging queue state.

Persistent runtime evidence must not include raw response bodies. The smoke log stores only label, status, jq contract, and count/type summary.
