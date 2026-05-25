# Phase 5: 実装

> automation-30 改善により、本 Phase の手順は同一 wave で実コードへ反映済み。Cloudflare staging 実走・commit・push・PR のみ user-gated。

## 新規作成 / 修正ファイル一覧（Feedback RT-03 必須記載）

| 区分 | パス | 概要 |
| ---- | ---- | ---- |
| EDIT | `scripts/cf.sh` | `tail` subcommand を case dispatch に追加 |
| NEW  | `scripts/smoke/mint-staging-session-cookie.mts` | `/admin` 2 層通過 session cookie を mint |
| NEW  | `scripts/smoke/runtime-admin-web.sh` | authenticated `/admin` GET 200 + boundary log grep gate |
| EDIT | `.github/workflows/web-cd.yml` | `admin-runtime-smoke` job 追加（`needs: deploy-staging`） |
| NEW  | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | mint helper unit test（Phase 4） |
| NEW  | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | runner contract test（Phase 4） |

## Step 0: token 互換性の実測確定（Phase 1 未確定点の解消）

実装着手前に分岐 A/B を確定する（read-only、値は出力しない）:

```bash
rg -n "session\s*:|strategy|jwt\s*:|encode|decode|maxAge" apps/web/src/lib/auth.ts
rg -n "decodeAuthSessionJwt|signSessionJwt|encode|decode" packages/shared/src/auth.ts
rg -n "session-token|__Secure|cookieName|salt" apps/web/middleware.ts apps/web/src/lib/auth.ts
```

- middleware と layout が同一 custom JWT → **分岐 A**（`signSessionJwt` 再利用）。
- layout が Auth.js default（JWE）→ **分岐 B**（`@auth/core/jwt encode` 使用）。

## Step 1: `scripts/cf.sh` に `tail` subcommand を追加（EDIT）

既存 case dispatch（`deploy` / `secret` / `d1` 等と同じブロック）へ次を追加する。既存の `op run` ラップ / `ESBUILD_BINARY_PATH` / `mise exec --` 経路を必ず踏襲する。

```bash
# scripts/cf.sh の subcommand dispatch に追加（疑似コード）
tail)
  shift
  # 引数例: <worker-name> --env staging --format json [--seconds N]
  # CI で常駐 stream を打ち切るため timeout でラップ（既定 25s）。
  TAIL_SECONDS="${CF_TAIL_SECONDS:-25}"
  # 既存ヘルパ run_wrangler（op run + esbuild + mise 経由）に委譲。
  # wrangler tail は SIGINT/timeout で正常終了する。
  run_wrangler_with_timeout "$TAIL_SECONDS" tail "$@"
  ;;
```

要件:
- `wrangler` を直接呼ばず、既存の内部ヘルパ（他 subcommand が使う wrapper 関数）経由にする。
- `--format json` を既定推奨にし、runner が jq で解析できるようにする。
- 出力は runner 側で redact.sh を通す前提（cf.sh は raw を返す）。
- `timeout`（coreutils）が無い macOS local 用に `gtimeout` fallback、または bash `read -t` ループで打ち切る実装を許容。

## Step 2: `scripts/smoke/mint-staging-session-cookie.mts`（NEW）

`mint-staging-bearers.mts` を雛形に、`/admin` 2 層を通過する **session cookie 文字列**を生成する。JWT/cookie 値は GITHUB_OUTPUT への追記のみ（echo 禁止）。

