# Phase 11 成果物 — 手動 smoke

## 概要

local / staging で 4 ルートを手動確認することが本 Phase の目的。2026-04-29 再検証では `apps/api` の `wrangler dev` が esbuild host / binary mismatch で起動不可だったため、04a public API と同じ response shape の local mock API（port 8787）を使って apps/web の curl / screenshot smoke を実施した。実 Workers + D1 の staging smoke は 08b / 09a へ引き継ぐ。

## 実行 evidence (自動)

| ID | 確認 | 期待 | 結果 | evidence |
| --- | --- | --- | --- | --- |
| AUTO-01 | `pnpm --filter @ubm-hyogo/web typecheck` | error 0 | PASS | `evidence/cmd/typecheck.log` |
| AUTO-02 | `pnpm vitest run` (URL zod test) | 10 passed | PASS | `evidence/cmd/vitest.log` |
| AUTO-03 | static grep S-01〜S-04 | 実コード 0 件（コメントのみ） | PASS | `evidence/cmd/static-checks.log` |

## 実行 evidence (local mock API + apps/web)

| ID | 確認 | 期待 | 結果 | evidence |
| --- | --- | --- | --- | --- |
| M-01 | `curl http://localhost:3000/` | 200 + Hero / Stats | PASS | `evidence/curl/home.html`, `evidence/screenshot/home.png` |
| M-02 | `curl "http://localhost:3000/members?q=hello&zone=0_to_1&density=dense"` | 200 + query 復元 | PASS | `evidence/curl/members-query.html`, `evidence/screenshot/members-query.png` |
| M-03 | ブラウザで `/members?tag=ai&tag=design` | filter 復元 | PASS (curl) | `evidence/curl/members-tags.html` |
| M-04 | `curl http://localhost:3000/members/UNKNOWN` | 404 | PASS | `evidence/curl/member-UNKNOWN.html` |
| M-05 | ブラウザで `/register` | 200 + responderUrl | PASS | `evidence/curl/register.html`, `evidence/screenshot/register.png` |
| M-06 | ブラウザで `/members/M001` | 200 + public profile | PASS | `evidence/curl/member-M001.html`, `evidence/screenshot/member-detail.png` |

## 未実施: 実 Workers + D1 smoke（M-XX）

| ID | 手順 | 期待 | 状態 |
| --- | --- | --- | --- |
| R-01 | `pnpm --filter @ubm-hyogo/api dev` + D1 local binding | 04a API 実体で 200 / 404 | 未実施（`wrangler dev` esbuild mismatch） |
| R-02 | staging smoke | 200 / 200 / 404 / 200 | 未実施（staging deploy 必要） |

実行手順は `outputs/phase-05/runbook.md` のステップ 7 を参照。実行時は `mise exec -- pnpm dev` で apps/api（port 8787）と apps/web（port 3000）を起動し、`PUBLIC_API_BASE_URL=http://localhost:8787` を設定する。

## 観測項目（dev server 起動時）

| 観測軸 | 確認方法 | 期待 | 状態 |
| --- | --- | --- | --- |
| Cache-Control | response header | route cache 設定を維持 | mock smoke で画面表示確認済 |
| `Set-Cookie` | response header | 0 件（公開層） | curl HTML で cookie 依存なし |
| Console log | DevTools | `window.UBM` 参照なし | 静的 grep で代替確認済 |
| Network panel | DevTools | apps/api への fetch のみ | 静的解析で `fetchPublic` 経由のみ確認済 |

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | local mock smoke (M-01〜M-06) | 完了 |
| 2 | real Workers/D1 smoke (R-01〜R-02) | 未実施（08b / 09a 引き継ぎ） |
| 3 | evidence 収集 | 完了 |
| 4 | 観測項目 | 一部完了 |

## 完了条件

- [x] local mock M-01〜M-06 が pass
- [x] evidence が phase-11/evidence/ に揃う（cmd / curl / screenshot）
- [x] 観測項目 4 軸: mock smoke + grep ベースは green

## 次 Phase 引き継ぎ

- 自動化済 evidence で typecheck / unit / static check は全て PASS
- local mock smoke は PASS
- real Workers/D1 smoke は `wrangler dev` mismatch 解消後、08b / 09a で実施する
