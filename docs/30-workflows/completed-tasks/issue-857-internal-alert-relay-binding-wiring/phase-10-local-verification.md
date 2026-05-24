---
phase: 10
title: Local Verification
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 10: Local Verification — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. ローカル検証コマンド列

```bash
# 0. Node 24 環境確認
node -v   # v24.15.0 でなければ mise exec -- を前置

# 1. 依存整合
mise exec -- pnpm install

# 2. 型チェック
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. 対象テスト（config guard + contract fallback + 既存回帰）
mise exec -- pnpm --filter @ubm-hyogo/api test sheets-auth-healthcheck

# 5. wrangler TOML parse 確認（dry-run・実 deploy しない）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run

# 6. vars 配線の目視 grep
grep -n "API_INTERNAL_BASE_URL" apps/api/wrangler.toml   # 2 行（prod / staging）期待
```

## 2. 期待結果

| # | 期待 |
| --- | --- |
| 2 | 型エラー 0 |
| 3 | lint violation 0 |
| 4 | TC-01〜05 全 green |
| 5 | TOML parse 成功（dry-run が config を受理） |
| 6 | `[env.production.vars]` と `[env.staging.vars]` 各 1 行・計 2 行ヒット |

## 3. runtime 検証（deploy 後・user-gated）

> 実 deploy・secret list は user 承認後のみ実行。CLI は `scripts/cf.sh` 経由限定。

```bash
# Secret name presence（値は表示しない）
bash scripts/cf.sh secret list --env staging       # CF_WEBHOOK_AUTH_SECRET の name を確認
bash scripts/cf.sh secret list --env production

# 不在時のみ投入（1Password 正本値を op 参照で）
bash scripts/cf.sh secret put --env staging CF_WEBHOOK_AUTH_SECRET

# deploy 後 tail で no-op log の消失を確認
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# → Workers tail で event: "sheets.auth.alert_relay_skipped" が出ないこと
```

## 4. NON_VISUAL 宣言

本タスクは config / test 変更のみで UI/UX 変更がないため、Phase 11 のスクリーンショットは不要。証跡はコマンド出力（typecheck / lint / vitest / dry-run）と staging tail ログとする。