```typescript
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { signSessionJwt } from "@ubm-hyogo/shared";
import type { MemberId } from "@ubm-hyogo/shared";
// 分岐 B の場合のみ:
// import { encode } from "@auth/core/jwt";

const DEFAULT_TTL_SECONDS = 600;
const SESSION_COOKIE_NAME = "__Secure-authjs.session-token";

export interface MintSessionCookieInput {
  authSecret: string;
  memberId: string;
  email: string;
  isAdmin: boolean;
  ttlSeconds?: number;
}

// 純粋関数: env を引数で受け取り cookie 文字列を返す（test 可能化、process.env を読まない）。
export async function mintStagingSessionCookie(input: MintSessionCookieInput): Promise<string> {
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  // 分岐 A: middleware/layout が同一 custom JWT の場合
  const token = await signSessionJwt(input.authSecret, {
    memberId: input.memberId as MemberId,
    email: input.email,
    isAdmin: input.isAdmin,
    ttlSeconds,
  });

  // 分岐 B（layout が Auth.js JWE session を要求する場合）に切替:
  // const token = await encode({
  //   token: { sub: input.memberId, email: input.email, isAdmin: input.isAdmin },
  //   secret: input.authSecret,
  //   salt: SESSION_COOKIE_NAME,            // Auth.js v5: cookie 名を salt に使う
  //   maxAge: ttlSeconds,
  // });

  // cookie 文字列（curl -H "Cookie: ..." に渡す）。
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function main(): Promise<void> {
  const required = {
    STAGING_AUTH_SECRET: process.env.STAGING_AUTH_SECRET,
    STAGING_ADMIN_MEMBER_ID: process.env.STAGING_ADMIN_MEMBER_ID,
    STAGING_ADMIN_EMAIL: process.env.STAGING_ADMIN_EMAIL,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    process.stderr.write(`mint-staging-session-cookie: missing env: ${missing.join(", ")}\n`);
    process.exit(2);
  }

  const cookie = await mintStagingSessionCookie({
    authSecret: required.STAGING_AUTH_SECRET!,
    memberId: required.STAGING_ADMIN_MEMBER_ID!,
    email: required.STAGING_ADMIN_EMAIL!,
    isAdmin: true,
    ttlSeconds: process.env.MINT_TTL_SECONDS ? Number(process.env.MINT_TTL_SECONDS) : DEFAULT_TTL_SECONDS,
  });

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `admin_session_cookie=${cookie}\n`);
  } else {
    process.stderr.write("mint-staging-session-cookie: GITHUB_OUTPUT not set; nothing written\n");
  }
}

const entry = process.argv[1] ?? "";
const isCliEntry = entry !== "" && import.meta.url === pathToFileURL(entry).href;
if (isCliEntry) {
  await main();
}
```

## Step 3: `scripts/smoke/runtime-admin-web.sh`（NEW）

`runtime-attendance-provider.sh` を雛形に、web `/admin` probe を実装する。要点のみ（雛形の `assert_staging_target` / `fail_and_exit` / redact / summary 機構を踏襲）。

```bash
#!/usr/bin/env bash
# admin web runtime smoke runner（authenticated /admin の Server Components render regression gate）。
# Usage: runtime-admin-web.sh staging [--out-dir <path>] [--ci-summary]
# Required env: STAGING_WEB_BASE / STAGING_ADMIN_SESSION_COOKIE / (optional) STAGING_WORKER_NAME
set -euo pipefail

# ... 引数 parse（env=staging 固定、--out-dir, --ci-summary）は雛形踏襲 ...
: "${STAGING_WEB_BASE:?STAGING_WEB_BASE is required}"
: "${STAGING_ADMIN_SESSION_COOKIE:?STAGING_ADMIN_SESSION_COOKIE is required}"

BASE="${STAGING_WEB_BASE%/}"
RENDER_ERROR_MARKER="An error occurred in the Server Components render"
DIGEST="167275886"

assert_staging_target() {
  local allow_regex="${STAGING_WEB_HOST_ALLOW_REGEX:-staging|127\\.0\\.0\\.1|localhost}"
  printf '%s\n' "$BASE" | grep -Eiq "$allow_regex" \
    || fail_and_exit "target-allowlist" "000" "STAGING_WEB_BASE must match $allow_regex"
}

start_tail() {
  local worker="${STAGING_WORKER_NAME:-ubm-hyogo-web-staging}"
  CF_TAIL_SECONDS="${CF_TAIL_SECONDS:-25}" \
    bash "$REPO_ROOT/scripts/cf.sh" tail "$worker" --env staging --format json > "$TMP_DIR/tail.json" 2>&1 &
  TAIL_PID="$!"
}

probe_admin() {
  local body_file="$TMP_DIR/admin.body"
  local status
  set +e
  status="$(curl -sS --max-time 30 -o "$body_file" -w "%{http_code}" \
    -H "Cookie: $STAGING_ADMIN_SESSION_COOKIE" "$BASE/admin")"
  [[ $? -ne 0 ]] && status="000"
  set -e

  if [[ "$status" == "302" || "$status" == "307" ]]; then
    fail_and_exit "admin-get" "$status" "expected 200" "auth-token-invalid-or-expired"
  fi
  if [[ "$status" == "403" ]]; then
    fail_and_exit "admin-get" "$status" "expected 200" "auth-not-admin"
  fi
  if [[ "$status" != "200" ]]; then
    fail_and_exit "admin-get" "$status" "expected 200"
  fi
  # body に production render-error marker が出ていないこと。
  if grep -qF "$RENDER_ERROR_MARKER" "$body_file"; then
    fail_and_exit "admin-render" "$status" "no render error marker" "server-components-render-error"
  fi
collect_tail() {
  wait "$TAIL_PID" || true
  # redact してから検査（token/account-id を log に残さない）。
  bash "$SCRIPT_DIR/redact.sh" < "$TMP_DIR/tail.json" > "$TMP_DIR/tail.redacted.json" || true
  if grep -Eq "error\\.boundary\\.caught|\"scope\"\\s*:\\s*\"admin\"|$DIGEST" "$TMP_DIR/tail.redacted.json"; then
    fail_and_exit "admin-boundary-log" "200" "no error.boundary.caught" "server-components-render-error"
  fi
}

assert_staging_target
# tail を先に開始してから probe し、probe 中の render-error log を取り逃がさない（R3 対策）。
start_tail
probe_admin
collect_tail
echo "admin web runtime smoke PASS"
```

