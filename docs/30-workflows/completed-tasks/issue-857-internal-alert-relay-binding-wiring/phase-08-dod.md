---
phase: 8
title: Definition of Done
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 8: DoD — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. 完了条件チェックリスト

### コード / config

- [x] `apps/api/wrangler.toml` `[env.production.vars]` に `API_INTERNAL_BASE_URL = "https://api.ubm-hyogo.workers.dev"` がある
- [x] `apps/api/wrangler.toml` `[env.staging.vars]` に `API_INTERNAL_BASE_URL = "https://api-staging.ubm-hyogo.workers.dev"` がある
- [x] `apps/api/src/env.ts:109-112` のコメントが deploy-required + token 整合（`CF_WEBHOOK_AUTH_SECRET` 正本 / `INTERNAL_ALERT_TOKEN` 別値で 401）を明記している
- [x] 型行（`?: string`）は変更されていない

### テスト

- [x] `sheets-auth-healthcheck.binding.spec.ts` が新規作成され TC-01〜03 green
- [x] `sheets-auth-healthcheck.contract.spec.ts` に TC-04（`CF_WEBHOOK_AUTH_SECRET` fallback）が追加され green
- [x] 既存 5 ケース（TC-05）が回帰なし

### 検証

- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` pass
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api lint` pass
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test ...sheets-auth-healthcheck...` 全 green（58 files / 373 tests）
- [x] `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` が TOML parse を通過

### runtime（user-gated / deploy 後）

- [ ] `bash scripts/cf.sh secret list --env staging` / `--env production` に `CF_WEBHOOK_AUTH_SECRET` の name が存在（不在なら投入、user-gated）
- [ ] staging deploy 後の Workers tail で `event: "sheets.auth.alert_relay_skipped"` / `reason: "missing API_INTERNAL_BASE_URL or token"` が出なくなる（user-gated）
- [ ] staging で SA key を意図的に無効化した dry-run で alert-relay へ POST が到達する（親 UT-25-DERIV-02 Phase 11 と連携、user-gated）

### ドキュメント

- [x] aiworkflow-requirements ledgers に本 workflow の逆参照が追記されている
- [x] Phase 12 strict 7 成果物が揃っている

## 2. 受け入れ判定

上記コード / テスト / 検証セクションが全て埋まれば **実装完了（local）**。runtime セクションは deploy 後 user-gated で埋める。runtime 未完でも spec / 実装 / local test の完了をもって PR 可能（base=dev）。

## 3. issue #857 完了条件との対応

| issue #857 完了条件 | 本タスクでの扱い |
| --- | --- |
| `API_INTERNAL_BASE_URL` が 2 環境 vars に登録 | G-1 / G-2 で達成 |
| `INTERNAL_ALERT_TOKEN` を Secrets 投入 | **現コード最適化で除外**（401 誘発）。`CF_WEBHOOK_AUTH_SECRET` fallback を正本化（G-3 / G-5 / TC-04） |
| staging tail で no-op log 消失 | runtime DoD で確認 |
| env.ts と spec が deploy-required で整合 | G-3 で達成 |
| 親 runbook / index への逆参照 | G-7 / step-06 で達成 |
