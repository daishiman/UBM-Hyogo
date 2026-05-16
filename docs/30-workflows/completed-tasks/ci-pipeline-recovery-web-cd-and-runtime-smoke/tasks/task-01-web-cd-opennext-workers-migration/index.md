# task-01 — web-cd OpenNext Workers 移行（Phase 1-13 実装仕様書）

[実装区分: 実装仕様書]

- 判定根拠: `.github/workflows/web-cd.yml` の YAML を編集し、build/deploy step の挙動を変える「コード変更（CI 設定コード）」を伴うため、CONST_004 の既定区分（実装仕様書）に該当する。docs-only spec の例外条件（`apps/` / `packages/` / `.github/workflows/` のいずれにも触れない）を満たさない。
- 1 サイクル内完了適合（CONST_007）: 変更対象は単一ファイルのみ（`.github/workflows/web-cd.yml`）、依存タスクは無し（task-02 と完全並列）、所要は 1 PR 内で完結する。
- 関連 / 継続: `docs/30-workflows/UT-GOV-006-web-deploy-target-canonical-sync.md`、`docs/30-workflows/ut-06-followup-A-opennext-workers-migration.md`（wrangler.toml 側は移行済み、本タスクは workflow 側の追従）。
- 親 workflow: `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/`（Phase 01-03 の事実・要件・統合設計を上位正本とする）。

---

## Phase 1: Context

PR #612 merge 直後の Actions run #366 で `web-cd / deploy-staging` が failure（56s, errors=2, warnings=1）。

### 観測ログ（事実）

```
npx wrangler pages deploy .next \
  --project-name=ubm-hyogo-web-staging --branch=dev

▲ [WARNING] Pages now has wrangler.toml support.
  We detected a configuration file at apps/web/wrangler.toml but it is missing the
  "pages_build_output_dir" field, required by Pages.

✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
  cache/webpack/client-production/0.pack is 93.8 MiB in size
```

### 矛盾点（既存資産との不整合）

| 観点 | 実体 | workflow の振る舞い |
|------|------|---------------------|
| `apps/web/wrangler.toml` | `main = ".open-next/worker.js"`、`[env.staging]` / `[env.production]` を **Workers 形式**で定義済み | `wrangler pages deploy .next` を呼び続けている |
| `apps/web/package.json` | `build:cloudflare = "opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs"` 用意済み | 現 step は `build`（=`next build --webpack` で `.next/` を吐くだけ） |
| `apps/web/open-next.config.ts` | `defineCloudflareConfig()` 構成済み | 未利用 |
| `CLAUDE.md` | Cloudflare Workers + `@opennextjs/cloudflare` が正本、`wrangler` は `scripts/cf.sh` 経由のみ | `cloudflare/wrangler-action@v3` で wrangler 直接実行 |

### 担当範囲

`.github/workflows/web-cd.yml` の **build と deploy の step** を Workers 移行に整合させる。`apps/web/` 側のソース・設定（INV-001 / INV-002）は触らない。

---

## Phase 2: Requirements & Acceptance Criteria

### REQ-A1（staging）— Given/When/Then

- **Given** `dev` ブランチに任意の commit が push された
- **When** `web-cd / deploy-staging` ジョブが実行される
- **Then** `pnpm --filter @ubm-hyogo/web build:cloudflare` で `.open-next/worker.js` と `.open-next/assets/` が生成され、`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` が exit 0 で終了し、Cloudflare Workers `ubm-hyogo-web-staging` の最新 deployment が該当 GitHub Actions run の完了時刻以降に更新されている。

### REQ-A2（production）— Given/When/Then

- **Given** `main` ブランチに任意の commit が push された
- **When** `web-cd / deploy-production` ジョブが実行される
- **Then** 同じく `.open-next/` が生成され、`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` が exit 0 で終了し、Workers `ubm-hyogo-web-production` の最新 deployment が該当 GitHub Actions run の完了時刻以降に更新されている。

### REQ-A3（wrangler.toml 改変禁止）— Given/When/Then

