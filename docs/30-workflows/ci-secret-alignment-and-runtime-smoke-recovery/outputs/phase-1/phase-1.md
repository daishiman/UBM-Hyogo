# Phase 1: 現状分析と問題定義

## 観測された失敗 evidence

| run | job | エラー要点 |
|---|---|---|
| web-cd #374 | `deploy-staging` | `[cf.sh] 1Password CLI (op) が見つかりません` で `cf.sh deploy --config apps/web/wrangler.toml --env staging` が exit 1 |
| backend-ci #374 | `runtime smoke staging / smoke` | `scripts/smoke/runtime-attendance-provider.sh: line 57: STAGING_API_BASE: STAGING_API_BASE is required` で exit 1 |

両 run 共通: PR #648 (`fix/ci-pipeline-recovery-web-cd-runtime-smoke`) マージ直後の `dev` push。

## 根本原因（コード読解結果）

### 原因 A: web-cd secret 名の drift

- `.github/workflows/web-cd.yml:22` `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}`
- `.github/workflows/web-cd.yml:56` `CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}`
- 実 GitHub Environment 登録 (`gh api repos/.../environments/{staging,production}/secrets`):
  - `staging`: `CLOUDFLARE_API_TOKEN` のみ
  - `production`: `CLOUDFLARE_API_TOKEN` のみ
- 結果: `secrets.CF_TOKEN_WORKERS_STAGING` が undefined → env `CLOUDFLARE_API_TOKEN=""`
- `scripts/cf.sh:21-23`: `CLOUDFLARE_API_TOKEN` が空なので `CF_SH_SKIP_WITH_ENV=1` 分岐に入らない
- `scripts/cf.sh:30-33`: `op` 不在チェックで exit 1（CI runner には `op` が無い）

### 原因 B: staging-runtime-smoke env の secret 未登録

- `.github/workflows/runtime-smoke-staging.yml:28-31` が必要とする 4 値:
  - `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER`
- `gh api repos/.../environments/staging-runtime-smoke/secrets` 結果: **0 件**
- failure Slack 通知用の `SLACK_WEBHOOK_INCIDENT` も同 env では未登録（runtime-smoke-staging.yml:68 参照）
- 結果: env は空文字で渡り、`scripts/smoke/runtime-attendance-provider.sh:57` の必須 var validate で fail

## 利害関係者と判断軸

- **デプロイ経路は op 非依存にする**（ユーザー方針）。CF token は GitHub Environment Secret に直接保管する。
- **ローカル経路は op 経由を維持**（`CLAUDE.md` シークレット管理ルール、`.env` には実値を書かない）。
- secret 名の正本は GitHub Environment 側とし、workflow 側を実体に合わせる（運用上 secret 改名より workflow 改名の方がブラスト半径が小さい）。

## 影響範囲（参照グラフ）

```
.github/workflows/web-cd.yml
  └─ env CLOUDFLARE_API_TOKEN ─→ scripts/cf.sh ─→ wrangler deploy
.github/workflows/runtime-smoke-staging.yml
  └─ env STAGING_* ─→ scripts/smoke/runtime-attendance-provider.sh
backend-ci.yml:124-128 が runtime-smoke-staging.yml を workflow_call で呼ぶ
```

`web-cd.yml` 以外で `CF_TOKEN_WORKERS_*` を参照している箇所は無い（`grep -rn "CF_TOKEN_WORKERS" .github/`）。

## 解決方針サマリ

1. **task-01**: `web-cd.yml` の `secrets.CF_TOKEN_WORKERS_{STAGING,PRODUCTION}` を `secrets.CLOUDFLARE_API_TOKEN` に置換し、Environment 既存登録に整合させる。
2. **task-02**: `runtime-smoke-staging.yml` に readiness pre-check step を追加し、必須 secret 未登録時は早期 fail（明確なエラー文言）させる。並行して、`staging-runtime-smoke` env への secret 登録手順 runbook を `docs/` 内に整備する。secret 実値の登録は**ユーザー操作**として手順を提示する（AI が `gh secret set` で実値を投入することは禁止 — 値の正本は外部に存在）。
