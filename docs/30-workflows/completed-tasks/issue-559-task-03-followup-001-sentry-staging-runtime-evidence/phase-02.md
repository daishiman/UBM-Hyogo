# Phase 2: 設計

## 1. 変更対象ファイル一覧

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | M（必要時のみ） | 現行 Sentry env schema に `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` を追加し、既存 required/optional 境界を維持 |
| `apps/web/wrangler.toml` | M | `[env.staging.vars]` / `[env.production.vars]` に `NEXT_PUBLIC_SENTRY_ENVIRONMENT` を追加。DSN 実値は repository に宣言しない |
| `apps/web/.dev.vars.example` | M | `op://UBM-Hyogo/Sentry Web DSN (<env>)/...` 参照のみ追記 |
| `apps/web/src/lib/__tests__/env.test.ts` | M | `NEXT_PUBLIC_SENTRY_DSN` の optional parse / 不正 URL reject の単体テスト |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` | M | 冒頭メタ「状態」を `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` へ更新（Phase 12 で実施） |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | M | Sentry Web staging runtime evidence 取得手順セクション追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | M | 本ワークフローの参照行を canonical absolute path で追加 |
| `outputs/phase-11/evidence/{preflight-g0.log,secret-list-staging.log,deploy-staging.log,curl-staging.log,sentry-staging-server-event.png,sentry-staging-browser-event.png,grep-gate-runtime.log,dsn-leak-scan.log}` | C | runtime evidence 実体（後続サイクル G0〜G4 で生成） |

## 2. env schema 設計（FR-1）

```ts
// apps/web/src/lib/env.ts（追記想定）
const SentryEnvSchema = {
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]).optional(),
};
// 既存 EnvSchema の object に extend する（z.object 内に直接埋め込みでも可）
```

`getEnv()` は既存通り Cloudflare Workers binding 経由で受け取った env を `EnvSchema.parse(env)` で検証する。throw は `apps/web/src/app/error.tsx`（task-05）の error boundary 経由で handle される設計。直接 `process.env.SENTRY_DSN_WEB` を参照することは禁止（CI grep gate）。

## 3. wrangler.toml 設計（FR-2）

```toml
[env.staging.vars]
SENTRY_ENVIRONMENT = "staging"
NEXT_PUBLIC_SENTRY_ENVIRONMENT = "staging"
SENTRY_TRACES_SAMPLE_RATE = "0.2"

[env.production.vars]
SENTRY_ENVIRONMENT = "production"
NEXT_PUBLIC_SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

`SENTRY_DSN_WEB` は Cloudflare Secret として `bash scripts/cf.sh secret put` 経由のみで投入する。`NEXT_PUBLIC_SENTRY_DSN` は browser delivery に必要な公開前提 DSN だが、repository / log / PR body / screenshot に実値を残さない hygiene 対象として扱う。どちらも `wrangler.toml` には実値を書かない。

## 4. secret 配置設計（FR-3）

| secret | 環境 | 1Password 正本 |
| --- | --- | --- |
| `SENTRY_DSN_WEB` | staging | `op://UBM-Hyogo/Sentry Web DSN (staging)/dsn` |
| `SENTRY_DSN_WEB` | production | `op://UBM-Hyogo/Sentry Web DSN (production)/dsn` |
| `NEXT_PUBLIC_SENTRY_DSN` | staging | `op://UBM-Hyogo/Sentry Web DSN (staging)/public_dsn`（公開前提 DSN。repository / log / screenshot には実値を残さない） |
| `NEXT_PUBLIC_SENTRY_DSN` | production | `op://UBM-Hyogo/Sentry Web DSN (production)/public_dsn`（本タスクでは production deploy しない） |

> 補足: Sentry の DSN は server / browser で分けないプロジェクト構成も可能。本タスクでは parent task-03 の §0.6 / §0.7 で「Workers 用 `SENTRY_DSN`（=本タスクでは `SENTRY_DSN_WEB`）と Browser 用 `NEXT_PUBLIC_SENTRY_DSN` を別キー」と規定済みのため踏襲する。同一 DSN を両キーに格納する運用も許容（1Password item の同一 field を 2 secret として put）。

## 5. staging deploy 設計（FR-4）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

deploy 後 30 秒待機し、`curl -sSf -o /dev/null -w '%{http_code}\n'` で `/` および実 route `/members` を取得。staging URL は `apps/web/wrangler.toml` の `[env.staging]` で定義された route または `<worker-name>-staging.<account>.workers.dev` を使用（実 URL は phase-05 ランブックで確定）。

## 6. Sentry dashboard 観測設計（FR-5）

- staging deploy 後に意図的 throw を 2 経路で発火:
  - **server event**: G0 preflight で既存の Sentry init / capture 実装と安全な throw 経路が確認できた場合のみ利用する。未整備なら runtime evidence へ進まず、親 task-03 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま regression として戻す
  - **browser event**: ブラウザ DevTools console から `throw new Error('staging-smoke-' + Date.now())` を実行
- Sentry dashboard で `environment:staging` + `release:<deploy_id>` filter を適用し、各 event を 1 件以上確認
- screenshot は dashboard UI の event 一覧画面のみ（DSN URL を含む settings / project details 画面は撮らない）

## 7. grep gate 再走設計（FR-6）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
{
  if rg -n 'requestIdleCallback' apps/web/.open-next/; then
    echo 'FAIL: requestIdleCallback matches found'
    exit 1
  else
    echo 'PASS: requestIdleCallback 0 matches'
  fi
  if rg -n '@sentry/nextjs' apps/web/.open-next/; then
    echo 'FAIL: @sentry/nextjs matches found'
    exit 1
  else
    echo 'PASS: @sentry/nextjs 0 matches'
  fi
} | tee outputs/phase-11/evidence/grep-gate-runtime.log
```

両方とも 0 件であること。

## 8. 状態昇格設計（FR-7）

`task-03-w2-par-sentry-workers-sdk-unify.md` の冒頭メタテーブル「状態」行を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に更新。同時に `runtime-evidence-ref` 行を新設し、本ワークフローの `outputs/phase-11/main.md` への絶対パスを記載する。

## 9. 副作用 / 失敗時挙動

| 種別 | 内容 |
| --- | --- |
| 入力 | `SENTRY_DSN_WEB`（staging Secrets）, deploy id, dashboard 観測時刻 |
| 出力 | curl log, grep log, secret list log, dashboard screenshot, state 昇格 commit |
| 副作用 | Cloudflare Secrets staging / production への secret 追加（rotation 可能）, staging Worker のリリース版本更新, Sentry project に staging event の蓄積 |
| 失敗時 | (a) curl 200 不成立 → deploy log 確認 → 必要に応じて rollback。 (b) Sentry event 未受信 → DSN 投入確認 → `getEnv()` log 確認 → 二重 init ガード状態確認。 (c) grep gate 違反検出 → bundle 再解析（next.config の `serverExternalPackages` 等）→ 親 task-03 に regression として戻す |
