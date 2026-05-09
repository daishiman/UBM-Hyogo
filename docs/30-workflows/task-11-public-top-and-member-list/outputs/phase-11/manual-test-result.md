# manual-test-result

| 項目 | 値 |
| --- | --- |
| phase | 11 |
| task | task-11-public-top-and-member-list |
| state | `IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| local PASS 5 点 | 揃い（typecheck / lint / test / build / grep-gate） |
| Playwright | discovery PASS（5 cases）/ runtime smoke PARTIAL |
| screenshot | home のみ取得・members 系 PENDING_RUNTIME_EVIDENCE |
| axe | PENDING_RUNTIME_EVIDENCE |

## ステータス採用根拠

- `apps/` 配下に diff あり（実装は採用）→ `spec_created` は不適。
- local PASS 5 点は揃うが、Playwright runtime の `members*.png` / `axe.json` 取得が未完了（local D1 API に `member_identities` seed が無く、members grid/list runtime state を screenshot で確定できない）→ `PASS` も不可。
- よって `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を採用。phase-12-documentation-guide.md L100 の「local-implementation + evidence-pending」分類に合致。

## PASS / FAIL / PENDING テーブル

| ID | 観点 | コマンド / evidence | 結果 |
| --- | --- | --- | --- |
| LOCAL-01 | typecheck | `pnpm --filter @ubm-hyogo/web typecheck` → `evidence/typecheck.log` | PASS |
| LOCAL-02 | lint | `pnpm --filter @ubm-hyogo/web lint` → `evidence/lint.log` | PASS |
| LOCAL-03 | unit test | `vitest run` 6 files / 29 tests → `evidence/test.log` | PASS |
| LOCAL-04 | build | `pnpm --filter @ubm-hyogo/web build` → `evidence/build.log` | PASS |
| LOCAL-05 | grep gate（HEX / arbitrary / D1 / Sentry / process.env / skip / revalidate） | `evidence/grep-gate.log` | PASS |
| E2E-01 | Playwright case discovery | `playwright test --list` → `evidence/e2e-list.log` | PASS（5 cases） |
| E2E-02 | TC-E-01 home rendering smoke | `evidence/e2e.log` + `home-screenshot.png` | PASS（home 限定） |
| E2E-03 | TC-E-02 members grid (`density=comfy`) | `members-comfy-screenshot.png` | PENDING_RUNTIME_EVIDENCE |
| E2E-04 | TC-E-03 members list (`density=list`) | `members-list-screenshot.png` | PENDING_RUNTIME_EVIDENCE |
| E2E-05 | TC-E-04 invalid density fallback | runtime fixture | PENDING_RUNTIME_EVIDENCE |
| E2E-06 | TC-E-05 empty state (`q=zzz_no_match_zzz`) | `members-empty-screenshot.png` | PENDING_RUNTIME_EVIDENCE |
| AXE-01 | axe critical=0（home） | `screenshot-axe.log` | PARTIAL（home のみ） |
| AXE-02 | axe critical=0（members 系） | `axe.json` | PENDING_RUNTIME_EVIDENCE |
| LINK-01 | `/` reachability | `home-curl.log` | PASS |
| LINK-02 | `/members` reachability | `api-curl.log` | PARTIAL（API 200 だが member_identities 不在で empty） |
| LINK-03 | `/members?density=list` | runtime navigation | PENDING_RUNTIME_EVIDENCE |
| LINK-04 | `/members?density=invalid` | runtime navigation | PENDING_RUNTIME_EVIDENCE |
| LINK-05 | `/members?q=zzz_no_match_zzz` | runtime navigation | PENDING_RUNTIME_EVIDENCE |

## PENDING_RUNTIME_EVIDENCE の詳細

- 原因: ローカル D1 binding の `member_identities` テーブルに seed データが無いため、`/members` が member rows を返さず、grid / list / empty / invalid-density の各 runtime state を screenshot で固定できない。mock public API での screenshot 試行も member grid/list state までは到達せず。
- 不足 artifact:
  - `outputs/phase-11/evidence/members-comfy-screenshot.png`
  - `outputs/phase-11/evidence/members-list-screenshot.png`
  - `outputs/phase-11/evidence/members-empty-screenshot.png`
  - `outputs/phase-11/evidence/axe.json`（members 系 critical=0 の確定）
  - `outputs/phase-11/evidence/coverage/e2e/coverage-summary.json`
- 解消経路: `member_identities` seed を持つ staging Workers（task-09a 隣接）または local D1 fixture を準備した上で同 spec を再走。再走時に `manual-test-result.md` のステータスを `PASS` へ昇格し、`IMPLEMENTED_LOCAL_RUNTIME_PENDING` を撤去する。
- 関連 follow-up: `outputs/phase-11/discovered-issues.md` の Issue#1 を参照。

## Phase 11 evidence ファイル一覧（取得済み）

```
outputs/phase-11/evidence/typecheck.log
outputs/phase-11/evidence/lint.log
outputs/phase-11/evidence/test.log
outputs/phase-11/evidence/build.log
outputs/phase-11/evidence/grep-gate.log
outputs/phase-11/evidence/e2e-list.log
outputs/phase-11/evidence/e2e.log
outputs/phase-11/evidence/api-curl.log
outputs/phase-11/evidence/home-curl.log
outputs/phase-11/evidence/home-screenshot.png
outputs/phase-11/evidence/screenshot-axe.log
outputs/phase-11/evidence/playwright-report/
```

## 結論

- 総合判定: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- commit / push / PR は user-gated。runtime evidence の再取得が完了するまで `PASS` を主張しない。
