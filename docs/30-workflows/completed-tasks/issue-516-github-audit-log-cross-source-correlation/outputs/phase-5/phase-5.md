# Phase 5 出力: コア実装サマリ

## 実装ファイル
- `apps/api/src/audit-correlation/types.ts` — 型定義
- `apps/api/src/audit-correlation/errors.ts` — `AuditFetchAuthError` / `FingerprintInputEmptyError` / `AuditFetchRateLimitError`
- `apps/api/src/audit-correlation/redact.ts` — normalize / truncate / bucket / `computeFingerprint` / `redactGitHub` / `redactCloudflare`
- `apps/api/src/audit-correlation/github-fetch.ts` — pagination + 401/429 handling
- `apps/api/src/audit-correlation/correlate.ts` — timeline merge + severity 判定
- `apps/api/src/audit-correlation/index.ts` — barrel export
- `apps/api/src/audit-correlation/__tests__/*.test.ts` — vitest 4 ファイル

## 設計判断
- **`exactOptionalPropertyTypes`** が有効なため、optional プロパティに明示的に `| undefined` を付与し、`normalizeEmail` の戻り値は条件付き spread で組み立てる。
- **msw 不採用**: 本リポジトリに msw は未導入。`vi.fn()` で `fetch` をスタブし、`fetchImpl` 注入で test 駆動可能にした（pure DI）。
- **PAT は error message に含めない**: `AuditFetchAuthError` は `status` のみ。test で `ghp_DUMMY` が message に含まれないことを assert。
- **severity HIGH 判定**: GitHub `org.update_member` 系 + Cloudflare `login_fail`/`token_rotate`/`member_role_change` 系を permission change として扱い、`ipPrefix` セットの size >= 2 を「IP prefix 変化」とみなす。

## 実行結果
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: clean
- `mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation`: 全 vitest pass (Test Files 123 passed / 834 tests)
- 内訳: redact.test.ts (11) / correlate.test.ts (6) / github-fetch.test.ts (4) / contract.test.ts (5)

## 既知の限界
- live GitHub `/orgs/{org}/audit-log` 取得は本タスクでは実行しない（fixture-only MVP）。
- D1 永続化なし（stateless）。
- branch protection 必須化は別タスク（Phase 12 で unassigned-task として記録）。
