# task-02: apps/api 自動 CD + 認証 `/me` smoke gate

`[実装区分: 実装仕様書]`

> 判定根拠（CONST_004）: 本タスクは `.github/workflows/api-cd.yml` 新規作成と `scripts/smoke/runtime-admin-api.sh` 新規作成という**コード/設定変更**を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-me-404-authenticated-admin-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T02 |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery`（起点 `origin/dev`） |
| visualEvidence | NON_VISUAL（yaml/shell 構文 + smoke gate 構造で判定） |
| 並列性 | **T01 後・T03 と並列**。T04 とも独立 |
| 紐づく AC / F / S | AC-3（api 自動 CD + smoke gate）/ AC-7・AC-9（`scripts/cf.sh` 経由・redaction）/ F-8・D-A（CD 欠如の構造的素因）/ S1（route ドリフト根治） |

## 概要 / 対象タスク（T02）

apps/api には自動 CD が存在せず（F-8）、api-staging worker は手動 deploy 依存で web に対し version/route ドリフトし得る（D-A・R1）。これが S1（api-staging が現行 `/me` ルートを持たない）の構造的素因。本タスクは `web-cd.yml` を正本テンプレに **apps/api 自動 CD（dev→staging / main→production）** を新設し、deploy 後に `/me/healthz` 200（route 生存）+ minted-cookie 認証 `/me` 200（認証到達）を検証する smoke gate を組み込む。これにより R1 を断ち（B1 復旧ループ成立）、`/me` route ドリフトを deploy 毎に CI が検出する。

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 | 要点 |
| --- | --- | --- |
| `.github/workflows/api-cd.yml` | 新規 | dev→staging / main→production deploy + post-deploy smoke gate |
| `scripts/smoke/runtime-admin-api.sh` | 新規 | api 直 probe（`/me/healthz` 200 + 認証 `/me` 200）runner。`runtime-admin-web.sh` を雛形 |
| `apps/api/wrangler.toml` | 確認のみ（変更しない） | deploy 対象 env 名: staging=`ubm-hyogo-api-staging`（:145）/ production=`ubm-hyogo-api`（:49） |

> `mint-staging-session-cookie.mts` は流用（編集不要）。`scripts/cf.sh` も流用。

## 2. 主要な構造（実コードに即した job YAML 骨子）

`web-cd.yml` を正本テンプレとし、build step を除去（api は `scripts/cf.sh deploy` が wrangler bundle を実施。OpenNext build 不要）、deploy 対象を `apps/api/wrangler.toml` に置換、smoke probe を web 経由 `/profile` から api 直 `/me/healthz` + `/me` に置換する。

```yaml
# 目的: Cloudflare Workers (Hono) apps/api の dev/main デプロイ + 認証 /me smoke gate
name: api-cd

on:
  push:
    branches: [dev, main]
    paths:
      - "apps/api/**"
      - "packages/shared/**"
      - ".github/workflows/api-cd.yml"