実装ノート:
- `fail_and_exit` / `request_json` / `write_summary` / `REDACT` 等の関数・変数は `runtime-attendance-provider.sh` から共通化（必要なら `scripts/smoke/lib/` へ抽出可。ただし初回は複製＋差分で可）。
- R3（cold start で log が乗らない）対策: `cf.sh tail` を background 起動してから probe し、probe 後に tail を回収する。probe→tail 順は採用しない。
- 200 でも `<RENDER_ERROR_MARKER>` 検出時は FAIL（client-side boundary が body に marker を出すケースを拾う）。

## Step 4: `.github/workflows/web-cd.yml` に gate job 追加（EDIT）

`deploy-staging` job の後に `admin-runtime-smoke` を追加。`runtime-smoke-staging.yml` の job 構造を踏襲（graceful skip / mask / redaction gate / artifact / Slack）。

> **env scope 不変条件（`scripts/__tests__/workflow-env-scope.test.sh` の `assert_no_job_level_cf_token`）**:
> `CLOUDFLARE_API_TOKEN` は **job-level `env:` に置かず**、これを必要とする step だけに step-scoped env として渡す（setup/install step への漏洩防止）。
> 本 gate に違反するため、token は prereq チェック step と smoke 実行 step の step-level env に限定する。`CLOUDFLARE_ACCOUNT_ID`（`vars`）は flag 対象外のため job-level 可。

```yaml
  admin-runtime-smoke:
    if: github.ref_name == 'dev'
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: staging-runtime-smoke
    timeout-minutes: 10
    permissions:
      contents: read
    env:
      STAGING_WEB_BASE: ${{ secrets.STAGING_WEB_BASE }}
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
      STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
      STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
      STAGING_WORKER_NAME: ubm-hyogo-web-staging
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
      # CLOUDFLARE_API_TOKEN は job-level に置かない（env-scope gate）。step-level env で prereq / smoke step にだけ渡す。
    steps:
      - uses: actions/checkout@v4

      # secret 未設定環境では gate を skip（AC-8 graceful skip）。
      - name: check gate prerequisites
        id: prereq
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          if [ -z "${STAGING_WEB_BASE:-}" ] || [ -z "${STAGING_AUTH_SECRET:-}" ]; then
            echo "::warning::admin-runtime-smoke skipped (STAGING_WEB_BASE/STAGING_AUTH_SECRET unset)"
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - uses: ./.github/actions/setup-project
        if: steps.prereq.outputs.skip == 'false'
        with:
          setup-strategy: mise

      - name: mint admin session cookie
        if: steps.prereq.outputs.skip == 'false'
        env:
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" mise exec -- pnpm exec tsx scripts/smoke/mint-staging-session-cookie.mts
          cookie="$(grep '^admin_session_cookie=' "$mint_out" | tail -n1 | cut -d= -f2-)"
          rm -f "$mint_out"
          echo "::add-mask::$cookie"
          echo "STAGING_ADMIN_SESSION_COOKIE=$cookie" >> "$GITHUB_ENV"

      - name: run admin web runtime smoke
        if: steps.prereq.outputs.skip == 'false'
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # cf.sh tail 用（step-scoped）
        run: |
          mkdir -p ci-evidence
          bash scripts/smoke/runtime-admin-web.sh staging --out-dir ci-evidence --ci-summary

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
          name: admin-runtime-smoke-${{ github.run_id }}
          path: ci-evidence/
          retention-days: 30

      - name: post failure summary to Slack
        if: ${{ failure() && steps.prereq.outputs.skip == 'false' && hashFiles('ci-evidence/summary.json') != '' }}
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: bash scripts/smoke/ci-summary-post.sh ci-evidence
```

## 実装順序

1. Step 0（token 互換性確定）→ A/B 確定
2. Step 1（cf.sh tail）→ `bash scripts/cf.sh tail --help` 相当が動く
3. Step 2（mint helper）→ `mint-staging-session-cookie.spec.ts` GREEN
4. Step 3（runner）→ `runtime-admin-web.test.sh` GREEN
5. Step 4（web-cd job）→ yaml lint / actionlint
6. `pnpm typecheck` / `pnpm lint` GREEN

## 完了判定

- [x] 6 ファイルの実装を完了し手順も仕様化
- [x] A/B 分岐の実装指針を明記
- [x] graceful skip（AC-8）を job に組込む