- **Given** task-01 の PR diff
- **When** レビュー / CI で diff を確認する
- **Then** `apps/web/wrangler.toml` および `apps/web/package.json` には変更が含まれない（`git diff dev...HEAD --name-only` で `apps/web/` 配下が出力されない）。

### 受け入れ補助条件

- `grep -n 'pages deploy' .github/workflows/web-cd.yml` の exit code が 1（= 0 件）。
- `grep -n 'cloudflare/wrangler-action' .github/workflows/web-cd.yml` の exit code が 1（= 0 件）。
- `actionlint .github/workflows/web-cd.yml` が exit 0。

---

## Phase 3: Architecture / Detailed Design

### 変更対象ファイル一覧

| パス | 変更種別 |
|------|----------|
| `.github/workflows/web-cd.yml` | 編集（build step 1 行と deploy step 1 ブロックを 2 ジョブそれぞれで差し替え、`cloudflare/wrangler-action@v3` を撤去） |

> **これ以外のファイルは触らない**。とくに `apps/web/wrangler.toml`、`apps/web/package.json`、`apps/web/open-next.config.ts`、`apps/web/next.config.ts` は INV-001 / INV-002 により改変禁止。

### step 単位の before / after diff 概略

| job | step name | before | after |
|-----|-----------|--------|-------|
| deploy-staging | Build web app | `pnpm --filter @ubm-hyogo/web build` | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| deploy-staging | Deploy（旧: `Deploy web app to Cloudflare Pages`） | `cloudflare/wrangler-action@v3` で `pages deploy .next --project-name=...-staging --branch=dev` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（`run:` step） |
| deploy-production | Build web app | 同上 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| deploy-production | Deploy | `pages deploy .next --project-name=... --branch=main` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` |

### `cloudflare/wrangler-action@v3` 撤去理由

1. CLAUDE.md「Cloudflare 系 CLI 実行ルール」が `scripts/cf.sh` 経由を必須化（`wrangler login` / 直接実行を禁止）。
2. action 内部で別 wrangler バージョンが pin され、リポジトリの `node_modules/wrangler` と二重化して ESBUILD バージョン不整合（`scripts/cf.sh` の `ESBUILD_BINARY_PATH` 自動解決ロジックを迂回）が再発する。
3. `cf.sh` は `CLOUDFLARE_API_TOKEN` を env から読み、wrangler.toml の `[env.X]` から `name` / `main` / `assets` を解決するため、`--project-name` / `--branch` の手渡し引数は不要となる。

### 認証経路

- `scripts/cf.sh` は `CLOUDFLARE_API_TOKEN` env 名を読むため、workflow では job ごとの `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` を `CLOUDFLARE_API_TOKEN` にマップして注入する。deprecated な旧単一 `secrets.CLOUDFLARE_API_TOKEN` は current web CD で参照しない。
- `CLOUDFLARE_ACCOUNT_ID` は repository-scoped variable から `env:` で渡す（wrangler が account 解決時に参照）。
- `vars.CLOUDFLARE_PAGES_PROJECT` は本タスクで参照を**完全削除**する（wrangler.toml の `[env.X] name` が単一正本）。

### concurrency / branch 条件

`name` / `on.push.branches` / `concurrency.group=web-cd-${{ github.ref_name }}` / `cancel-in-progress: true` は現状維持。`if: github.ref_name == 'dev'` / `'main'` も維持。

---

## Phase 4: Test Strategy（TDD red 相当）

CI ワークフロー編集のため unit test は不在。以下を「red を作って green に倒す」検証として扱う:

| 検証 | 期待 | 実装位置 |
|------|------|----------|
| `actionlint .github/workflows/web-cd.yml` | exit 0 | local + CI（`.github/workflows/actionlint.yml` 既存があれば追従、無くても本タスクで追加はしない） |
| `grep -n 'pages deploy' .github/workflows/web-cd.yml` | 0 件（exit 1） | local self-check + Phase 11 evidence |
| `grep -n 'cloudflare/wrangler-action' .github/workflows/web-cd.yml` | 0 件（exit 1） | 同上 |
| `dev` push 後の `web-cd / deploy-staging` | green | GitHub Actions run |
| Workers latest deployment freshness | workflow run 完了時刻以降の deployment | `gh api ...` で取得 |

> 既存の `verify-design-tokens` 等の CI gate には影響しない（grep スコープが apps/web/src のみのため）。

---

## Phase 5: Implementation Skeleton

`.github/workflows/web-cd.yml` の **書き換え後の完全版**。即適用可能な最終形。

```yaml
# 目的: Cloudflare Workers (OpenNext) への dev/main デプロイ
# 範囲: dev -> ubm-hyogo-web-staging, main -> ubm-hyogo-web-production
# 正本: apps/web/wrangler.toml の [env.staging] / [env.production]
name: web-cd

