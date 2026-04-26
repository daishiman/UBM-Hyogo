# 実装ガイド

## Part 1: 中学生レベルの説明

### なぜ必要か

学校の文化祭で、受付係、会計係、鍵を持つ先生がそれぞれ別の役割を持つのと同じで、Webサービスでも「見る人」「動かす人」「鍵を保管する場所」を分ける必要がある。

たとえば、体育館の鍵を受付ノートに書いてしまうと、ノートを見た人が誰でも体育館を開けられる。サービスでも、Google や Cloudflare の大事な鍵を置く場所を間違えると、関係ない場所から本番環境を動かせてしまう。

### 何をするか

このタスクでは、次の3つを決めた。

| 決めたこと | 日常の例え | 実際の置き場 |
| --- | --- | --- |
| サービスが動くときに使う鍵 | 先生だけが持つ鍵 | Cloudflare Secrets + 1Password Environments |
| デプロイするときに使う鍵 | 会場設営係だけが使う許可証 | GitHub Secrets |
| 公開してよい設定 | 掲示板に貼る案内 | GitHub Variables / `wrangler.toml` |

`dev` ブランチは練習用の会場、`main` ブランチは本番会場として扱う。練習用の変更が本番会場に流れないように、workflow は staging と production を明示している。

### 画面確認について

このタスクは GitHub Actions、Cloudflare、Secrets の配置を扱うタスクであり、画面 UI を変更していない。そのため Phase 11 の証跡はスクリーンショットではなく、`outputs/phase-11/manual-smoke-log.md` と `outputs/phase-11/link-checklist.md` を正とする。

## Part 2: 技術者向け詳細

### Current Contract

| 項目 | 現在値 |
| --- | --- |
| CI workflow | `.github/workflows/ci.yml` |
| Web deploy workflow | `.github/workflows/web-cd.yml` |
| API deploy workflow | `.github/workflows/backend-deploy.yml` |
| Web runtime | Next.js 16 + `@opennextjs/cloudflare` on Cloudflare Workers |
| API runtime | Hono on Cloudflare Workers |
| Node / pnpm | Node 24.x / pnpm 10.x |
| CI gate | lint + typecheck + build |
| CD gate | push to `dev` / `main`; CI success is enforced before merge by branch protection |

### TypeScript Interfaces

```ts
export type DeployBranch = "dev" | "main";
export type DeployTarget = "staging" | "production";
export type SecretPlacement = "cloudflare-secret" | "github-secret" | "github-variable" | "one-password" | "wrangler-vars";

export interface DeploymentEnvironmentMap {
  readonly branch: DeployBranch;
  readonly githubEnvironment: DeployBranch;
  readonly target: DeployTarget;
  readonly webWorkerName: string;
  readonly apiWorkerName: string;
}

export interface SecretPlacementRule {
  readonly name: string;
  readonly kind: "runtime" | "deploy" | "public" | "deploy-config";
  readonly placements: readonly SecretPlacement[];
  readonly mustNotAppearIn: readonly SecretPlacement[];
}
```

### API / Script Signatures

```bash
# CI
pnpm lint
pnpm typecheck
pnpm build

# Web deploy
pnpm --filter @ubm-hyogo/web deploy:staging
pnpm --filter @ubm-hyogo/web deploy:production

# API deploy
pnpm --filter @ubm-hyogo/api deploy:staging
pnpm --filter @ubm-hyogo/api deploy:production
```

### Workflow Usage

```yaml
# dev branch
environment: dev
run: pnpm --filter @ubm-hyogo/api deploy:staging

# main branch
environment: main
run: pnpm --filter @ubm-hyogo/api deploy:production
```

### Error Handling / Edge Cases

| ケース | 対応 |
| --- | --- |
| `dev` push が production に触る | `deploy:staging` script と `wrangler --env staging` を使う |
| `main` push 前に CI が失敗している | branch protection で merge を止める。CD workflow 自体は push 直起動 |
| shared package 変更で web / api 両方に影響 | `packages/**` path filter で両 CD を起動し、各 build を実行する |
| D1 migration が必要 | 本タスクでは deploy path のみ固定。migration automation は未タスクとして管理する |
| runtime secret が GitHub に混入 | `secrets-placement-matrix.md` の禁止パターンに従い Cloudflare Secrets へ移す |

### Configurable Parameters

| 値 | 置き場 | 説明 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Environment Secrets (`dev` / `main`) | Cloudflare deploy token。環境ごとに値を分離する |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Variables | 非機密の Cloudflare account identifier |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Secrets + 1Password | runtime OAuth secret |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Cloudflare Secrets + 1Password | runtime Google integration secret |
| `ENVIRONMENT` | `wrangler.toml` vars | `staging` / `production` の runtime 表示 |

### Handoff

- Phase 13 はユーザー承認なしに実行しない。
- D1 migration の CI/CD 組み込みは `unassigned-task-detection.md` の U-06 として管理する。
- 画面変更がないため、スクリーンショット参照は N/A。代替証跡は Phase 11 の Markdown evidence とする。
