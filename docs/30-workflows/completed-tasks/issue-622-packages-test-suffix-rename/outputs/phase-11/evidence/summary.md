# Phase 11 — Evidence サマリ

実行日: 2026-05-11
ブランチ: docs/issue-622-packages-test-suffix-rename-spec

## AC 検証結果

| AC | 内容 | 結果 |
| --- | --- | --- |
| AC-1 | `packages/shared/ADR-test-suffix.md` Accepted | PASS（新規作成） |
| AC-2 | `packages/integrations/ADR-test-suffix.md` Accepted | PASS（新規作成） |
| AC-3 | `find packages -name '*.test.ts'` = 0 | PASS（find-test-ts.log） |
| AC-4 | `find packages -name '*.spec.ts'` = 28 | PASS（find-spec-ts.log） |
| AC-5 | `pnpm typecheck` PASS | PASS（typecheck.log） |
| AC-6 | `pnpm lint` PASS | PASS（lint.log） |
| AC-7 | packages 全 test PASS、件数一致 | PARTIAL（shared 195, integrations 58, integrations/google 56 は PASS。root `pnpm -r test` は追加取得したが apps/api `/me` hook timeout 1 件で non-zero） |
| AC-8 | `git mv` 履歴連続性 | PASS（`git status` Rxx で 28 件 rename 認識、old-path `git log --follow` evidence 取得） |
| AC-9 | `rg "packages.*\.test\."` | PASS（ADR 内 historical / invariant 言及および apps/api/tsconfig.build.json の intentional exclude glob のみ。実行対象・import stale ref は 0） |
| AC-10 | PR 本文 `Closes #622` / `Refs #325, #621, #623` | PASS（phase-13.md template に反映） |
| AC-11 | rename-mapping.csv 28 行 + header | PASS（既存 phase-05/rename-mapping.csv） |

## 追加変更（rename 整合性のための glob 同期）

- `apps/api/tsconfig.build.json`: exclude に `../../packages/**/*.spec.ts` を追加（既存 `*.test.ts` exclude と並走）。`{test,spec}` 単一収斂は #623 / followup-003 担当。

## テスト件数 baseline vs after

| package | tests |
| --- | --- |
| @ubm-hyogo/shared | 195 PASS |
| @ubm-hyogo/integrations | 58 PASS |
| @ubm-hyogo/integrations-google | 56 PASS |

root `pnpm -r test` は apps/api `apps/api/src/routes/me/index.contract.spec.ts > GET /me > AC-1` の hook timeout 1 件で failed。packages の rename と無関係であり、rename 対象 package tests は full workspace run と focused run の両方で PASS。