on:
  push:
    branches: [dev, main]

concurrency:
  group: web-cd-${{ github.ref_name }}
  cancel-in-progress: true

jobs:
  deploy-staging:
    if: github.ref_name == 'dev'
    runs-on: ubuntu-latest
    environment:
      name: staging
    permissions:
      contents: read
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm

      - name: Install dependencies
        run: mise exec -- pnpm install --frozen-lockfile

      - name: Build web app (OpenNext Workers bundle)
        run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

      - name: Deploy to Cloudflare Workers (staging)
        id: deploy
        run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

  deploy-production:
    if: github.ref_name == 'main'
    runs-on: ubuntu-latest
    environment:
      name: production
    permissions:
      contents: read
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm

      - name: Install dependencies
        run: mise exec -- pnpm install --frozen-lockfile

      - name: Build web app (OpenNext Workers bundle)
        run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

      - name: Deploy to Cloudflare Workers (production)
        id: deploy
        run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### 注記（Phase 5 の意図）

- `permissions.deployments: write` は wrangler-action 撤去により不要となるため削除（API token 経由で Workers が直接 deploy するので GitHub Deployments API は使わない）。
- `gitHubToken` 入力も同理由で削除。
- `jdx/mise-action@v2` を追加して runner に `mise` を導入し、`mise exec --` で `.mise.toml` 固定の Node 24.15.0 / pnpm 10.33.2 を強制（CLAUDE.md「mise exec 経由で実行」要件）。
- `id: deploy` は将来 `outputs` 拡張のため残置。本タスクでは output を消費しない。
- secret は `env:` でのみ渡す。`run:` 内で `echo "$CLOUDFLARE_API_TOKEN"` 等は禁止（INV-003 / Phase 9）。

---

## Phase 6: Refactoring Notes

- 2 ジョブ間で重複する 5 step（checkout, mise, pnpm setup, node setup, install, build）は composite action 化（`./.github/actions/web-build`）の余地があるが、**本サイクルでは行わない**（YAGNI）。
- 現状の重複は ~25 行で、リスクとレビュー可読性のトレードオフを考慮し、CI YAML は「直書きの素直さ」を優先する。
- 共通化が必要になるしきい値: ジョブが 3 つ以上に増えた時、もしくは build step が 5 行を超えた時に再検討する。

---

## Phase 7: Integration

- `backend-ci.yml` の Workers deploy step は既に `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>` パターンを採用しており、本タスク後の `web-cd` と表記が完全一致する（運用一貫性が向上）。
- task-02（staging-runtime-smoke secrets）とは**完全独立**。`web-cd` は web bundle を Workers に push するだけで、smoke が要求する `STAGING_*` secrets を参照しない。両 task の PR は順序を問わず独立にマージ可能。
- `verify-design-tokens` / `verify-indexes` 等の CI gate は YAML スコープ外のため影響なし。

---

## Phase 8: Performance / Caching

- `actions/setup-node@v4` の `cache: pnpm` は維持（`pnpm-lock.yaml` のハッシュで restore）。
- `mise install` のバイナリは GitHub Actions のキャッシュ未使用で OK（`jdx/mise-action@v2` 内部で軽量にインストール、Node binary は `setup-node` 側に任せる）。
- OpenNext build（`opennextjs-cloudflare build`）の所要時間は最初の green run で記録するだけに留める（ベースライン値の事前固定はしない）。記録先: `outputs/phase-11/web-cd-build-baseline.txt`（実 run のログから抽出）。
- 25 MiB 上限問題は Workers 移行で**根本解消**される（webpack `cache/` は `.open-next/worker.js` バンドルに含まれない）。

