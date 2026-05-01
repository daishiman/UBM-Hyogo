# Phase 11 main — evidence 取得 (NON_VISUAL)

## 目的

Phase 11 runbook（`phase-11.md`）に従い、4 種 + secret hygiene の log evidence を取得し AC-3 / AC-5 / AC-6 / AC-7 の充足を確証する。

## 取得サマリ

| # | evidence | 取得済み | 結果 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | evidence/typecheck.log | ☑ | PASS (exit 0) | `mise exec -- pnpm typecheck` 全 5 workspace done |
| 2 | evidence/lint.log | ☑ | PASS (exit 0) | `mise exec -- pnpm lint` 全 5 workspace done + boundary lint clean |
| 3 | evidence/test.log | ☑ | 486 PASS / 2 FAIL | 失敗 2 件は `schemaDiffQueue.test.ts` の **pre-existing**（`git stash` で main 同等状態を再現して同じ失敗を観測）。本タスク差分由来ではない |
| 4 | evidence/boundary-lint-negative.log | ☑ | PASS | `apps/web` 配下に `import type { Env } from "../../api/src/env"` を含む temporary probe を置くと `scripts/lint-boundaries.mjs` が relative path 解決で exit=1。probe 削除で exit=0 復帰 |
| 5 | evidence/secret-hygiene.log | ☑ | PASS | `grep -iE '(token|secret|hmac|bearer|client_secret)' apps/api/src/env.ts` の hit はすべて field 名・コメント・予約欄のみ。実値ゼロ |
| 6 | evidence/file-existence.log | ☑ | PASS | `apps/api/src/env.ts` / `_shared/db.ts` / boundary lint script / implementation guide の存在を確認 |
| 7 | evidence/binding-mapping-check.log | ☑ | PASS | `wrangler.toml` と `Env` の対応を確認。`SHEET_ID` を `Env` に追加し deployed config との drift を解消 |
| 8 | evidence/guide-diff.txt | ☑ | PASS | 02c guide / 08-free-database / Phase 12 guide の反映先を記録 |
| 9 | focused regression | ☑ | PASS | `pnpm exec vitest run scripts/lint-boundaries.test.ts apps/api/src/env.test.ts` = 4 tests PASS |

## observation note

| 項目 | 値 |
| --- | --- |
| 取得時刻 | 2026-05-01 |
| Node / pnpm version | Node 24.15.0 / pnpm 10.33.2（`mise exec --` 経由） |
| AC-3 充足 | ☑ `_shared/db.ts` の `ctx()` を `Pick<Env, "DB">` に refactor。typecheck pass。02c repository 関連 unit test は全 pass（失敗 2 件は別系統） |
| AC-5 充足 | ☑ negative test で boundary lint 違反検知を確認 |
| AC-6 充足 | ☑ typecheck / lint pass。test は本タスク差分以外の pre-existing 失敗のみ |
| AC-7 充足 | ☑ secret hygiene grep で実値混入なし |
| anomaly | `schemaDiffQueue.test.ts` 2 件失敗（pre-existing、別 issue 案件）。AC-6 は「本タスク対象 gate は PASS、full api test は既存失敗あり」として扱う |

## 補助 evidence

- `evidence/typecheck.log` / `evidence/lint.log` / `evidence/test.log` / `evidence/boundary-lint-negative.log` / `evidence/secret-hygiene.log`
- `evidence/file-existence.log` / `evidence/binding-mapping-check.log` / `evidence/guide-diff.txt`

## 次 Phase

Phase 12 close-out へ。
