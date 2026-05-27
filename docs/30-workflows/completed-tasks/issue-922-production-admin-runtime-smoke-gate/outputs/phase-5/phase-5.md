# Phase 5: 実装

> 本 Phase の手順は同一 wave で実コードへ反映する。Cloudflare production 実走・production-runtime-smoke Environment secret 投入・main required status check PUT・意図的 throw regression evidence・commit / push / PR のみ user-gated。

## 新規作成 / 修正ファイル一覧（Feedback RT-03 必須記載）

| 区分 | パス | 概要 |
| ---- | ---- | ---- |
| EDIT | `scripts/smoke/runtime-admin-web.sh` | env を `staging\|production` 受理に拡張、`resolve_env_vars()` で host / worker / cookie env / allowlist を切替 |
| EDIT | `scripts/smoke/mint-staging-session-cookie.mts` | CLI 引数で env prefix を切替、`resolveEnvPrefix()` 純粋関数を追加 |
| EDIT | `.github/workflows/web-cd.yml` | `admin-runtime-smoke-production` job 追加（`needs: deploy-production`、`if: github.ref_name == 'main'`、`environment: production-runtime-smoke`）|
| EDIT | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | production env path / allowlist / cross-env leak / render fail path / worker default source guard を追加（Phase 4 TC-PA〜PH）|
| EDIT | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | production/staging CLI prefix routing + missing env + `resolveEnvPrefix` を追加（Phase 4 TC-P1〜P7）|

## Step 1: `scripts/smoke/runtime-admin-web.sh` を env-aware に一般化

既存 staging gate の頭出し部を次のように書き換える（疑似コード）:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 引数: <staging|production> [--out-dir <path>] [--ci-summary]
ENVIRONMENT="${1:-}"
if [[ -z "$ENVIRONMENT" ]]; then
  echo "::error::env required (staging or production)" >&2
  exit 2
fi
shift || true

case "$ENVIRONMENT" in
  staging|production) ;;
  *)
    echo "Only staging or production runtime smoke is allowed" >&2
    exit 2
    ;;
esac

resolve_env_vars() {
  case "$ENVIRONMENT" in
    staging)
      : "${STAGING_WEB_BASE:?STAGING_WEB_BASE is required}"
      : "${STAGING_ADMIN_SESSION_COOKIE:?STAGING_ADMIN_SESSION_COOKIE is required}"
      BASE="${STAGING_WEB_BASE%/}"
      ADMIN_SESSION_COOKIE="$STAGING_ADMIN_SESSION_COOKIE"
      WORKER_NAME="${STAGING_WORKER_NAME:-ubm-hyogo-web-staging}"
      TARGET_ALLOW_REGEX="${STAGING_WEB_HOST_ALLOW_REGEX:-staging|127\\.0\\.0\\.1|localhost}"
      ;;
    production)
      : "${PRODUCTION_WEB_BASE:?PRODUCTION_WEB_BASE is required}"
      : "${PRODUCTION_ADMIN_SESSION_COOKIE:?PRODUCTION_ADMIN_SESSION_COOKIE is required}"
      BASE="${PRODUCTION_WEB_BASE%/}"
      ADMIN_SESSION_COOKIE="$PRODUCTION_ADMIN_SESSION_COOKIE"
      WORKER_NAME="${PRODUCTION_WORKER_NAME:-ubm-hyogo-web-production}"
      TARGET_ALLOW_REGEX="${PRODUCTION_WEB_HOST_ALLOW_REGEX:-ubm-hyogo-web-production\\.|workers\\.dev}"
      ;;
  esac
}

resolve_env_vars

assert_target() {
  printf '%s\n' "$BASE" | grep -Eiq "$TARGET_ALLOW_REGEX" \
    || fail_and_exit "target-allowlist" "000" "BASE must match $TARGET_ALLOW_REGEX for $ENVIRONMENT"
}

start_tail() {
  CF_TAIL_SECONDS="${CF_TAIL_SECONDS:-25}" \
    bash "$REPO_ROOT/scripts/cf.sh" tail "$WORKER_NAME" --env "$ENVIRONMENT" --format json > "$TMP_DIR/tail.json" 2>&1 &
  TAIL_PID="$!"
}

# probe_admin / collect_tail は既存と完全同一（ADMIN_SESSION_COOKIE 変数を使う）
```

要件:
- 既存 staging gate の挙動を**完全に保つ**（env=staging 経路は staging gate と同 env 変数を読む）。
- production 経路では `PRODUCTION_*` 変数のみ読む（cross-env leak 防止）。
- production target allowlist は `ubm-hyogo-web-production` worker 名 + `workers.dev` で limit する。

## Step 2: `scripts/smoke/mint-staging-session-cookie.mts` の env prefix 一般化

```typescript
type RuntimeSmokeEnv = "staging" | "production";

export function resolveEnvPrefix(env: string): string {
  if (env === "staging") return "STAGING";
  if (env === "production") return "PRODUCTION";
  throw new Error(`unsupported runtime smoke env: ${env}`);
}

