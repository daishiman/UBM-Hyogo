# Phase 10: 失敗時の再実行条件整理 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 10 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution / runbook） |
| user_approval_required | false |

## 目的

Phase 5–9 のいずれかで失敗が起きた場合の再実行条件・recover 手順を 1 表に集約する。`outputs/phase-10/main.md` を「障害ハンドブック」として書き残す。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 5–9 の実行結果 |
| 出力 | `outputs/phase-10/main.md`（再実行表） |

## 失敗パターン × recover 表

| # | 失敗パターン | 検出 phase | 検出方法 | recover 手順 | 再実行 phase |
| --- | --- | --- | --- | --- | --- |
| 1 | wrapper exit 1（baseURL guard reject） | 5 | wrapper stderr | Phase 1 で承認した base URL を確認・再指定。production URL なら停止 | 5 |
| 2 | wrapper exit 4（storageState not found） | 5 | wrapper stderr | Phase 5.1 を実行（`playwright codegen --save-storage`） | 5 |
| 3 | Playwright auth 失敗（401 / 403） | 5 | spec の `expect` 失敗 / spec が `/login` に redirect | storageState 期限切れ。Phase 5.1 を実行 | 5 |
| 4 | Playwright timeout（network 起因） | 5 | `Timeout 30000ms exceeded` | target サーバの起動確認 / 再 `playwright test` 単発実行 / `--timeout=60000` で延長検討（spec 改修不可なので wrapper 再実行のみ） | 5 |
| 5 | HTTP 5xx | 5 | spec stdout に 5xx | target サーバ側障害。10 分待機後再試行。3 回連続なら BLOCKED 記録 | 5 → 8 |
| 6 | DOM counts > 0（invariant 違反） | 6 / 7 | DOM dump JSON の counts 検査 | **invariant #4 違反**として処理を停止し、Phase 7 follow-up draft → Phase 12 unassigned-task-detection に起票。再取得で値が変わるならアプリ側障害なので別 Issue 起票 | 7 → 12（再実行なし） |
| 7 | redaction 漏洩 | 6 | 目視確認 | 当該 evidence を `rm`、当該 marker のみ Phase 5 を再実行 | 5 |
| 8 | screenshot 件数不足 | 6 | `ls` カウント | wrapper のログを確認しどの test ケースが skip / fail したか特定。spec 改修不可なので wrapper を再実行 | 5 |
| 9 | screenshot 解像度不足 / 真っ白 | 6 | sips による解像度・サイズ | viewport 指定確認、target サーバが正しくレンダリングしているか確認、再実行 | 5 |
| 10 | M-14 Magic Link が届かない | 8 | mailbox 未着 | SMTP 設定確認 / mailbox provider 連携確認。15 分待機しても未着なら BLOCKED | 8（取得試行のみ） |
| 11 | M-15 Google OAuth エラー | 8 | OAuth consent 画面 | OAuth client ID 設定確認、test account の Google Workspace 制限確認。回復不能なら BLOCKED | 8（取得試行のみ） |
| 12 | secret grep でヒット | 9 | grep | 該当箇所を redact、Phase 9 再実行（git stage 含む） | 9 |
| 13 | storageState が `git ls-files` に出る | 9 | `git ls-files` | `git rm --cached`、`.gitignore` 再確認、Phase 9 再実行 | 9 |
| 14 | Node / pnpm version mismatch | 3–5 | `node -v` / `pnpm -v` | `mise install` / `mise exec --` 経由で再実行 | 3 |

## 再実行回数のガイドライン

- 同一失敗パターンで **最大 3 回** までリトライ。3 回失敗したら BLOCKED として Phase 8 に記録し Phase 12 follow-up に格納する。
- 環境要因（HTTP 5xx、SMTP 未着）は時間を空けて 3 回実行。即時連続再試行ではない。
- invariant 違反（パターン 6）は **リトライしない**。即停止して escalation。

## storageState 期限切れの扱い

| 兆候 | 対処 |
| --- | --- |
| `playwright test` が `/login` へ redirect される | storageState を破棄し Phase 5.1 を再実行 |
| `/me` API 呼び出しが 401 | 同上 |
| Cookie の `expires` が現在時刻より過去 | 期限切れ。state.json を `rm` して codegen やり直し |

## 完了条件チェックリスト

- [ ] 14 パターンの recover 手順が `outputs/phase-10/main.md` に転記されている
- [ ] 各 phase で発生した実失敗が 1 件以上あれば、その row に「実発生 / recover 結果」が追記されている
- [ ] 3 回失敗した BLOCKED case が Phase 8 / 12 へ引き継がれている

## 次 Phase への引き渡し

Phase 11 へ「再実行ハンドブック」を引き渡す。Phase 11 は最終 runtime summary を Phase 11 outputs に保存する。