concurrency:
  group: api-cd-${{ github.ref_name }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  deploy-staging:
    if: github.ref_name == 'dev'
    runs-on: ubuntu-latest
    environment:
      name: staging
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: mise
      - name: Deploy api to Cloudflare Workers (staging)
        id: deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          set -o pipefail
          if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
            echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment 'staging' has CLOUDFLARE_API_TOKEN registered."
            exit 1
          fi
          bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging 2>&1 | tee api-cd-staging-deploy.log
      - name: Verify deploy log redaction (staging)
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/redaction-check.sh --log api-cd-staging-deploy.log --account-id "$CLOUDFLARE_ACCOUNT_ID"

  api-runtime-smoke:
    if: github.ref_name == 'dev'
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: staging-runtime-smoke
    permissions:
      contents: read
    timeout-minutes: 10
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
      STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
      STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: mise
      - name: check api runtime smoke prerequisites
        id: prereq
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          missing=()
          for name in STAGING_API_BASE STAGING_AUTH_SECRET STAGING_ADMIN_MEMBER_ID STAGING_ADMIN_EMAIL CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
            if [ -z "${!name:-}" ]; then
              missing+=("$name")
            fi
          done
          if [ "${#missing[@]}" -gt 0 ]; then
            printf 'skip_reason=missing:%s\n' "${missing[*]}" >> "$GITHUB_OUTPUT"
            printf '::notice::api runtime smoke skipped; missing staging-runtime-smoke secret/var names: %s\n' "${missing[*]}"
            exit 0
          fi
          echo 'skip_reason=' >> "$GITHUB_OUTPUT"
      - name: mint admin session cookie
        if: steps.prereq.outputs.skip_reason == ''
        env:
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-session-cookie.mts
          cookie="$(grep '^admin_session_cookie=' "$mint_out" | tail -n1 | cut -d= -f2-)"
          rm -f "$mint_out"
          echo "::add-mask::$cookie"
          echo "STAGING_ADMIN_SESSION_COOKIE=$cookie" >> "$GITHUB_ENV"
      - name: run api runtime smoke (/me/healthz 200 + authed /me 200)
        if: steps.prereq.outputs.skip_reason == ''
        run: |
          mkdir -p ci-evidence
          bash scripts/smoke/runtime-admin-api.sh staging --out-dir ci-evidence --ci-summary
      - name: redaction grep gate
        if: always() && steps.prereq.outputs.skip_reason == ''
        run: |
          leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|__Secure-authjs\.session-token=[A-Za-z0-9._~+\/=-]+' ci-evidence/ || true)"
          if [ -n "$leak_files" ]; then
            echo "::error::redaction grep gate failed; leaking content is suppressed"
            printf '%s\n' "$leak_files" | sed 's#^#leak-candidate-file=#'
            exit 1
          fi
      - name: upload api runtime smoke evidence
        if: always() && steps.prereq.outputs.skip_reason == ''
        uses: actions/upload-artifact@v4
        with:
          name: api-runtime-smoke-staging-${{ github.run_id }}
          path: ci-evidence/
          retention-days: 30

  deploy-production:
    if: github.ref_name == 'main'
    # deploy-staging と同型・--env production・api-cd-production-deploy.log
    ...
  api-runtime-smoke-production:
    if: github.ref_name == 'main'
    needs: deploy-production
    environment:
      name: production-runtime-smoke
    # PRODUCTION_API_BASE / PRODUCTION_AUTH_SECRET / ... prefix・mint ... production 引数
    ...
```

> production job 群（`deploy-production` / `api-runtime-smoke-production`）は staging と同型で、env prefix を `PRODUCTION_*`・mint 引数を `production`・deploy `--env production`・log 名を `api-cd-production-deploy.log` に置換する（`web-cd.yml:161-302` と 1:1）。

### `scripts/smoke/runtime-admin-api.sh` 骨子（`runtime-admin-web.sh` 雛形）

```bash
#!/usr/bin/env bash
# Authenticated /me runtime smoke runner for the api Worker.
set -euo pipefail
ENVIRONMENT="${1:-}"; shift || true
# staging|production のみ許可（runtime-admin-web.sh と同じ guard）
# --out-dir / --ci-summary を runtime-admin-web.sh と同じ引数仕様で解釈
# 入力 env: {PREFIX}_API_BASE / {PREFIX}_ADMIN_SESSION_COOKIE（mint step が GITHUB_ENV に格納）
# probe-1: GET {API_BASE}/me/healthz → 200 でなければ exit 1
# probe-2: GET {API_BASE}/me を cookie 付きで → 200 でなければ exit 1（401/410/404 すべて fail）
# evidence: status のみを ci-evidence/ に書く。cookie 値・JWT は書かない（redact.sh 経由）
```

| probe | URL | 期待 | secret 配慮 |
| --- | --- | --- | --- |
| probe-1 | `GET {API_BASE}/me/healthz` | HTTP **200**（`apps/api/src/index.ts:216` が無認証で `{ok:true,scope:"me"}`） | cookie 不要 |
| probe-2 | `GET {API_BASE}/me`（cookie 付き） | HTTP **200**（認証 `/me` 到達） | cookie は `Cookie:` ヘッダで送るが evidence には status のみ記録 |

S1 検出: probe-1=200 かつ probe-2=404 → 「healthz は通るが `/me` が route 未マッチ」を CI が fail 検出。

## 3. 入力・出力・副作用の定義

| 区分 | 内容 |
| --- | --- |
| 入力（CD トリガ） | `push` to `dev` / `main`（`apps/api/**` / `packages/shared/**` / `api-cd.yml` 変更時） |
| 入力（smoke secret） | `STAGING_API_BASE` / `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（production は `PRODUCTION_*`） |
| 出力 | api worker の自動 deploy + smoke gate 結果（pass/fail/skip）+ ci-evidence artifact |
| 副作用 | dev push で api-staging deploy / main push で api-production deploy（**これは web↔api ドリフトを解消する意図された副作用**） |
| 不変 | `apps/api/wrangler.toml` binding/vars・`/me` route・D1 schema を変更しない |

## 4. テスト方針（yaml / shell 構文・CI gate）

新規 vitest は追加しない（CD/shell は構文・構造検証）。

| TC-ID | 検証 | 期待値 |
| --- | --- | --- |
| CD-1 | `.github/workflows/api-cd.yml` の yaml parse（actionlint 相当 / `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/api-cd.yml'))"`） | 構文 valid |
| CD-2 | yaml 文字列検査 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`・`--env production`・`/me/healthz` probe・prereq skip 分岐・`redaction grep gate` が存在 |
| CD-3 | `bash -n scripts/smoke/runtime-admin-api.sh` | 構文 valid。`/me/healthz` 200 判定 + 認証 `/me` 200 判定を含む |
| CD-4 | `wrangler` 直叩きが無い grep | `grep -n 'wrangler ' .github/workflows/api-cd.yml scripts/smoke/runtime-admin-api.sh` が deploy 文脈で 0 件（`scripts/cf.sh` 経由のみ） |
| CD-5（既存 gate 整合） | `scripts/smoke/__tests__/` の workflow-env-scope / secret-contract 系が存在すれば api-cd.yml も同 gate を満たす | step-scoped secret・job-level に CLOUDFLARE_API_TOKEN を置かない |

## 5. ローカル実行・検証コマンド

```bash
# yaml 構文
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/api-cd.yml'))"
# actionlint（導入済なら）
mise exec -- pnpm exec actionlint .github/workflows/api-cd.yml 2>/dev/null || true
# shell 構文
bash -n scripts/smoke/runtime-admin-api.sh
# wrangler 直叩きが無い
! grep -nE '(^|[^.])wrangler (deploy|publish)' .github/workflows/api-cd.yml scripts/smoke/runtime-admin-api.sh
# secret 配線（既存契約 verifier があれば）
mise exec -- pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts 2>/dev/null || true
```

## 6. 完了条件（DoD）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T02-1 | `api-cd.yml` が dev→staging / main→production で `scripts/cf.sh deploy --config apps/api/wrangler.toml` を実行 | CD-2 |
| DoD-T02-2 | post-deploy smoke gate に `/me/healthz` 200 probe + minted-cookie 認証 `/me` 200 probe がある | CD-3 |
| DoD-T02-3 | prereq skip 分岐（secret 欠落で `::notice::` + exit 0）が staging/production 両方にある | CD-2 |
| DoD-T02-4 | redaction grep gate（cookie/Bearer/session-token 検出で fail）がある | CD-2 |
| DoD-T02-5 | `wrangler` 直叩きが無い（`scripts/cf.sh` 経由のみ） | CD-4 |
| DoD-T02-6 | `api-cd.yml` yaml 構文 valid・`runtime-admin-api.sh` `bash -n` PASS | CD-1 / CD-3 |
| DoD-T02-7 | `apps/api/wrangler.toml` の binding/vars 差分が無い | `git diff origin/dev...HEAD -- apps/api/wrangler.toml`（空） |

## 7. 不変条件

- deploy は `bash scripts/cf.sh` 経由のみ。`wrangler` 直叩き禁止（CLAUDE.md / AC-7）。
- `CLOUDFLARE_API_TOKEN` は step-scoped env のみ（job-level 配置禁止）。
- smoke の minted cookie は `::add-mask::` でマスクし stdout へ生値を出さない。evidence は status のみ（AC-9）。
- `apps/api/wrangler.toml` の binding/vars・`/me` route・D1 schema を変更しない（AC-6）。
- secret は GitHub Secrets（`STAGING_*` / `PRODUCTION_*` / `CLOUDFLARE_API_TOKEN`）。平文化しない。
- commit/PR/push/deploy/secret 登録は user-gated（CONST_002・新規 secret `STAGING_API_BASE`/`PRODUCTION_API_BASE` の登録は Phase 11 で user-gated タスク化）。

## 8. ロールバック手順

```bash
git rm .github/workflows/api-cd.yml scripts/smoke/runtime-admin-api.sh
```
新規ファイルのため削除で完全に戻せる。api は手動 deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`）へ戻る。T01/T03/T04 とはコード非依存のため単独 revert 可能。
