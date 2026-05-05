# Phase 11 coverage result

- status: PASS（precondition gate: test green + coverage-summary.json 生成 + guard exit 0）
- evidence type: NON_VISUAL
- 実測日: 2026-05-01

## 実行コマンドと結果

| 項目 | command | result |
| --- | --- | --- |
| apps/api 全 test | `cd apps/api && pnpm test` | Test Files 85 passed (85), Tests 523 passed (523) |
| apps/api coverage 生成 | `cd apps/api && pnpm test:coverage` | exit 0、`apps/api/coverage/coverage-summary.json` 生成 |
| coverage-guard | `bash scripts/coverage-guard.sh --no-run --package apps/api` | exit 0（threshold 80） |

## apps/api coverage summary（2026-05-01 実測）

| metric | value | precondition gate (>=80) | upgrade gate UT-08A-01 (>=85 / branches >=80) |
| --- | --- | --- | --- |
| Statements | 84.20% | PASS | NEEDS_HARDENING |
| Branches | 83.44% | PASS | PASS |
| Functions | 84.04% | PASS | NEEDS_HARDENING |
| Lines | 84.20% | PASS | NEEDS_HARDENING |

source: `apps/api/coverage/coverage-summary.json` total。

## 判定

- Precondition gate（80% 一律 + summary 生成 + guard exit 0）: **PASS**。
- Upgrade gate（Statements/Functions/Lines >=85%）: 未達。`ut-08a-01-public-use-case-coverage-hardening` の責務として委譲する（このタスクの scope out）。
- coverage early exit による summary 欠損は解消済み。

## 13 failure inventory 実測結果

| ID | test file / focus | 実測結果 | 修復分類 |
| --- | --- | --- | --- |
| F01 | sync-forms-responses.test.ts AC-4 | green | fixture drift |
| F02 | sync-forms-responses.test.ts AC-1 | green | fixture drift |
| F03 | sync-forms-responses.test.ts AC-5 | green | fixture drift |
| F04 | sync-forms-responses.test.ts AC-10 | green | fixture drift |
| F05 | schemaAliasAssign.test.ts question_not_found | green（先行修復済） | 不要 |
| F06 | tagQueueResolve.test.ts T1 confirmed | green（先行修復済） | 不要 |
| F07 | adminNotes.test.ts listByMemberId | green（先行修復済） | 不要 |
| F08 | admin/attendance.test.ts authz 401 | green（先行修復済） | 不要 |
| F09 | admin/audit.test.ts authz 401 | green（先行修復済） | 不要 |
| F10 | admin/schema.test.ts GET diff 401 | green（先行修復済） | 不要 |
| F11 | admin/tags-queue.test.ts session なし 401 | green（先行修復済） | 不要 |
| F12 | me/index.test.ts GET /me 401 | green（先行修復済） | 不要 |
| F13 | auth-routes.test.ts hookTimeout | green（先行修復済） | 不要 |

> 起票時 (2026-05-01) 13 件 failure のうち、F05-F13 は本ブランチ取込前の先行コミットで解消済み（再現せず）。F01-F04 のみ本タスクで修復した。