---

## Phase 9: Security & Operations

### token 権限（参照規約）

- `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` は `Workers Scripts:Edit` + `Account Settings:Read` の最小権限 token を使用する規約（`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の Cloudflare token セクション準拠）。
- 本タスクは current web CD で旧単一 `secrets.CLOUDFLARE_API_TOKEN` を使わない。`scripts/cf.sh` 互換のため、workflow env 名だけ `CLOUDFLARE_API_TOKEN` とする。

### token 漏洩防止

- `set -x` を `run:` に書かない。
- `echo "$CLOUDFLARE_API_TOKEN"` / `printenv | grep CLOUDFLARE` を書かない。
- `cf.sh deploy` の標準出力には Workers の VERSION_ID と URL のみ含まれる（wrangler 仕様）。token は出力されない。
- artifact に `.env` / `~/.wrangler/config/default.toml` 相当のファイルを含めない（本 workflow では生成・参照しない）。

### rollback 手順

```bash
# 直前の deployment に戻す（VERSION_ID は version-metadata.json から取得）
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env staging
# production 緊急時
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
```

`cf.sh rollback` は内部で `wrangler rollback` を `--env` 解決付きで呼ぶ（既存実装で十分、改修不要）。

### git revert による退避

YAML を revert すると Pages deploy に戻り 25 MiB エラーが再発するため、緊急退避以外で revert しないこと。問題が出たら Workers 側 rollback で対応する。

---

## Phase 10: Documentation

完了時に以下のドキュメントへ「task-01 完了」マークと参照リンクを追記する（本仕様書外の編集は実装サイクルで行う）:

| 対象 | 追記内容 |
|------|---------|
| `docs/30-workflows/UT-GOV-006-web-deploy-target-canonical-sync.md` | workflow 側追従が完了した旨と、本仕様書 / PR への参照 |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration.md` | 同上、follow-up A 完了マーク |
| `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/index.md` | task-01 ステータスを「complete」に |

`README.md` / `CLAUDE.md` には現在 `wrangler pages deploy` への直接言及が無いことを確認済（`grep -n 'pages deploy' README.md CLAUDE.md` で 0 件想定）。差分発見時のみ追加修正する。

---

## Phase 11: Acceptance Evidence（NON_VISUAL）

実装サイクルで以下の canonical paths に evidence を配置する。

| path | 内容 |
|------|------|
| `outputs/phase-11/actionlint.log` | `actionlint .github/workflows/web-cd.yml` の stdout/stderr（exit 0 想定） |
| `outputs/phase-11/grep-pages-deploy.log` | `grep -n 'pages deploy' .github/workflows/web-cd.yml; echo "exit=$?"` の出力（`exit=1` を期待 = 0 件） |
| `outputs/phase-11/grep-wrangler-action.log` | `grep -n 'cloudflare/wrangler-action' .github/workflows/web-cd.yml; echo "exit=$?"` の出力（`exit=1`） |
| `outputs/phase-11/web-cd-run-id.txt` | `gh run list --workflow=web-cd.yml --branch=dev --limit=1 --json databaseId,conclusion,headSha` の結果 |
| `outputs/phase-11/wrangler-deploy-stdout.txt` | `web-cd / deploy-staging` ジョブログから `cf.sh deploy` の stdout 抜粋（VERSION_ID と URL を含む / token を含まない） |
| `outputs/phase-11/version-metadata.json` | `bash scripts/cf.sh api-get '/client/v4/accounts/<acct>/workers/scripts/ubm-hyogo-web-staging/versions?per_page=1'` の出力。`tag == $GITHUB_SHA` を確認 |
| `outputs/phase-11/web-cd-build-baseline.txt` | OpenNext build 所要時間（最初の green run から抽出） |

> evidence 配置は実装サイクル（PR）で実施。本仕様書の段階では「path 列挙」のみが責務。

