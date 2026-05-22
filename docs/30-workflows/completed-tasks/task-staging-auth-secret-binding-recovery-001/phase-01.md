# Phase 1: 要件・真因確定

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 1 |
| feature name | task-staging-auth-secret-binding-recovery-001 |
| created date | 2026-05-22 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | `apps/api` auth middleware/env contract, runtime smoke runner, `scripts/cf.sh` secret put guard, aiworkflow/task-spec sync |

## artifacts.json metadata 確認

| key | value |
|---|---|
| `metadata.taskType` | `implementation` |
| `metadata.visualEvidence` | `NON_VISUAL` |
| `metadata.implementationCategory` | `bugfix` |
| `metadata.workflow_state` | `implemented_local_runtime_pending` |
| `metadata.canonical_root` | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001` |

## 1. インシデント要約

- 発生 job: `backend-ci → runtime smoke staging / smoke`（継続 fail）
- 失敗ライン: `request_json "admin-list" "$BASE/admin/members" "$STAGING_ADMIN_BEARER" '.members | type == "array"' '.members | length'`
- 出力: `FAIL: admin-list http=500 contract=.members | type == "array"`
- artifact `runtime-smoke-staging-26228634903 / runtime-smoke.log` 実 body:
  ```
  status=500
  body={"error":"auth misconfigured"}
  ```

## 2. 真因（確定済み・再調査不要）

`apps/api/src/middleware/require-admin.ts:104-107`:

```ts
const secret = c.env.AUTH_SECRET;
if (!secret) {
  return c.json({ error: "auth misconfigured" }, 500);
}
```

staging worker `ubm-hyogo-api-staging` のランタイムで `c.env.AUTH_SECRET` が **falsy**（undefined または空文字）。

- `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` は `AUTH_SECRET` を name として返す
- → secret **名は登録済み**だが、**値が空 / 別環境登録 / wrangler binding 不一致**のいずれか

## 3. PR #854 の誤診断

PR #854 (`fix(admin-members)`) は `apps/api/src/routes/admin/members.ts` ハンドラに defensive try/catch + body normalize を追加した。しかし auth middleware で 500 が返るため**ハンドラ自体に到達していない**。本仕様書では PR #854 の defensive 改修は維持価値ありとしつつ、根本対応ではなかったと位置付ける。

## 4. 影響範囲

- `requireAdmin` / `requireAuth` 経由の全 admin endpoint が staging で全滅
- `createMeSessionResolver()` 経由の `/me/*` も AUTH_SECRET 読込のため影響可能性あり（要 verify）
- production 側は未確認だが同 deploy path のため verify 必須

## 5. 既知事実

- `require-admin.ts` には `requireAdmin` / `requireAuth` の 2 export がある。両者とも先頭で `c.env.AUTH_SECRET` を読む
- `apps/api/src/env.ts` は interface 正本で、既存の全 env loader/zod schema は無い。今回 `AuthSecretEnvSchema` / `validateAuthSecretEnv()` を狭く追加する。
- `scripts/cf.sh` は `op run` + `mise exec` + `ESBUILD_BINARY_PATH` 解決ラッパー（既存）
- `scripts/smoke/runtime-attendance-provider.sh` は admin-list / admin-detail / admin-attendance / me-* を sequential に検証する shell（既存）
- `.github/workflows/backend-ci.yml` の `deploy-staging` job 後段に `runtime smoke staging / smoke` が定義されている（既存）

## 6. 未確定事項（user-gated / runtime-gated）

- [USER-GATED-01] 1Password vault の AUTH_SECRET 正本 path は実値を読まず、ユーザー承認後の `op read ... | bash scripts/cf.sh secret put ...` で確定する。
- [USER-GATED-02] production 側 `ubm-hyogo-api-production` の同一 drift は production bearer と runtime curl が必要なため user-gated evidence とする。
- [RUNTIME-GATED-01] `STAGING_ADMIN_BEARER` 値の有効期限は AUTH_SECRET fix 後の runtime curl で切り分ける。

## 7. Phase 1 DoD

- 真因が AUTH_SECRET binding falsy であることが確定文書化されている
- 4 spec の責務分割（A: recovery / B: 構造的予防 / C: CI gate / D: wrapper guard）が確定している
- OPEN-QUESTION が列挙されている
- 関連 file path が verify 済み（`apps/api/src/env.ts` 実在を確認）
