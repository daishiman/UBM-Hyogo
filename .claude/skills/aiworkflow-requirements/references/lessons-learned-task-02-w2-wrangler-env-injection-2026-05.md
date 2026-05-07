# task-02 W2 Wrangler Env Injection Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/task-02-w2-wrangler-env-injection/`

Task type: `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

## Lessons

### L-T02W2-001: getEnv() を経由しないと wrangler ↔ Next.js の env 二重定義が発生する

- Symptom: `apps/web` 配下で `process.env.X` を直接参照するコードと、`wrangler.toml` の `[vars]` 経由で注入される env が分岐し、local / staging / production のどこで壊れたか追えない状態になりがち。
- Cause: Next.js (Node 風 `process.env`) と Cloudflare Workers (binding) が両方使えてしまうため、開発者ごとに参照経路がブレる。
- Recurrence condition: 新規ページ/ルートで env を読むときに `getEnv()` の存在を知らずに `process.env` を直書き。
- 5-minute resolution: `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` を経由するルールを CLAUDE.md「シークレット管理」直下に明記し、grep gate (`rg "process\\.env" apps/web/src` の許可リスト管理) で fail させる。
- Evidence path: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-12/implementation-guide.md`

### L-T02W2-002: zod parse 失敗の挙動は呼び出し側ではなく error boundary に委譲する

- Symptom: `EnvSchema.parse()` が throw した時、呼び出し側で try/catch して握り潰すと runtime に壊れた env で起動してしまい、本番でだけ undefined 由来の挙動が出る。
- Cause: TypeScript の型上は `getEnv()` の戻り値が `Env` で確定するため、呼び出し側は throw を「異常系として握る」のが習慣的に正しいと感じてしまう。
- Recurrence condition: env を必須化したいが、起動を止めたくない開発者が catch で fallback 値を埋める。
- 5-minute resolution: `getEnv()` の throw は **握らず、`apps/web/src/app/error.tsx` (task-05 error boundary) で補足する** 設計を CLAUDE.md / lessons-learned に明記。env.test.ts に「fallback 化していないこと」のテストを残す。
- Evidence path: `apps/web/src/lib/__tests__/env.test.ts`

### L-T02W2-003: 公開 env (`NEXT_PUBLIC_*`) と内部 env を schema 上で分離する

- Symptom: ブラウザバンドルへ漏らしてはいけない値 (Auth secret, Sentry DSN_SERVER 等) が `NEXT_PUBLIC_` prefix なしで公開バンドルに混入するリスク。
- Cause: `next.config.ts` の `env` 渡しと `wrangler.toml [vars]` の二系統があり、どちらが client expose かが曖昧。
- Recurrence condition: 新規 env 追加時に「とりあえず動くから」で `NEXT_PUBLIC_` を付けて公開してしまう。
- 5-minute resolution: `getEnv()` (server-only) と `getPublicEnv()` (client expose) を **別 export** にして zod schema 自体を分離する。`NEXT_PUBLIC_*` のみを `getPublicEnv()` に通し、それ以外は server-only。Browser Sentry DSN の build-time hook 配線は task-03 (sentry-workers-sdk-unify) に委譲。
- Evidence path: `apps/web/src/lib/env.ts`

### L-T02W2-004: 非機密 vars と Cloudflare Secrets の管理場所を 1 箇所に集約する

- Symptom: `wrangler.toml [vars]` と `bash scripts/cf.sh secret put` の使い分けがドキュメント間で揺れて、staging で var として置いた値が production で secret として置かれる drift が発生。
- Cause: 「非機密だが環境差分のある値（`ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL`）」と「機密値（`AUTH_SECRET` / `SENTRY_DSN_*`）」の境界判断が個人の解釈に依存する。
- Recurrence condition: 新規 env を追加する PR で reviewer が境界判断を見落とす。
- 5-minute resolution: 非機密 var は `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` で管理、機密値は **必ず** `bash scripts/cf.sh secret put` で Cloudflare Secrets。`.dev.vars.example` には `op://Vault/Item/Field` 参照のみ。実値は absolutely never コミットしない。
- Evidence path: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-12/system-spec-update-summary.md`

### L-T02W2-005: NON_VISUAL platform/runtime config の Phase 11 evidence は build/test/grep/dry-run のハイブリッド

- Symptom: Phase 11 evidence 標準テンプレが「screenshot」前提のため、env 配線整備のような NON_VISUAL platform task でテンプレ流用しようとすると evidence が空になる。
- Cause: phase-template-phase11.md が UI 系を主眼とし、platform/runtime config 専用テンプレが未整備。
- Recurrence condition: 今後の同種 platform task (CI/CD 配線、binding 整備) で同じ judgement を毎回繰り返す。
- 5-minute resolution: `tsc --noEmit` exit 0、`pnpm lint` exit 0、`vitest --run` PASS、`rg '127\\.0\\.0\\.1:8888' apps/web/src` 0 件、`bash scripts/cf.sh dev` 出力の 5 evidence を NON_VISUAL platform 標準として記録。task-specification-creator skill にテンプレート追加余地を skill-feedback-report として残す。
- Evidence path: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-12/skill-feedback-report.md`
