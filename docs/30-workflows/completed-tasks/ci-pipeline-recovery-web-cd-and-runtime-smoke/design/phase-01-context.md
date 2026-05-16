# Phase 01 — Context（背景・現状）

## トリガー

PR #612（`fix/web-app-route-bundle-parse-fix`）merge 直後の Actions run #366。

| job | 結論 | annotation 数 |
|-----|------|---------------|
| `web-cd / deploy-staging` | failure (56s) | errors=2, warnings=1 |
| `backend-ci / runtime smoke staging / smoke` | failure (7s) | errors=2, warnings=6 |

## 事実 1: web-cd / deploy-staging

### 観測ログ

```
/opt/hostedtoolcache/node/24.14.1/x64/bin/npx wrangler pages deploy .next \
  --project-name=ubm-hyogo-web-staging --branch=dev

▲ [WARNING] Pages now has wrangler.toml support.
  We detected a configuration file at apps/web/wrangler.toml but it is missing the
  "pages_build_output_dir" field, required by Pages.

✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
  cache/webpack/client-production/0.pack is 93.8 MiB in size

Error: The process '/opt/hostedtoolcache/node/24.14.1/x64/bin/npx' failed with exit code 1
```

### コードベース実態（調査エージェント結果）

| ファイル | 観測値 |
|----------|--------|
| `.github/workflows/web-cd.yml` line 38 | `pnpm --filter @ubm-hyogo/web build` を呼ぶ（`build:cloudflare` ではない） |
| `.github/workflows/web-cd.yml` line 48 | `wrangler pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev` |
| `.github/workflows/web-cd.yml` line 85 | `wrangler pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main` |
| `apps/web/wrangler.toml` line 2 | `main = ".open-next/worker.js"`（**Workers 形式**） |
| `apps/web/wrangler.toml` lines 6-8 | `[assets]` で `.open-next/assets` を bind |
| `apps/web/wrangler.toml` lines 25-49 | `[env.staging]` / `[env.production]` を Workers 形式で定義 |
| `apps/web/package.json` line 7 | `"build": "NODE_ENV=production next build --webpack"`（→ `.next/`） |
| `apps/web/package.json` line 8 | `"build:cloudflare": "NODE_ENV=production opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs"`（→ `.open-next/`） |
| `apps/web/package.json` line 21 | `"@opennextjs/cloudflare": "1.19.4"` 依存あり |
| `apps/web/open-next.config.ts` | `defineCloudflareConfig()` + `buildCommand` 設定済 |
| `apps/web/next.config.ts` line 3 | `initOpenNextCloudflareForDev()` を init |

### 矛盾点

1. **wrangler.toml は Workers 形式**だが、CI workflow は **Pages deploy** を呼ぶ → `pages_build_output_dir` 不在 warning と「`.next/` deploy で 25 MiB 超過」が両立して観測される
2. CLAUDE.md は「`apps/web` is Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」「production build は OpenNext Workers 互換のため `next build --webpack` を正本（dev は Turbopack）」を明記
3. `docs/30-workflows/UT-GOV-006-web-deploy-target-canonical-sync.md` と `docs/30-workflows/ut-06-followup-A-opennext-workers-migration.md` で wrangler.toml は既に Workers 形式に移行済みだが、**workflow 側の置換が未完**

## 事実 2: backend-ci / runtime smoke staging / smoke

### 観測ログ

```
mkdir -p ci-evidence
bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary
env:
  STAGING_API_BASE:
  STAGING_ADMIN_BEARER:
  STAGING_MEMBER_ID:
  STAGING_ME_BEARER:
scripts/smoke/runtime-attendance-provider.sh: line 57: STAGING_API_BASE: STAGING_API_BASE is required
Error: Process completed with exit code 1.

# 後続ステップ
bash scripts/smoke/ci-summary-post.sh ci-evidence
summary.json not found at ci-evidence/summary.json
Error: Process completed with exit code 1.
```

### コードベース実態（調査エージェント結果）

| ファイル | 観測値 |
|----------|--------|
| `.github/workflows/runtime-smoke-staging.yml` line 23-46 | `environment: staging-runtime-smoke` 配下で `${{ secrets.STAGING_API_BASE }}` 等 5 件を env マッピング |
| `.github/workflows/backend-ci.yml` line 124-129 | reusable workflow `runtime-smoke-staging.yml` を `secrets: inherit` で呼び出し |
| `scripts/smoke/runtime-attendance-provider.sh` line 57-60 | `: "${STAGING_API_BASE:?...}"` 等 4 件の必須チェック（不在時 exit 2） |
| `scripts/smoke/runtime-attendance-provider.sh` line 47, 63 | `--ci-summary` で `$OUT_DIR/summary.json` を出力 |
| `scripts/smoke/ci-summary-post.sh` line 35-38 | `summary.json` 不在時にフォールバックなしで exit 1 |
| `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` | `{"total_count":0,"secrets":[]}`（**0 件**） |
| repository-scoped secrets | `STAGING_*` 4 種すべて未登録 |
| repository-scoped variables | `STAGING_*` 未登録 |

### 既存仕様

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` lines 150-167 が「Issue #571 staging runtime smoke 専用」セクションで `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT` を **`staging-runtime-smoke` environment-scoped secret** に配置する規約を正本化
- `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/task-02-staging-runtime-smoke-secrets-provisioning/index.md` lines 40-58 に `op read` → `gh secret set --env staging-runtime-smoke` の投入コマンド群（G1 承認待ち）

## 因果まとめ

```
[Task A]
  workflow が pages deploy を呼ぶ
    └─ build script が .next/ を生成
        └─ .next/cache/webpack/*.pack ≥ 25 MiB
            └─ Pages 上限 → ERROR

[Task B]
  environment "staging-runtime-smoke" 作成済 / secrets 0 件
    └─ workflow が空文字列を env 注入
        └─ runtime-attendance-provider.sh L57 :? で exit 2
            └─ summary.json 未生成
                └─ ci-summary-post.sh で「not found」→ ERROR
```
