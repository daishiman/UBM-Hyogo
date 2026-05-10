# Phase 11 — Evidence (NON_VISUAL 縮約)

`visualEvidence=NON_VISUAL` のため screenshot 対象外。phase-11.md §1 の 7 項目を全件取得。

## evidence 一覧

| # | path | 結果 |
|---|------|-----|
| 1 | `evidence/typecheck.log` | exit 0 |
| 2 | `evidence/lint.log` | exit 0 |
| 3 | `evidence/e2e-run.log` | `6 passed (20.7s)` / desktop-chromium project |
| 4 | `evidence/e2e-skip-count.txt` | `0` |
| 5 | `evidence/grep-gate.log` | G1-G4 全て 0 hit、`wc -l = 207`（200-240 範囲内） |
| 6 | `evidence/build.log` | exit 0（OpenNext Workers build 成功） |
| 7 | `evidence/runner-version.txt` | `Version 1.59.1` |
| 8 | `evidence/shared-schema-test.log` | `16 passed / 177 tests passed`（identity-conflict strict schema 含む） |

## 評価項目（phase-11.md §4）

- [x] typecheck.log 終了コード 0
- [x] lint.log 終了コード 0
- [x] e2e-run.log で `6 passed, 0 skipped, 0 failed`（desktop-chromium）
- [x] e2e-skip-count.txt が `0`
- [x] build.log 終了コード 0
- [x] grep-gate.log で G1/G2/G3/G4 全 0 hit
- [x] `wc -l` が 200-240 範囲内（207）
- [x] shared schema strict 化の focused test が PASS

## boundary state

→ `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

ローカル PASS 5 点（typecheck / lint / e2e（chromium 限定）/ build / grep gate）取得済み。
desktop-firefox / mobile-webkit project の runtime PASS は CI runtime（GitHub Actions）で確認する。CI PASS 後に `completed` へ昇格。

## 備考

- 初期一覧 GET は server-side fetch のため `apps/web/src/lib/admin/server-fetch.ts` に inline fixture を追加（`PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` gate）。`ListIdentityConflictsResponseZ.parse()` で fixture drift を検出する。
- `apps/web/playwright.config.ts` に `isAdminIdentityConflictsRun` 判定を追加し、当該 spec 単体実行時のみ env を webServer に注入し、Playwright report を 2b の evidence path に出力する。
- merge / dismiss は browser `page.route()` で `**/api/admin/identity-conflicts/*/{merge,dismiss}` を捕捉し、shared `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` で `parse()` 通過必須。
- refresh 境界 test では `**/api/admin/members/*` への明示 fetch が 0 回であることを検証。
