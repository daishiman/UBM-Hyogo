# Phase 12 Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

今回の問題は、同じ設定を2か所に書いていたことと、アプリの配り方が古いままだったこと。

何をしたかを説明すると、設定の正本を1つに寄せ、Web CD の配送先を Workers に直した。

`apps/api/wrangler.toml` では、production と staging のそれぞれに変数を書く場所があるのに、上にも同じ変数を書いていた。Cloudflare Wrangler は「上に書いた変数を production/staging に自動コピーしない」ため、どちらが本物なのか分かりにくくなり warning の原因になる。だから上の変数置き場をなくし、production/staging の場所だけを本物にした。

Web アプリは Cloudflare Pages ではなく Workers + OpenNext の形になっている。それなのに GitHub Actions はまだ Pages に配ろうとしていた。アプリの形と配り方がずれていたので、OpenNext 用の bundle を作ってから Workers に配る流れへ直した。

また、このプロジェクトでは Cloudflare へ配るときに `wrangler` を直接呼ばず、`scripts/cf.sh` という決まった入口を通す。これでローカルと CI の手順がそろう。

### 日常の例え

学校の連絡先を「教室の名簿」と「職員室の名簿」の両方に書いて、片方だけ直したら混乱する。今回は名簿を production/staging の正しい場所にまとめた。同じように、荷物を新しい住所へ届けることになったのに、配送伝票だけ古い住所のままだったため、配送伝票を Workers 用に直した。

### 今回作ったもの

- `apps/api/wrangler.toml` の重複しやすい top-level `[vars]` を削除した。
- `.github/workflows/web-cd.yml` を Workers deploy 経路へ変更した。
- Phase 11 / Phase 12 の NON_VISUAL 証跡ファイルを追加した。
- aiworkflow-requirements の deployment references と indexes を更新した。

## Part 2: 技術者向け

### TypeScript の型定義

この変更では TypeScript の型定義は追加しない。対象は Cloudflare Wrangler 設定、GitHub Actions YAML、Markdown 仕様書である。関連する runtime env shape は既存の `CloudflareEnv` / app env accessor に委譲し、型の二重定義を作らない。

```ts
type CloudflareDeployEnv = "staging" | "production";

interface WebCdDeployCommand {
  config: "apps/web/wrangler.toml";
  env: CloudflareDeployEnv;
  entrypoint: "scripts/cf.sh";
}
```

### CLIシグネチャ

採用する CLI シグネチャ:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

GitHub Actions の呼び出しは `workflow_dispatch` または `dev` / `main` push で行う。

### S1: API wrangler vars

- Removed top-level `[vars]` from `apps/api/wrangler.toml`.
- Kept `[env.production.vars]` and `[env.staging.vars]` as the only runtime env var sources.
- Left top-level bindings/triggers in place because they serve local/default config and are not the env-vars inheritance warning target.

### S2: Web CD Workers deploy

- Replaced `cloudflare/wrangler-action@v3` Pages deploy steps with shell steps.
- Build step now runs `pnpm --filter @ubm-hyogo/web build:cloudflare`, which creates the OpenNext bundle and runs the local patch script.
- Deploy step now exports `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then executes:

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### Operational boundary

Runtime CI deploy evidence and production warning-zero logs remain user-gated because they require branch push / GitHub Actions execution.

### 使用例

```bash
pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

```yaml
- name: Build OpenNext Workers bundle
  run: pnpm --filter @ubm-hyogo/web build:cloudflare

- name: Deploy web app to Cloudflare Workers
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### エラーハンドリング

- `CLOUDFLARE_API_TOKEN` が未設定なら `scripts/cf.sh` / wrangler が fail-fast する。
- `.open-next/worker.js` が存在しなければ Workers deploy は失敗するため、deploy 前に `build:cloudflare` を必ず実行する。
- API dry-run で warning が残る場合は top-level binding ではなく env vars の重複有無を再確認する。

### エッジケース

- `backend-ci.yml` は今回の Web CD cutover 対象外であり、`wrangler-action` 残存は別の current fact として扱う。
- `CLOUDFLARE_PAGES_PROJECT` は Web CD から未参照になるが、Cloudflare Pages project retirement は外部 mutation なので user-gated。
- Issue #331 は CLOSED のため PR は `Refs #331` のみを使う。

### 使用例

```bash
pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

```yaml
- name: Build OpenNext Workers bundle
  run: pnpm --filter @ubm-hyogo/web build:cloudflare

- name: Deploy web app to Cloudflare Workers
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### 設定項目と定数一覧

| Name | Kind | Current handling |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub environment secret | Current runtime deploy token. |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub repository variable | Passed to wrangler through env. |
| `CLOUDFLARE_PAGES_PROJECT` | GitHub repository variable | Deprecated for Web CD after this change. |
| `ENVIRONMENT` | Wrangler env var | Defined only under env-specific vars. |

### テスト構成

| Layer | Command |
| --- | --- |
| Static grep | `rg -n "pages deploy" .github/workflows || true` |
| API typecheck | `pnpm --filter @ubm-hyogo/api typecheck` |
| Web typecheck | `pnpm --filter @ubm-hyogo/web typecheck` |
| Phase 12 guide | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-331-cicd-runtime-warning-cleanup --json` |
| Phase output | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/issue-331-cicd-runtime-warning-cleanup` |
