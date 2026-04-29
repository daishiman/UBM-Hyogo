# Phase 11 — 手動 smoke 結果

## 適用方針

`artifacts.json` の `ui_routes: []` に従い、本タスクは UI route を持たないため screenshot や callback URL の踏破は対象外。代わりに以下で smoke を構成する:

- API レベル契約 smoke (`auth-routes.test.ts` / `rate-limit-magic-link.test.ts` / `use-cases/auth/__tests__`) を vitest で実行
- AC-7 fs-check スクリプトで `/no-access` 不在 + D1 直参照不在を機械検証
- typecheck / lint / 全 test 再実行で全体回帰を確認

`wrangler dev` 起動 + curl 手動踏破は、上記契約 smoke が同等以上のシナリオ網羅 (Hono app に直接 fetch 注入) を実施するため代替する。

## 結果サマリ

| # | 検査 | 期待 | 実績 | evidence |
|---|---|---|---|---|
| M-01 | unregistered email | `{state:"unregistered"}` | PASS | `curl-unregistered.txt` |
| M-02 | rules!=consented | `{state:"rules_declined"}` | PASS | `curl-rules-declined.txt` |
| M-03 | isDeleted=true | `{state:"deleted"}` | PASS | `curl-deleted.txt` |
| M-04 | valid email | `{state:"sent"}` + token insert | PASS | `curl-sent.txt` |
| M-05 | token verify | SessionUser (memberId/responseId/isAdmin) | PASS | `callback-success.txt` |
| RL-01 | email 5 回超 | 6 回目 429 | PASS | `rate-limit.txt` |
| FS-01 | `/no-access` 不在 | route 不在 | PASS | `no-access-check.txt` |

## 自動チェック (回帰)

| gate | 結果 |
|---|---|
| `mise exec -- pnpm --filter @ubm-hyogo/api test` (auth/rate-limit 含む全 63 file) | **63 files / 347 tests pass** (33.75s) |
| `mise exec -- pnpm typecheck` | PASS (5/5 project) |
| `mise exec -- pnpm lint` | PASS |
| `bash apps/api/scripts/no-access-fs-check.sh` | PASS |

## 不変条件 cross-check

| # | 検証 |
|---|---|
| 2 | M-02 で rules_declined が出る (publicConsent/rulesConsent 命名遵守) |
| 4 | M-03 で deleted が出るが、UI 誘導は API レイヤでは行わない (proxy も状態をそのまま JSON 返却のみ) |
| 5 | API smoke は apps/api を直接叩いた。apps/web proxy は fetch を介すのみで D1 直アクセス無し (fs-check で機械検証) |
| 9 | FS-01 で `/no-access` 不在を機械検証 |
| 10 | RL-01 で email 5/h 制限が効く。MAIL_PROVIDER_KEY 未設定時は no-op sender → 502 `MAIL_FAILED` (issue-magic-link.test 参照) |

## 次 Phase 引き継ぎ

- smoke 結果を Phase 12 implementation-guide に「契約 smoke 結果」として反映
- 後続 06b (member-login) が UI route 実装時に curl/screenshot smoke を再実施する旨を unassigned-task-detection に転記
