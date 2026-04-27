# Phase 11: 手動 smoke 実施結果

## 概要

| 項目 | 結果 |
| --- | --- |
| 実施日時 | 2026-04-27 |
| 実施者 | Claude Code (Opus 4.7) — feat/wt-7 worktree |
| typecheck | PASS（exit=0） |
| vitest（全パッケージ） | 130/130 PASS |
| ESLint boundary | PASS（exit=0） |
| Forms client mock | 12/12 PASS（auth 4 + backoff 4 + client 4） |
| consent normalize | 8/8 PASS |
| branded distinct | 10/10 PASS |

## evidence ファイル

| 種別 | パス |
| --- | --- |
| typecheck | `outputs/phase-11/typecheck.log` |
| vitest 全件 | `outputs/phase-11/vitest.log` |
| ESLint boundary | `outputs/phase-11/eslint-boundary.log` |
| Forms mock | `outputs/phase-11/forms-mock-run.log` |
| consent normalize | `outputs/phase-11/consent-normalize.log` |
| branded distinct | `outputs/phase-11/branded-distinct.log` |

## 実行コマンド

```bash
mise exec -- pnpm -r typecheck
mise exec -- pnpm exec vitest run                                     # 全パッケージ
mise exec -- pnpm exec vitest run packages/integrations/google/...    # Forms mock subset
mise exec -- pnpm exec vitest run packages/shared/src/utils/consent.test.ts
mise exec -- pnpm exec vitest run packages/shared/src/types/ids.test.ts
mise exec -- node scripts/lint-boundaries.mjs
```

> 備考: ルートの `pnpm test` スクリプトは `with-env.sh` 経由で `op run` を使うが、
> ローカル環境で 1Password CLI 認証タイムアウトが発生したため
> `pnpm exec vitest run` で直接呼び出した（テスト自体は環境変数を必要としない）。

## AC 充足

| AC | 検証コマンド / evidence | 結果 |
| --- | --- | --- |
| AC-1 | `pnpm -r typecheck` → `typecheck.log` | 0 error ✅ |
| AC-2 | `branded-distinct.log` の export 一覧 | 7/7 ✅ |
| AC-3 | `field.test.ts` 31 valid + 31 invalid → `vitest.log` | 62/62 ✅ |
| AC-4 | `viewmodel.test.ts` 11 ケース → `vitest.log` | 11/11 ✅ |
| AC-5 | `consent-normalize.log` | 8/8 ✅ |
| AC-6 | `MemberResponseZ` で `responseEmail` は system field（schema 内 0 件） — `vitest.log` | ✅ |
| AC-7 | `branded-distinct.log` distinct 1 ケース | ✅ |
| AC-8 | `forms-mock-run.log` auth + getForm + listResponses | 6/6 ✅ |
| AC-9 | `forms-mock-run.log` backoff 429 / 5xx | 4/4 ✅ |
| AC-10 | `eslint-boundary.log` exit=0 | ✅ |