async function main(): Promise<void> {
  const env = process.argv[2] ?? "staging";
  const prefix = resolveEnvPrefix(env);

  const required = {
    [`${prefix}_AUTH_SECRET`]: process.env[`${prefix}_AUTH_SECRET`],
    [`${prefix}_ADMIN_MEMBER_ID`]: process.env[`${prefix}_ADMIN_MEMBER_ID`],
    [`${prefix}_ADMIN_EMAIL`]: process.env[`${prefix}_ADMIN_EMAIL`],
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    process.stderr.write(`mint-staging-session-cookie: missing env: ${missing.join(", ")}\n`);
    process.exit(2);
  }

  const cookie = await mintStagingSessionCookie({
    authSecret: required[`${prefix}_AUTH_SECRET`]!,
    memberId: required[`${prefix}_ADMIN_MEMBER_ID`]!,
    email: required[`${prefix}_ADMIN_EMAIL`]!,
    isAdmin: true,
    ttlSeconds: process.env.MINT_TTL_SECONDS ? Number(process.env.MINT_TTL_SECONDS) : DEFAULT_TTL_SECONDS,
  });

  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `admin_session_cookie=${cookie}\n`);
}
```

要件:
- 純粋関数 `mintStagingSessionCookie(input)` は変更なし（test 安定）。
- `main()` の CLI 引数取得部のみ prefix 切替。
- 引数未指定時の既定は `staging`（後方互換）。
- 未知 env は `resolveEnvPrefix` で throw（fail-fast）。

## Step 3: `.github/workflows/web-cd.yml` に gate job 追加（EDIT）

`deploy-production` job の後に `admin-runtime-smoke-production` を配置。staging job と構造同型（graceful skip / mask / redaction gate / artifact / Slack）。

```yaml
  admin-runtime-smoke-production:
    if: github.ref_name == 'main'
    needs: deploy-production
    runs-on: ubuntu-latest
    environment: production-runtime-smoke
    timeout-minutes: 10
    permissions:
      contents: read
    env:
      PRODUCTION_WEB_BASE: ${{ secrets.PRODUCTION_WEB_BASE }}
      PRODUCTION_AUTH_SECRET: ${{ secrets.PRODUCTION_AUTH_SECRET }}
      PRODUCTION_ADMIN_MEMBER_ID: ${{ secrets.PRODUCTION_ADMIN_MEMBER_ID }}
      PRODUCTION_ADMIN_EMAIL: ${{ secrets.PRODUCTION_ADMIN_EMAIL }}
      CF_WORKER_NAME: ubm-hyogo-web-production
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
      # CLOUDFLARE_API_TOKEN は job-level に置かない（env-scope gate）。step-level env で渡す。
    steps:
      - uses: actions/checkout@v4

      - name: check gate prerequisites
        id: prereq
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          if [ -z "${PRODUCTION_WEB_BASE:-}" ] || [ -z "${PRODUCTION_AUTH_SECRET:-}" ]; then
            echo "::warning::admin-runtime-smoke-production skipped (PRODUCTION_WEB_BASE/PRODUCTION_AUTH_SECRET unset)"
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - uses: ./.github/actions/setup-project
        if: steps.prereq.outputs.skip == 'false'
        with:
          setup-strategy: mise

      - name: mint admin session cookie (production)
        if: steps.prereq.outputs.skip == 'false'
        env:
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" mise exec -- pnpm exec tsx scripts/smoke/mint-staging-session-cookie.mts production
          cookie="$(grep '^admin_session_cookie=' "$mint_out" | tail -n1 | cut -d= -f2-)"
          rm -f "$mint_out"
          echo "::add-mask::$cookie"
          echo "PRODUCTION_ADMIN_SESSION_COOKIE=$cookie" >> "$GITHUB_ENV"

      - name: run admin web runtime smoke (production)
        if: steps.prereq.outputs.skip == 'false'
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          mkdir -p ci-evidence
          bash scripts/smoke/runtime-admin-web.sh production --out-dir ci-evidence --ci-summary

      - name: redaction grep gate
        if: ${{ always() && steps.prereq.outputs.skip == 'false' }}
        run: |
          leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|__Secure-authjs|hooks\.slack\.com/services/[A-Z0-9]|xox[bp]-' ci-evidence/ || true)"
          if [ -n "$leak_files" ]; then
            echo "::error::redaction grep gate failed"
            printf '%s\n' "$leak_files" | sed 's#^#leak-candidate-file=#'
            exit 1
          fi

      - name: upload evidence artifact
        if: ${{ always() && steps.prereq.outputs.skip == 'false' }}
        uses: actions/upload-artifact@v4
        with:
          name: admin-runtime-smoke-production-${{ github.run_id }}
          path: ci-evidence/
          retention-days: 30

      - name: post failure summary to Slack
        if: ${{ failure() && steps.prereq.outputs.skip == 'false' && hashFiles('ci-evidence/summary.json') != '' }}
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: bash scripts/smoke/ci-summary-post.sh ci-evidence
```

## Step 4: test ファイルへ production env path を追加

Phase 4 で定義した TC-PA〜PH（shell）と TC-P1〜P7（vitest）を、既存 test ファイルへ追記する。
既存 staging test は無改変で残し、production env path のケースを追加するのみ。

## 実装順序

1. Step 2（mint helper env-aware）→ `mint-staging-session-cookie.spec.ts` GREEN（既存 + 新規）
2. Step 1（runner env-aware）→ `runtime-admin-web.test.sh` GREEN（既存 + 新規）
3. Step 3（web-cd production job）→ actionlint pass
4. Step 4（test 拡充）→ Phase 4 全 expected GREEN
5. `pnpm typecheck` / `pnpm lint` GREEN

## 完了判定

- [x] 5 ファイルの実装/拡張手順を仕様化
- [x] env prefix routing strict（cross-env leak 防止）を実装に組込み
- [x] graceful skip（AC-6）と production target allowlist を job / runner に組込み
