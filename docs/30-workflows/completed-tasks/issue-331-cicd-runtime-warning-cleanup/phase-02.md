# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 2 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 変更対象ファイル

| パス | 変更種別 | サブタスク |
| --- | --- | --- |
| apps/api/wrangler.toml | 編集 | S1 |
| .github/workflows/web-cd.yml | 編集 | S2 |
| apps/web/wrangler.toml | 編集（最小） | S2（必要時のみ） |

## S1: apps/api/wrangler.toml の vars 整理

### 採用方針

**top-level `[vars]` を完全削除し、env-specific vars のみを正本とする。**

理由:
- top-level `[vars]` は env 配下に継承されない（wrangler 仕様）。production / staging は `[env.production.vars]` / `[env.staging.vars]` で完全充足している。
- local-dev は `wrangler dev` 起動時に `--env staging` を指定する運用に統一可能（あるいは `.dev.vars` で代替）。
- 残すと「現状値はどちらが正本か」の認知負荷が継続する。

### Before/After（top-level 抜粋）

**Before**:
```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
SHEET_ID = "..."
FORM_ID = "..."
GOOGLE_FORM_ID = "..."
SHEETS_SPREADSHEET_ID = "..."
SYNC_BATCH_SIZE = "100"
SYNC_MAX_RETRIES = "3"
SYNC_RANGE = "Form Responses 1!A1:ZZ10000"
RETENTION_PURGE_MODE = "dry-run"
TAG_QUEUE_PAUSED = "false"

[triggers]
crons = [...]

[[d1_databases]]
...
```

**After**:
```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

# top-level [vars] は env 配下に継承されないため削除。
# 各環境の vars は [env.production.vars] / [env.staging.vars] を参照。
# local-dev は `bash scripts/cf.sh dev --env staging` 推奨。

# 注: top-level [triggers] / [[d1_databases]] / [[analytics_engine_datasets]]
# も env 継承されないが、local 起動 (wrangler dev 単体) 経路で参照されるため
# env-specific 定義との二重メンテを継続する（warning 対象外）。
[triggers]
crons = [...]

[[d1_databases]]
...
```

### 残す top-level bindings（warning 対象外の根拠）

| ブロック | 残す/削除 | 根拠 |
| --- | --- | --- |
| `[triggers]` | 残す | local `wrangler dev` 経路で必要、wrangler は warning emit しない |
| `[[d1_databases]]` | 残す | local 経路で binding 解決、env 重複 warning なし |
| `[[analytics_engine_datasets]]` | 残す | 同上 |
| `[[queues.*]]` | 既にコメントアウト | 未変更 |
| `[[r2_buckets]]` | 元々 env-only | 未変更 |

> Phase 11 で実 dry-run を取得し、bindings の warning が出るなら追加対応する。

## S2: .github/workflows/web-cd.yml の Pages → Workers 移行

### 採用方針

**`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` 経路に統一する。**

理由:
- CLAUDE.md 不変条件「`wrangler` を直接呼ばない」「`scripts/cf.sh` ラッパーのみ」に整合
- `scripts/cf.sh` は (a) `op run` で API Token 注入、(b) `ESBUILD_BINARY_PATH` 自動解決、(c) `mise exec` で Node 24 を保証する
- `cloudflare/wrangler-action@v3` 経由で `wrangler deploy` する代替も技術的には可能だが、ローカルと CI でエントリが分岐するため不採用

### Before/After（deploy step 抜粋）

**Before（staging）**:
```yaml
- name: Deploy web app to Cloudflare Pages
  id: deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    wranglerVersion: 4.85.0
    workingDirectory: apps/web
    command: pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**After（staging）**:
```yaml
- name: Build OpenNext Workers bundle
  run: pnpm --filter @ubm-hyogo/web build:cloudflare

- name: Deploy web app to Cloudflare Workers (staging)
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

production も同様に `--env production` で。

### Token / Variable 整合

| 名称 | 種別 | 用途 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret（environment-scoped） | 認証 | 参照のみ（renaming は別タスク） |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | account 識別 | 参照のみ |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | Pages project 名 | **使用停止**。Workers 名称は wrangler.toml の `name` で固定 |

### apps/web/wrangler.toml の確認項目

- `main = ".open-next/worker.js"` が定義されていること
- `[assets]` directory が `.open-next/assets` を指していること
- `[env.staging]` / `[env.production]` の `name` が staging/production の Workers script 名と一致していること
- 不一致がある場合のみ Phase 5 で最小修正（コードロジックには触れない）

## 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | 上記 3 ファイル |
| 出力 | warning ゼロの dry-run、Workers にデプロイされた apps/web |
| 副作用 | staging/production の Pages project は配信停止予定（Phase 11 で確認） |

## テスト方針

- 静的検証: actionlint / yamllint / TOML parse / `grep -rn 'pages deploy' .github/`
- 動的検証: `bash scripts/cf.sh deploy --dry-run` の stderr 確認、`gh workflow run web-cd.yml --ref dev`
- 詳細は Phase 4 へ

## ローカル実行コマンド

```bash
# S1 dry-run
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | tee /tmp/api-prod-dryrun.log
grep -i "warning" /tmp/api-prod-dryrun.log

# S2 dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run 2>&1 | tee /tmp/web-staging-dryrun.log

# pages deploy 残存確認
grep -rn 'pages deploy' .github/workflows/
```

## 完了条件

- [ ] S1: top-level `[vars]` 削除案 / 残す bindings の根拠が表化されている
- [ ] S2: deploy step の Before/After diff が記載されている
- [ ] Token / Variable の参照変化が表化されている
- [ ] 検証コマンドが列挙されている

## 成果物

- `outputs/phase-02/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

