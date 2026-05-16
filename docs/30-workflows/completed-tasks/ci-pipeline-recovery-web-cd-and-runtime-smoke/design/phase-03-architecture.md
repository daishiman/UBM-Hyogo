# Phase 03 — Architecture（統合設計・タスク間依存）

## 全体像

```
              push origin/dev (production: origin/main)
                        │
       ┌────────────────┴────────────────┐
       ▼                                  ▼
  web-cd workflow                   backend-ci workflow
  (.github/workflows/                (.github/workflows/
   web-cd.yml)                        backend-ci.yml)
       │                                  │
       │ task-01                          │ uses: runtime-smoke-staging.yml
       │ ┌─────────────────────┐          │   (secrets: inherit)
       │ │ pnpm install        │          ▼
       │ │ build:cloudflare    │     runtime smoke job
       │ │ → .open-next/       │     (.github/workflows/
       │ │ scripts/cf.sh deploy│       runtime-smoke-staging.yml)
       │ │   --env staging     │          │
       │ └─────────────────────┘          │ env: ${{ secrets.STAGING_* }}
       ▼                                  │      ← environment "staging-runtime-smoke"
  Cloudflare Workers                      │        ← task-02 で 5 件投入
  (ubm-hyogo-web-staging /                ▼
   ubm-hyogo-web)                    runtime-attendance-provider.sh staging
                                          │
                                          ▼
                                     ci-evidence/summary.json
                                          │
                                          ▼
                                     ci-summary-post.sh
                                          │
                                          ▼
                                     Slack #incident
```

## task-01 設計（web-cd OpenNext Workers 移行）

### 変更ポイント

| step | before | after |
|------|--------|-------|
| build | `pnpm --filter @ubm-hyogo/web build` | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| deploy (staging) | `npx wrangler pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| deploy (production) | `npx wrangler pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` |
| auth | `cloudflare/wrangler-action@v3` の `apiToken` 入力 | `env: CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}` / `${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}`（`cf.sh` 互換 env 名に Workers token をマップ） |

### 残置

- `vars.CLOUDFLARE_ACCOUNT_ID` の export step は残す（`cf.sh` も `CLOUDFLARE_ACCOUNT_ID` を必要とする）
- `vars.CLOUDFLARE_PAGES_PROJECT` は今後 `apps/web/wrangler.toml` 内 `name` フィールドが正本となるため、参照を削除する（`cf.sh` は wrangler.toml の `[env.X]` から `name` を解決する）

### 補足

- `cloudflare/wrangler-action@v3` を残すと内部で別 wrangler バージョンが混入し ESBUILD バージョン不整合が再発する。CLAUDE.md の「`scripts/cf.sh` 経由のみ」ルールに合わせて action を撤去する。
- `.open-next/` は `.gitignore` 済み。CI 上で build job が生成する。

## task-02 設計（staging-runtime-smoke secrets 配置）

### 投入経路（runbook）

```bash
# 認証は op session が前提（実行者がローカルで `op signin` 済み）
for pair in \
  "STAGING_API_BASE:op://Cloudflare/UBM-Hyogo Staging/api-base-url" \
  "STAGING_ADMIN_BEARER:op://Cloudflare/UBM-Hyogo Staging/admin-bearer" \
  "STAGING_MEMBER_ID:op://Cloudflare/UBM-Hyogo Staging/member-id" \
  "STAGING_ME_BEARER:op://Cloudflare/UBM-Hyogo Staging/me-bearer" \
  "SLACK_WEBHOOK_INCIDENT:op://Cloudflare/UBM-Hyogo Shared/slack-webhook-incident"
do
  name="${pair%%:*}"
  ref="${pair#*:}"
  op read "$ref" \
    | gh secret set "$name" \
        --env staging-runtime-smoke \
        --repo daishiman/UBM-Hyogo \
        --body -
done
```

### staging marker check

`STAGING_API_BASE` の値が `*staging*` / `*-staging.workers.dev` を含むことを `op read` 直後に grep で確認（値そのものは標準出力に流さず、boolean のみ判定）。production URL を誤投入しないためのガード（`deployment-secrets-management.md` 規約）。

### workflow 側の guard 強化（任意・低リスク）

`runtime-smoke-staging.yml` の Slack 通知ステップに以下の guard を追加し、secrets 不在時の連鎖 fail を抑止する:

```yaml
- name: Post CI summary to Slack
  if: failure() && hashFiles('ci-evidence/summary.json') != ''
  env:
    SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
  run: bash scripts/smoke/ci-summary-post.sh ci-evidence
```

> ただし `:?` 必須チェック自体は維持する（CONST_007 と整合: graceful skip ではなく secrets 投入を本道とする。guard は二次的セーフティネット）。

## タスク間依存

- task-01 と task-02 は **完全独立**。並列実装可。
- 共通の前提条件は無し（両者とも既存 wrangler.toml / runbook 正本に依拠）。
- 統合検証は両 task が green になった後の単一 dev push で行う（Phase 11 evidence は task ごとに分離）。

## ロールバック方針

| task | rollback 手順 |
|------|---------------|
| task-01 | `git revert` で workflow 変更をリバート → Pages deploy に戻る（25 MiB エラー再発するので**回避策**ではなく緊急退避のみ） |
| task-02 | `gh secret delete <NAME> --env staging-runtime-smoke` で 5 件削除 → workflow は再び `:?` で fail（無害な失敗、本番影響なし） |

## 正本同期の責務

- task-01 完了時: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の `web-cd` セクション（存在すれば）を Workers deploy 表記に整合させる
- task-02 local 実装完了時: `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/task-02-staging-runtime-smoke-secrets-provisioning/index.md` の G1 手順を `scripts/smoke/provision-staging-secrets.sh` 参照へ同期し、実 secret 投入ステータスは user approval 後まで pending にする
