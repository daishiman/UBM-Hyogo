# task-03-followup-001-sentry-staging-runtime-evidence-001 - Sentry Web staging runtime evidence capture

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | task-03-followup-001-sentry-staging-runtime-evidence-001 |
| タスク名 | Sentry Web staging runtime evidence capture (AC-7 / AC-4 runtime) |
| 分類 | operations / observability / runtime evidence |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-12/main.md` (state: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`) |
| 発見日 | 2026-05-07 |
| 親タスク | task-03-w2-par-sentry-workers-sdk-unify |

## Why

task-03-w2-par-sentry-workers-sdk-unify は local implementation を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で閉じている。AC-7（staging deploy 後の RSC 200 + Sentry dashboard server/browser event 受信）と AC-4 の `.open-next/worker.js` への `requestIdleCallback` / `@sentry/nextjs` 混入 0 件を staging runtime で再確認する evidence は user approval 後の別 PR に分離されているため、未実施として明示しないと runtime PASS の主張が誤って拡大解釈される恐れがある。

## What

- `SENTRY_DSN_WEB`（web server DSN）を Cloudflare Secrets staging / production に投入する（`bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env {staging,production}`）。
- `apps/web/wrangler.toml` の `[vars]` に `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` が staging / production 共に設定済みかを `bash scripts/cf.sh` 経由で確認する。
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を実行し、`outputs/phase-11/evidence/staging-deploy.log` を取得する。
- `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/` および `/(public)/members` が `200` であることを `staging-curl.log` に記録する。
- staging 環境で意図的な server throw / browser throw を発火し、Sentry dashboard 上で server / browser 両方の event が tag `runtime=server|browser` 付きで受信されたスクリーンショット（`sentry-dashboard.png`）を取得する。
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` を再実行し、`apps/web/.open-next/worker.js` への `rg 'requestIdleCallback|@sentry/nextjs|replayIntegration|captureRouterTransitionStart'` が 0 件である最新ログを `grep-gate.log` に追記する。
- 状態語彙を `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に昇格し、index.md / phase-12/main.md / system-spec の state を更新する。

## 苦戦箇所【記入必須】

- `@sentry/cloudflare` と `@sentry/nextjs` の二重 init を `globalThis.__ubmSentryInitialized__` / `window.__ubmSentryInitialized__` の二系統ガードで管理しているため、staging runtime で「server / browser がそれぞれ 1 回ずつ init される」ことを Sentry dashboard 側で「同一 release の event が両 runtime tag で記録される」だけが唯一の客観 evidence になる。Cloudflare Worker のログでは init 回数を直接観測できず、Sentry dashboard screenshot を補助 evidence として固定する設計判断が必要。
- Cloudflare Workers ランタイムでは `process.env.SENTRY_DSN_WEB` が evaluate されず、`apps/web/src/lib/env.ts` の `getEnv()` 経由（Cloudflare runtime binding 優先 → `process.env` fallback）でしか DSN を読めない。staging 投入後に DSN 未設定を疑った場合は wrangler tail よりも先に `getEnv()` 取得経路の確認が早道、という知見を runbook に残す必要がある。
- Sentry SDK の dashboard 上の event は project が staging / production で混在しがちで、`SENTRY_ENVIRONMENT` tag フィルタを使わずに screenshot を取ると production event を staging evidence と誤認するリスクがある。screenshot には必ず `environment:staging` フィルタを適用する。

## スコープ

含む:
- Cloudflare Secrets `SENTRY_DSN_WEB` の staging / production 投入手順と evidence 取得
- staging deploy + curl + Sentry dashboard screenshot 取得
- `outputs/phase-11/evidence/{staging-deploy,staging-curl,sentry-dashboard,grep-gate}.log` 追記
- 状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` への昇格と index.md 更新

含まない:
- production deploy / cutover（別 release window）
- `apps/api` 側 Sentry 導入（別 workflow）
- Sentry release tag automation / performance monitoring tuning
- Slack / PagerDuty 連携

## リスクと対策

| リスク | 対策 |
|--------|------|
| `SENTRY_DSN_WEB` 実値が log / PR body / screenshot に混入 | screenshot は dashboard URL が DSN を含まないこと、`rg 'SENTRY_DSN.*https://[^[:space:]]+@[^[:space:]]+'` 0 件を確認 |
| staging event が production project に送信される | `SENTRY_ENVIRONMENT=staging` を `[vars]` に固定、Sentry project URL を 1Password で staging / production 分離 |
| 二重 init ガードが staging で破綻 | dashboard で同一 release の `runtime=server` / `runtime=browser` event がそれぞれ 1 件ずつ届くことを screenshot で示す |
| `.open-next/worker.js` への `@sentry/nextjs` 推移混入 | grep gate G-1b を CI gate 化する別タスクは scope out。本タスクでは local + staging build 双方で 0 件確認のみ |

## 検証方法

```bash
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  | tee docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-11/evidence/staging-deploy.log
curl -s -o /dev/null -w "GET / => %{http_code}\n" https://<staging>/ \
  | tee docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-11/evidence/staging-curl.log
curl -s -o /dev/null -w "GET /members => %{http_code}\n" https://<staging>/members \
  | tee -a docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-11/evidence/staging-curl.log
mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback|@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js
```

## 完了条件

- [ ] `SENTRY_DSN_WEB` が staging / production の Cloudflare Secrets に登録済み（`secret list` で確認）
- [ ] staging deploy log / curl log（`/` と `/members` 共に 200）が `outputs/phase-11/evidence/` に保存済み
- [ ] Sentry dashboard 上で `environment:staging` フィルタ適用下、server / browser それぞれ 1 件以上の event を確認した screenshot が `sentry-dashboard.png` として保存済み
- [ ] staging build の `.open-next/worker.js` で `requestIdleCallback` / `@sentry/nextjs` 推移混入 0 件
- [ ] `index.md` / `phase-12/main.md` / aiworkflow-requirements の state が `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に更新済み
- [ ] 実 DSN が repository / log / PR body に残っていないことを `rg` で確認済み

## 参照

- `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/index.md` (AC-1〜AC-9)
- `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/phase-11.md` (evidence マトリクス)
- `docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md` (関連: 一般 SENTRY_DSN 登録)
