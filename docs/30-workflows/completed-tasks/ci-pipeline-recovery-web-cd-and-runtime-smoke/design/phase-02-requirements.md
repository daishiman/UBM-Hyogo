# Phase 02 — Requirements（要件・スコープ・成功基準）

## 機能要件

### REQ-A1（task-01）
`push` to `dev` 後の `web-cd / deploy-staging` ジョブが、`.open-next/` 出力を Cloudflare Workers にデプロイし成功すること。`pages deploy` を呼ばないこと。

### REQ-A2（task-01）
`push` to `main` 後の `web-cd / deploy-production` ジョブが、同じく Workers production env にデプロイし成功すること。

### REQ-A3（task-01）
`apps/web/wrangler.toml` の `[env.staging]` / `[env.production]` 設定（既存）を改変しないこと。workflow 側のみ正本化する。

### REQ-B1（task-02）
GitHub environment `staging-runtime-smoke` に以下 5 件の environment-scoped secret が登録されていること（値は 1Password 正本から `op read` 経由で投入）:

| secret name | 1Password 参照 | 用途 |
|-------------|----------------|------|
| `STAGING_API_BASE` | `op://Cloudflare/UBM-Hyogo Staging/api-base-url` | smoke 対象 origin |
| `STAGING_ADMIN_BEARER` | `op://Cloudflare/UBM-Hyogo Staging/admin-bearer` | admin 認証 |
| `STAGING_MEMBER_ID` | `op://Cloudflare/UBM-Hyogo Staging/member-id` | smoke 対象 member |
| `STAGING_ME_BEARER` | `op://Cloudflare/UBM-Hyogo Staging/me-bearer` | member 認証 |
| `SLACK_WEBHOOK_INCIDENT` | `op://Cloudflare/UBM-Hyogo Shared/slack-webhook-incident` | 失敗通知 |

> 1Password の vault / item / field 名はテストアカウントの実体を反映する。実装時に `op item list` で実 path を確認し、不一致なら仕様書を更新してから secret 投入する。

### REQ-B2（task-02）
`runtime-smoke-staging` ジョブが secrets 投入後の次の dev push で成功し、`ci-evidence/summary.json` が生成されること。

### REQ-B3（task-02）
secret 値・token fragment が一切 docs / logs / artifacts に出力されないこと（`gh secret set --body -` で stdin 注入する経路を強制）。

## 非機能要件

- **冪等性**: `gh secret set` を再実行しても上書きで成功する
- **再現性**: workflow の build step は `mise exec --` 経由で Node 24 / pnpm 10 を保証
- **観測性**: `web-cd` 成功後の Workers version id を `cf.sh deploy` の標準出力で記録
- **安全性**: secrets 投入 runbook は `pbpaste` / clipboard を経由しない（必ず `op read` の stdout を `gh` に直接 pipe）

## 不変条件（CONST_*）

| ID | 内容 |
|----|------|
| INV-001 | `apps/web/wrangler.toml` は変更しない（既に Workers 形式） |
| INV-002 | `apps/web/package.json` の `build:cloudflare` script は変更しない |
| INV-003 | secret 値を log / artifact / commit message に出力しない |
| INV-004 | `wrangler` を直接呼ばず `scripts/cf.sh` ラッパー経由で実行する（CI 含む） |
| INV-005 | environment `staging-runtime-smoke` の作成日時 (`2026-05-09T01:30:20Z`) を変更しない（既存 protection rule を温存） |
| INV-006 | `apps/web/src` 配下に `127.0.0.1:8888` 等のローカル限定エンドポイントを焼き込まない |
| INV-007 | secrets 投入は environment-scoped のみ。repository-scoped に置かない |

## スコープ境界

| 含む | 含まない |
|------|---------|
| `.github/workflows/web-cd.yml` の build/deploy step 書き換え | `apps/web/next.config.ts` の output 設定変更 |
| `.github/workflows/runtime-smoke-staging.yml` の guard 強化（任意） | `runtime-attendance-provider.sh` の `:?` 緩和（不在を黙殺しない方針を維持） |
| GitHub environment `staging-runtime-smoke` への secret 投入 runbook | repository-scoped secret への配置（INV-007 で禁止） |
| `cf.sh` 経由 deploy への切替 | `cf.sh` ラッパー実装の改修（既存実装で足りる） |

## 成功基準（Definition of Done — workflow 全体）

1. **task-01 DoD**:
   - `web-cd` workflow が `dev` push でグリーン
   - 直後に staging Workers の `version_metadata` から `tag = $GITHUB_SHA` が確認できる
   - `wrangler pages deploy` 文字列が `.github/workflows/web-cd.yml` から消えている（`grep -n 'pages deploy' .github/workflows/web-cd.yml` で 0 件）
2. **task-02 DoD**:
   - `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` の `total_count == 5`、name 一覧に上記 5 件すべて
   - 次の `runtime-smoke-staging` 実行が成功し、`ci-evidence/summary.json` artifact が download 可能
   - secret 値が secrets 一覧の `name`（フィールド）以外に出力されていない
3. **workflow 共通**:
   - 1 サイクル内完了。先送り・分割 PR なし
   - Phase 11 evidence が両 task で `outputs/phase-11/` に揃う
