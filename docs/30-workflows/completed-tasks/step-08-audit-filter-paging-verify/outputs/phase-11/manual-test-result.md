# Phase 11 Manual Test Result

Status: `executed` (regression run 完了 / `verify_existing` / `NON_VISUAL`).
Executed at: 2026-05-24 (JST). Commit / push / PR は未実施（Gate-C は user 承認後）。

This workflow is `verify_existing / NON_VISUAL`; Phase 11 evidence is local regression command output, not screenshots or external runtime mutation.

## Executed commands

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web test          # Web unit/component (audit 含む)
mise exec -- pnpm --filter @ubm-hyogo/api test          # API unit (contract spec は exclude)
# contract spec は D1 config 配下のため別 lane で実行（下記 NOTE 参照）
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git diff dev...HEAD -- apps/
```

> **NOTE（仕様書 §3 の補正）**: ルート `vitest.config.ts` は `apps/api/src/routes/**/*.contract.spec.ts` を
> `exclude` しているため、`pnpm --filter @ubm-hyogo/api test`（unit lane）では `audit.contract.spec.ts` は実行されない。
> contract spec の回帰は `vitest.d1.config.ts`（D1 lane）で実行する必要がある。Phase 11 ではこの D1 lane を追加実行して
> AC-2 を充足させた。仕様書 §3 / Phase 4 の「Lane B = `pnpm --filter @ubm-hyogo/api test`」記述は unit lane のみを指すため、
> contract 回帰には D1 lane が必須である点を本 ledger に追記する（コード変更は不要、検証手順の補正のみ）。

## Result ledger

| Command | Status | 結果 | Evidence |
| --- | --- | --- | --- |
| Web regression（component+page, audit 含む） | ✅ PASS | `AuditLogPanel.component.spec.tsx` 39 tests / `audit/page.page.spec.ts` 2 tests を含む全 125 files・899 tests passed（1 skipped） | `outputs/phase-11/evidence/web-test.log` |
| API unit regression | ✅ PASS | 55 files・362 tests passed（contract spec は exclude のため不含） | `outputs/phase-11/evidence/api-test.log` |
| API contract regression（D1 lane） | ✅ PASS | `apps/api/src/routes/admin/audit.contract.spec.ts` 9 tests passed | `outputs/phase-11/evidence/api-audit-isolated.log` |
| Web targeted coverage | ✅ PASS | audit focused 41 tests passed。`AuditLogPanel.tsx` line 100 / branch 98.76、`audit-query.ts` line 100 / branch 100 | `outputs/phase-11/evidence/web-coverage.log` |
| API targeted coverage | ✅ PASS | D1 lane 9 tests passed。`audit.ts` line 96.48 / branch 87.23、`redact.ts` line 81.9 / branch 81.57 | `outputs/phase-11/evidence/api-coverage.log` |
| typecheck | ✅ PASS | 全 6 workspace project（contracts/shared/integrations/google/web/api）Done | `outputs/phase-11/evidence/typecheck.log` |
| lint | ✅ PASS | boundaries / deps（1643 modules）/ stablekey / eslint 全 OK | `outputs/phase-11/evidence/lint.log` |
| apps diff zero | ✅ PASS | `git status --short -- apps packages` と `git diff -- apps packages` が空（NFR-5 充足） | `outputs/phase-11/evidence/apps-diff-zero.log` |
| changed files scope | ✅ PASS | `apps/` `packages/` の差分なし（変更は workflow docs + aiworkflow-requirements 同一wave同期のみ） | `outputs/phase-11/evidence/changed-files.log` |

## AC 判定

| AC | 判定 | 根拠 |
| --- | --- | --- |
| AC-1（Web test PASS） | ✅ | `AuditLogPanel.component.spec.tsx` 39 + `page.page.spec.ts` 2 を含む全 PASS |
| AC-2（API contract PASS） | ✅ | `audit.contract.spec.ts` 9 tests PASS（D1 lane） |
| AC-3（typecheck/lint PASS） | ✅ | 両 lane exit 0 |
| AC-4（apps コード変更ゼロ） | ✅ | `git diff dev...HEAD -- apps/` 0 行 |
| AC-5（FR↔テスト coverage map） | ✅ | `phase-9-qa.md` の 1:1 map で未カバー監査主張ゼロ |
| AC-6（bonus scope-out 記録） | ✅ | `outputs/phase-12/unassigned-task-detection.md` に CSV/Saved/Real-time を core 外 bonus として記録 |

No commit, push, PR, deploy, D1 mutation, or external operation was performed as part of this Phase 11 evidence.