---

## Phase 12: Close-out Compliance（self-check）

| 項目 | 状態 |
|------|------|
| `[実装区分: 実装仕様書]` 明記 | OK（ファイル冒頭） |
| 判定根拠の記述 | OK（`.github/workflows/` 配下を編集するため docs-only 例外不適用） |
| 1 サイクル内完了適合（CONST_007） | OK（変更ファイル 1 件、依存無し） |
| placeholder token（`TODO` / `TBD` / `<FILL_ME>`）0 件 grep | self-check 対象（実装時に `grep -nE 'TODO|TBD|<FILL_ME>' docs/30-workflows/.../task-01-.../index.md` で 0 件確認） |
| `apps/` / `packages/` の dirty diff 0 件 | OK（本タスクは `.github/workflows/web-cd.yml` のみ変更想定） |
| CONST_005 必須項目（Phase 12 末尾の self-check 表で網羅） | OK（次節） |

### CONST_005 必須項目の self-check

| 必須項目 | 充足箇所 |
|----------|---------|
| 変更対象ファイル一覧（パス + 変更種別） | Phase 3 冒頭の表 |
| 関数シグネチャ相当（CI YAML の step 名 + run コマンド） | Phase 5 の YAML 全文 |
| 入力・出力・副作用 | Phase 3「認証経路」 + Phase 9「token 権限」 + Phase 11 evidence |
| テスト方針 | Phase 4（actionlint + grep gate + runtime green run） |
| ローカル検証コマンド | Phase 13 末尾 + 下記 self-check コマンド |
| DoD（Phase 02 task-01 DoD 3 項目逐語転記） | 下記 |

### DoD（Phase 02 設計書 task-01 DoD の逐語転記）

1. `web-cd` workflow が `dev` push でグリーン
2. 直後に staging Workers の `version_metadata` から `tag = $GITHUB_SHA` が確認できる
3. `wrangler pages deploy` 文字列が `.github/workflows/web-cd.yml` から消えている（`grep -n 'pages deploy' .github/workflows/web-cd.yml` で 0 件）

### ローカル検証コマンド

```bash
# 1. YAML 静的検査
actionlint .github/workflows/web-cd.yml

# 2. 残存禁止語の grep gate（exit 1 = 0 件 = 期待）
grep -n 'pages deploy' .github/workflows/web-cd.yml ; echo "exit=$?"
grep -n 'cloudflare/wrangler-action' .github/workflows/web-cd.yml ; echo "exit=$?"

# 3. （任意）act での dry-run
# act を入れている場合のみ
# act push -W .github/workflows/web-cd.yml -j deploy-staging --dryrun
```

---

## Phase 13: PR / Commit Plan

| 項目 | 値 |
|------|----|
| branch 名 | `fix/web-cd-opennext-workers-migration` |
| commit message | `fix(ci): switch web-cd to OpenNext Workers deploy` |
| commit body 概要 | 25 MiB Pages 上限エラー解消、`scripts/cf.sh deploy --env <staging\|production>` への一本化、`cloudflare/wrangler-action@v3` 撤去、`mise exec --` で Node 24/pnpm 10 を強制 |
| PR base | `dev`（CLAUDE.md「PR base は dev、main は production リリース時のみ」既定） |
| PR title | `fix(ci): switch web-cd to OpenNext Workers deploy` |
| スクリーンショット | なし（NON_VISUAL: CI YAML / `outputs/phase-11/` に画像生成物無し） |
| 関連 Issue / Workflow | `docs/30-workflows/completed-tasks/ci-pipeline-recovery-web-cd-and-runtime-smoke/`、UT-GOV-006、ut-06-followup-A |

### PR 本文骨子（実装サイクルで `diff-to-pr` が生成する素材）

- Summary: `pages deploy` を `OpenNext Workers + scripts/cf.sh deploy` に置換し、25 MiB 上限エラーを根本解消。
- Test plan: `actionlint` / grep gate / `dev` push 後の `web-cd / deploy-staging` green / latest Workers deployment freshness。
- Risk / Rollback: Workers 側 rollback は `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging`。
