# Task C — Cloudflare AUTH_SECRET parity 診断・投入・localhost焼き込みgate・staging /me smoke

- **[実装区分: 実装仕様書]**
- **implementation_mode:new**
- **責務（単一）**: staging における web↔api 間の `AUTH_SECRET` parity を「コードで」診断・投入し、localhost 焼き込みを CI で確実に検出し、`/me` runtime smoke で 401 回帰を検出できるようにする運用スクリプト群と CI gate を新設する。
- **lane**: phase-2 §Lane C
- **VISUAL 区分**: NON_VISUAL（UI 変更なし。bash script + CI workflow のみ）

---

## 0. 背景と根本原因（このタスクが解く問題）

ステージングでセッション取得が失敗する二次要因は、**web Worker（署名側）と api Worker（検証側）の `AUTH_SECRET` secret が同一値である保証がないこと**である。

| 役割 | コード | 期待 |
|------|--------|------|
| 署名 | `apps/web` Auth.js v5 → `encodeAuthSessionJwt(AUTH_SECRET)`（HS256） | web Worker の `AUTH_SECRET` |
| 検証 | `apps/api/src/middleware/me-session-resolver.ts:65` `verifySessionJwt(token, AUTH_SECRET)` / `require-admin.ts` | api Worker の `AUTH_SECRET` |

検証側の制約（実コード）:

- `apps/api/src/env.ts:128-129` — `AuthSecretEnvSchema = z.object({ AUTH_SECRET: z.string().trim().min(32, ...) })`。**api 側は 32 文字以上必須**。
- `apps/web/src/lib/env.ts:23` — `AUTH_SECRET: z.string().min(16).optional()`。**web 側は 16 文字以上で optional**。
- `me-session-resolver.ts:53-63` — `validateAuthSecretEnv` が throw すると `UBM-AUTH-SECRET-MISSING` を log して `return null` → 401。
- 不一致 / 32 未満 / 未投入のいずれでも `verifySessionJwt` が `null` を返し 401 になる。

> **不変条件（このタスクの設計の土台）**
> **両 Worker の `AUTH_SECRET` が「同一値」かつ「32 文字以上」でないと検証が必ず失敗して 401 になる。**
> web 側の min は 16 だが、**parity 投入時は api 側の min32 に合わせて 32 文字以上を強制する**（min16 のまま投入すると api 検証が落ちる）。

副次的な構造原因（S3 が CI で検出されなかった理由）:

- localhost 焼き込み防止の grep gate（CLAUDE.md task-18 で謳う `:8888` 検出）は、**専用 gate script として実在しない**ことを調査で確認した（`grep -rln "8888" .github/workflows scripts` で hit なし）。`apps/web/src` 配下には `http://127.0.0.1:8787` / `http://localhost:8787`（`verify-magic-link.ts:7`, `public.ts:21`）が実在し、`:8888` のみ見る前提では `:8787` / localhost を検出できない。**実在する焼き込みを検出できる gate を新設する**のがこのタスクの第 3 スコープ。

### L-AUTHSECRET-001（このタスクの最重要原則）

**presence ≠ usability。** `wrangler secret list` で `AUTH_SECRET` 行が「存在する」ことは確認できても、その値が web と一致し 32 文字以上であることは保証しない。**値の一致は値を表示せず、`/me` が 200 を返すことでのみ間接証明する**（CLAUDE.md シークレット管理: secret 値・token 値を出力 / doc に転記しない）。

---

## 1. CONST_005-① 変更/新規ファイル一覧（全て新規）

| # | パス | 種別 | 役割 | 副作用 |
|---|------|------|------|--------|
| 1 | `scripts/diagnose-auth-secret-parity.sh` | 新規 | web/api 両 staging worker の `AUTH_SECRET` presence + web 焼き込み base URL 整合を read-only 診断 | read-only |
| 2 | `scripts/cf-secret-put-auth-secret.sh` | 新規 | 同一値を web/api 両 staging worker へ投入し parity 担保（`--check` は長さ検証のみ dry-run） | **mutation（user-gated）** |
| 3 | `scripts/verify-no-localhost-bake.sh` | 新規 | `apps/web/src` ソース + build 済 client bundle への localhost/127.0.0.1:(8787\|8888) 焼き込み検出 grep gate | read-only |
| 4 | `scripts/verify-no-localhost-bake.spec.ts` | 新規 | 上記 gate の self-test（fixture で意図的混入を検出できることを保証） | read-only（test） |
| 5 | `scripts/smoke-staging-me.sh` | 新規 | storage-state / bearer で `GET .../api/me` → 200 + `user.memberId`、`/profile` の authenticated root DOM を検証 | **runtime read（user-gated 実走）** |
| 6 | `.github/workflows/verify-no-localhost-bake.yml` | 新規 | #3 を `verify-design-tokens` と同型の workflow gate として CI 実行 | read-only |

> #3 を `runtime-smoke-staging.yml` 等に inline する選択肢もあるが、`verify-design-tokens` 同様に **独立 gate workflow（#6）として切り出し**、dev/main の required status check 候補として登録しやすくする（実 `gh api -X PUT` は user 承認後・本タスク scope 外）。

---

## 2. CONST_005-② 各 script / CI job のインターフェース

### 2.1 `scripts/diagnose-auth-secret-parity.sh`（read-only 診断）

| 項目 | 内容 |
|------|------|
| 引数 | なし（環境は staging 固定。production 拡張は scope 外） |
| フラグ | `--json`（機械可読出力）、`-h/--help` |
| 環境変数 | なし（内部で `scripts/cf.sh` 経由 → op run が token を注入） |
| exit code | `0`=両 worker に AUTH_SECRET 存在 かつ web 焼き込み base URL が staging origin / `1`=presence 欠落 or 焼き込み不整合（AC-6: 欠落を非 0 報告） / `2`=cf.sh / op 前提不足 / `64`=usage |
| 出力原則 | **値・長さ・ハッシュ・断片を一切出さない。**「AUTH_SECRET: present / MISSING」の真偽のみ。 |

検査項目:
1. `bash scripts/cf.sh secret list --name ubm-hyogo-web-staging`（または `--config apps/web/wrangler.toml --env staging`）の JSON に `AUTH_SECRET` キーがあるか（presence のみ）。
2. 同様に `ubm-hyogo-api-staging` に `AUTH_SECRET` があるか。
3. `apps/web/wrangler.toml` の `[env.staging.vars]` の `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` が `localhost` / `127.0.0.1` を含まない（焼き込み base の二次検査）。
4. **値一致は判定不能**である旨を明示し、「parity の最終確認は `scripts/smoke-staging-me.sh` で `/me` 200 を確認すること（L-AUTHSECRET-001）」と案内して終了。

### 2.2 `scripts/cf-secret-put-auth-secret.sh`（投入ラッパ・user-gated）

| 項目 | 内容 |
|------|------|
| 引数 | なし |
| フラグ | `--from-op <op://Vault/Item/Field>`（1Password 参照から取得）／ stdin（`-` / パイプ）から値を読む ／ `--check`（dry-run: 長さ 32+ 検証のみ・**投入しない**） ／ `--web-only` / `--api-only`（既定は両方） ／ `-h/--help` |
| 環境変数 | `scripts/cf.sh` の op run 経由のみ。値そのものは引数 / 環境変数で平文化しない（op 参照 or stdin） |
| exit code | `0`=両 worker 投入成功 or `--check` 合格 / `1`=投入失敗 / `2`=長さ 32 未満 / `64`=usage / `78`=入力欠落（空 stdin / op 参照不正） |
| 副作用 | **両 staging worker への `secret put`（mutation）。`--check` 以外は user-gated。** |
| 出力原則 | 値を絶対に echo しない。`cf.sh secret put` は `printf '%s' | cf.sh secret put` で stdin 注入（`cf.sh` 346-364 行が空 stdin を 78 で拒否・`--dry-run` 対応済）。 |

要点:
- web/api **同一の 1 値**を両方へ投入することで parity を構造的に担保する。
- 投入前に **必ず 32 文字以上を検証**（web の min16 ではなく api の min32 に合わせる）。32 未満は exit 2 で投入前に止める。
- `--check` は長さ検証だけ行い、`cf.sh secret put ... --dry-run` に委譲（実投入なし）。

### 2.3 `scripts/verify-no-localhost-bake.sh`（grep gate・CI）

| 項目 | 内容 |
|------|------|
| 引数 | なし |
| フラグ | `--bundle-only` / `--src-only`（既定は両方）、`--self-test`、`-h/--help` |
| 環境変数 | `WEB_BUNDLE_DIR`（既定 `apps/web/.open-next/assets`）、`SELF_TEST_FIXTURE_DIR`（self-test 用） |
| exit code | `0`=焼き込みなし / `1`=焼き込み検出 / `64`=usage |
| 検出対象 | `localhost:(8787\|8888)` / `127.0.0.1:(8787\|8888)` |

allowlist 規約（誤検出を避けつつ実焼き込みを捕捉）:
- 検査対象は **`apps/web/src` の非テスト本番コード**（`*.spec.ts` / `*.test.ts` / `__tests__/` は除外。`public.spec.ts` 等は意図的 fixture）。
- `env.ts` の local fallback / `transport.ts`（public.ts 含む）の local 分岐に限り、**行末に `// localhost-allow:local-fallback` コメントが付いた行のみ許可**（`public.ts:21 DEFAULT_BASE_URL` 等は本タスクで当該コメント付与を別 lane に委ねるか、当 gate 導入時に annotate する前提を本仕様の DoD 注記に記す）。
- build 済 client bundle（`.open-next/assets/*.js`）に `localhost:8787` / `127.0.0.1` が**混入していたら無条件 fail**（client へ焼き込まれた時点で実害）。

### 2.4 `scripts/smoke-staging-me.sh`（staging runtime smoke・user-gated 実走）

| 項目 | 内容 |
|------|------|
| 引数 | `staging`（固定。他は exit 2） |
| フラグ | `--out-dir <path>`、`--ci-summary`、`-h/--help` |
| 環境変数 | `STAGING_WEB_BASE`（例 `https://ubm-hyogo-web-staging.daishimanju.workers.dev`）、`STAGING_API_BASE`、`STAGING_ME_BEARER`（または `STAGING_SESSION_COOKIE` / storage-state パス `STAGING_STORAGE_STATE`） |
| exit code | `0`=`/me` 200 + memberId 存在 + `/profile` authenticated / `1`=非 200 / 契約違反 / 再ログインカード表示 / `2`=引数・必須 env 欠落 |
| 副作用 | **staging への runtime read（GET のみ・D1 mutation なし）。実走は user-gated。** |
| 出力原則 | cookie / bearer / Set-Cookie を evidence に残さない（既存 `redact.sh` / runtime-smoke の redaction grep gate 同型）。 |

検査:
1. `GET ${STAGING_API_BASE}/me`（cookie or `Authorization: Bearer`）→ HTTP 200 かつ JSON `.user.memberId` が非空。401 なら parity 不一致 / secret 不整合として fail。
2. `GET ${STAGING_WEB_BASE}/profile` の HTML に `data-testid="profile-authenticated-root"` を含み、再ログイン誘導カード（例 `data-testid="profile-relogin-card"`）を**含まない**こと。
3. evidence（status code・redact 済 header）を `--out-dir` に出力。`--ci-summary` で `summary.json`。

> 既存基盤の活用: 認証付き staging は `apps/web/playwright/scripts/mint-staging-storage-state.ts` / `setup.staging-auth.ts` / `.github/workflows/playwright-staging-visual-authenticated.yml` が storage-state を mint する。bearer 経路は `scripts/smoke/mint-staging-bearers.mts`（`runtime-smoke-staging.yml` が `STAGING_AUTH_SECRET` 設定時に短命 JWT を mint）を再利用できる。**この smoke はこれらが供給する cookie/bearer を消費する側**で、新たな mint 実装は持たない。

### 2.5 CI job（`.github/workflows/verify-no-localhost-bake.yml`）

```
name: verify-no-localhost-bake
on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'apps/web/src/**'
      - 'apps/web/wrangler.toml'
      - 'scripts/verify-no-localhost-bake.sh'
      - 'scripts/verify-no-localhost-bake.spec.ts'
      - '.github/workflows/verify-no-localhost-bake.yml'
  push:
    branches: [main, dev]
permissions:
  contents: read
jobs:
  verify-no-localhost-bake:
    name: verify-no-localhost-bake
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - name: self-test (gate detects intentional bake)
        run: mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
      - name: build web (for bundle scan)
        run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare   # 実 script 名は build pipeline に合わせる
      - name: verify no localhost bake (src + bundle)
        run: bash scripts/verify-no-localhost-bake.sh
```

> bundle scan を含めると build が必要で重い。CI コスト判断で `--src-only`（PR 時）+ `--bundle-only`（push to dev/main 時のみ build 後実行）に分割してもよい。本仕様は両対応のフラグを必須とし、CI step 分割は実装者裁量とする。

---

## 3. CONST_005-③ 入出力 / 副作用（read-only と mutation の分離）

| script | 入力 | 出力 | 副作用分類 | user-gated |
|--------|------|------|-----------|------------|
| diagnose-auth-secret-parity.sh | cf.sh secret list / wrangler.toml | presence 真偽・exit code | read-only | No |
| cf-secret-put-auth-secret.sh `--check` | op 参照 / stdin | 長さ合否 | read-only | No |
| cf-secret-put-auth-secret.sh（実投入） | op 参照 / stdin | exit code のみ | **mutation** | **Yes** |
| verify-no-localhost-bake.sh | apps/web/src / bundle | 検出行（パスのみ・値は焼き込み URL のみ） | read-only | No |
| smoke-staging-me.sh（実走） | cookie/bearer + staging URL | status / redact 済 evidence | runtime read | **Yes** |

**secret 値非表示原則（全 script 共通）**: 値・長さ・ハッシュ・断片・cookie・bearer を stdout/stderr/evidence に出さない。診断は presence（真偽）と exit code のみ。parity の最終確認は `/me` 200 で間接証明（L-AUTHSECRET-001）。

### user-gated 境界（CONST_007 遵守）

CONST_007（実装・commit・PR・staging 実走は user 承認後）に従う。本タスクの **実行系のうち副作用を伴うものだけ** が user-gated 例外として明示される。理由と実施場所:

| 操作 | user-gated 理由 | 実施場所 |
|------|----------------|---------|
| `cf-secret-put-auth-secret.sh`（実投入） | Cloudflare staging worker の secret を書き換える mutation。誤投入で認証全断のリスク | ローカル（`scripts/cf.sh` 経由・op token 注入）。CI からは実行しない |
| `smoke-staging-me.sh`（実走） | 実 staging origin への runtime アクセス（read だが本番相当環境）。CONST_007 の staging 実走例外 | ローカル or `runtime-smoke-staging.yml` への job 追加（実 PUT は別途承認） |
| `gh api -X PUT`（required status check 登録） | branch protection の変更 | scope 外（user 承認後に別途） |

read-only（diagnose / `--check` / verify-no-localhost-bake / self-test）は **user-gated ではない**＝CI / pre-flight で無条件実行可。

---

## 4. CONST_005-④ テスト方針

| 対象 | テスト | 手段 |
|------|--------|------|
| verify-no-localhost-bake.sh | `scripts/verify-no-localhost-bake.spec.ts`（self-test） | vitest。fixture dir に `127.0.0.1:8787` / `localhost:8888` を含む `.js` / `.ts` を生成し、gate が exit 1 で検出すること、clean fixture では exit 0 を返すこと、allowlist コメント付き行は許容することを assert |
| 全 script | 構文 | `bash -n scripts/<name>.sh`（CI / pre-flight で 5 本まとめて） |
| diagnose / cf-secret-put `--check` | dry-run 経路 | `bash scripts/cf-secret-put-auth-secret.sh --check`（32+ 検証のみ・投入なし）、`diagnose` の `--json` 出力 schema 検証 |
| 全 script | static lint（任意） | `shellcheck scripts/<name>.sh`（導入されていれば） |
| smoke-staging-me.sh | 引数バリデーション | `staging` 以外で exit 2、必須 env 欠落で exit 2 を `bash -n` + 引数 unit（実走しない範囲）で確認 |

self-test fixture 設計（spec.ts 骨子）:
- `tmp/fixture-dirty/bake.js` = `const u="http://127.0.0.1:8787/x"` → 検出されること（exit 1）
- `tmp/fixture-clean/ok.js` = `const u="https://api.example.workers.dev"` → exit 0
- `tmp/fixture-allow/env.ts` = `const f="http://localhost:8787" // localhost-allow:local-fallback` → 許容（exit 0）

> 不変条件 #8: 新規 test は `*.spec.ts` のみ（`verify-no-localhost-bake.spec.ts`）。`*.test.ts` 禁止。

---

## 5. CONST_005-⑤ ローカル実行 / 検証コマンド

```bash
# 構文チェック（5 本）
for f in diagnose-auth-secret-parity cf-secret-put-auth-secret verify-no-localhost-bake smoke-staging-me; do
  bash -n "scripts/$f.sh"
done

# self-test（gate の検出能力）
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts

# grep gate 実走（src のみ → bundle 含む）
bash scripts/verify-no-localhost-bake.sh --src-only
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare && bash scripts/verify-no-localhost-bake.sh --bundle-only

# parity 診断（read-only・presence のみ）
bash scripts/diagnose-auth-secret-parity.sh --json

# 投入 dry-run（長さ検証のみ・投入しない）
printf '%s' "$SOME_32CHAR_VALUE" | bash scripts/cf-secret-put-auth-secret.sh --check

# shellcheck（任意）
shellcheck scripts/diagnose-auth-secret-parity.sh scripts/cf-secret-put-auth-secret.sh scripts/verify-no-localhost-bake.sh scripts/smoke-staging-me.sh
```

> **user-gated（承認後のみ実走）**
> ```bash
> # 同一値を web/api 両 staging worker へ投入（parity 担保・mutation）
> bash scripts/cf-secret-put-auth-secret.sh --from-op 'op://Employee/ubm-hyogo-env/AUTH_SECRET_STAGING'
> # /me runtime smoke（再ログイン回帰検出）
> STAGING_API_BASE=... STAGING_WEB_BASE=... STAGING_ME_BEARER=... bash scripts/smoke-staging-me.sh staging --ci-summary
> ```

---

## 6. CONST_005-⑥ DoD（Definition of Done）

| AC | 内容 | 検証 |
|----|------|------|
| AC-5 | `verify-no-localhost-bake.sh` が `:8787` / `localhost` / `127.0.0.1` の焼き込みを検出できる（`:8888` 限定ではない） | self-test spec が dirty fixture で exit 1・clean で exit 0。CI job `verify-no-localhost-bake` が dev/main PR で実行 |
| AC-6 | parity 診断が web/api いずれかの `AUTH_SECRET` presence 欠落を**非 0 で報告**する。実投入（mutation）は user-gated | `diagnose-auth-secret-parity.sh` の exit 1 経路。`cf-secret-put` 実投入が CONST_007 user-gated 表に明記され、`--check` のみ無条件実行可 |
| AC-7 | `smoke-staging-me.sh` が `/me` 200 + memberId 存在を検証し、401（parity 不一致）を検出できる。実走は user-gated | 引数/必須 env バリデーション unit。実走は承認後ローカル / CI job |
| 共通 | secret 値・token・cookie を出力 / doc / evidence に転記しない | redaction grep gate（既存同型）と presence-only 出力で担保 |
| 共通 | cf 系 CLI は全て `scripts/cf.sh` 経由（wrangler 直呼び禁止）。`.env` 実値を cat/read/grep しない | コードレビュー + 不変条件 |

---

## 7. user-gated 項目一覧（再掲・表）

| 項目 | 区分 | 承認後の実施者 | CONST_007 例外理由 |
|------|------|----------------|--------------------|
| `cf-secret-put-auth-secret.sh` 実投入 | mutation | ユーザー / 承認後 Claude | staging worker secret 書換（認証全断リスク） |
| `smoke-staging-me.sh` 実走 | runtime read | ユーザー / 承認後 Claude | 実 staging origin アクセス（staging 実走例外） |
| `runtime-smoke-staging.yml` への me-smoke job 追加の実 merge | CI 変更 | 承認後 | dev/main へ反映する PR |
| dev/main required status check への `verify-no-localhost-bake` 登録（`gh api -X PUT`） | branch protection | 承認後（read-only before JSON は取得可） | governance 変更（CLAUDE.md ブランチ戦略） |
| commit / push / PR 作成 | VCS | 承認後 | CONST_007 |

read-only（diagnose / `--check` / verify-no-localhost-bake / self-test / `bash -n`）は user-gated 対象外。

---

## 8. Cloudflare 設定変更を「コードで実行できる」script 雛形（bash 骨子）

> ユーザー明示要望に対応。**いずれも `scripts/cf.sh` 経由・値非表示・op 参照 / stdin 注入**。実投入・実走は user-gated。

### 8.1 diagnose-auth-secret-parity.sh（骨子）

```bash
#!/usr/bin/env bash
# AUTH_SECRET parity 診断（read-only）。値は一切表示しない（L-AUTHSECRET-001）。
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
JSON=0
case "${1:-}" in --json) JSON=1 ;; -h|--help) echo "usage: $0 [--json]"; exit 64 ;; esac

WEB_WORKER="ubm-hyogo-web-staging"
API_WORKER="ubm-hyogo-api-staging"

has_auth_secret() { # $1=--config path  $2=worker (presence のみ・値は読まない)
  local out
  # cf.sh secret list は JSON を返す。AUTH_SECRET キーの有無のみ grep。値は含まれない。
  out="$(bash "$REPO_ROOT/scripts/cf.sh" secret list --config "$1" --env staging 2>/dev/null || true)"
  printf '%s' "$out" | grep -q '"AUTH_SECRET"'
}

web_present=0; api_present=0
has_auth_secret "apps/web/wrangler.toml" "$WEB_WORKER" && web_present=1
has_auth_secret "apps/api/wrangler.toml" "$API_WORKER" && api_present=1

# 焼き込み base URL 二次検査（localhost 混入は presence と独立に fail 要因）
bake_ok=1
if grep -E '127\.0\.0\.1|localhost' apps/web/wrangler.toml \
     | grep -E 'API_BASE_URL' | grep -q staging; then bake_ok=0; fi

if [ "$JSON" = 1 ]; then
  printf '{"web_auth_secret_present":%s,"api_auth_secret_present":%s,"bake_ok":%s,"note":"value-parity-unverifiable-confirm-via-/me-200"}\n' \
    "$([ "$web_present" = 1 ] && echo true || echo false)" \
    "$([ "$api_present" = 1 ] && echo true || echo false)" \
    "$([ "$bake_ok" = 1 ] && echo true || echo false)"
else
  echo "web  AUTH_SECRET: $([ "$web_present" = 1 ] && echo present || echo MISSING)"
  echo "api  AUTH_SECRET: $([ "$api_present" = 1 ] && echo present || echo MISSING)"
  echo "bake base URL   : $([ "$bake_ok" = 1 ] && echo ok || echo LOCALHOST-DETECTED)"
  echo "note: 値の一致は判定不能。最終確認は scripts/smoke-staging-me.sh で /me 200 を確認すること。"
fi

[ "$web_present" = 1 ] && [ "$api_present" = 1 ] && [ "$bake_ok" = 1 ] || exit 1
```

### 8.2 cf-secret-put-auth-secret.sh（骨子）

```bash
#!/usr/bin/env bash
# 同一 AUTH_SECRET を web/api 両 staging worker へ投入し parity 担保。
# 値は op 参照 or stdin。echo しない。--check は長さ検証のみ（投入なし）。
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
MODE=put; SCOPE=both; FROM_OP=""
while [ $# -gt 0 ]; do case "$1" in
  --check) MODE=check ;;
  --from-op) FROM_OP="${2:-}"; shift ;;
  --web-only) SCOPE=web ;;
  --api-only) SCOPE=api ;;
  -h|--help) echo "usage: $0 [--from-op op://...] [--check] [--web-only|--api-only]"; exit 64 ;;
  *) echo "unknown: $1" >&2; exit 64 ;;
esac; shift; done

# 値取得: op 参照優先、なければ stdin
if [ -n "$FROM_OP" ]; then
  SECRET_VALUE="$(op read "$FROM_OP")"
else
  SECRET_VALUE="$(cat)"
fi
[ -n "$(printf '%s' "$SECRET_VALUE" | tr -d '[:space:]')" ] || { echo "empty secret input" >&2; exit 78; }

# 32+ 検証（api min32 に合わせる。web min16 ではなく強い方に合わせて parity 担保）
LEN="$(printf '%s' "$SECRET_VALUE" | wc -c | tr -d ' ')"
if [ "$LEN" -lt 32 ]; then echo "AUTH_SECRET must be >= 32 chars (got <32)" >&2; exit 2; fi

put_one() { # $1=config  $2=env-scope
  printf '%s' "$SECRET_VALUE" | bash "$REPO_ROOT/scripts/cf.sh" secret put AUTH_SECRET --config "$1" --env staging
}

if [ "$MODE" = check ]; then
  # cf.sh secret put --dry-run（空 stdin 拒否 + 長さは上で検証済み）
  [ "$SCOPE" != api ] && printf '%s' "$SECRET_VALUE" | bash "$REPO_ROOT/scripts/cf.sh" secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging --dry-run
  [ "$SCOPE" != web ] && printf '%s' "$SECRET_VALUE" | bash "$REPO_ROOT/scripts/cf.sh" secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging --dry-run
  echo "check ok: length>=32, both workers reachable (dry-run)"; exit 0
fi

# 実投入（user-gated）
[ "$SCOPE" != api ] && put_one apps/web/wrangler.toml
[ "$SCOPE" != web ] && put_one apps/api/wrangler.toml
echo "AUTH_SECRET applied to staging worker(s): $SCOPE (value not shown)"
```

### 8.3 verify-no-localhost-bake.sh（骨子）

```bash
#!/usr/bin/env bash
# apps/web/src 本番コード + build 済 client bundle への localhost 焼き込み検出。
set -euo pipefail
SCAN_SRC=1; SCAN_BUNDLE=1
BUNDLE_DIR="${WEB_BUNDLE_DIR:-apps/web/.open-next/assets}"
PATTERN='(localhost|127\.0\.0\.1):(8787|8888)'
ALLOW_TAG='localhost-allow:local-fallback'
while [ $# -gt 0 ]; do case "$1" in
  --src-only) SCAN_BUNDLE=0 ;; --bundle-only) SCAN_SRC=0 ;;
  --self-test) : ;; -h|--help) echo "usage: $0 [--src-only|--bundle-only]"; exit 64 ;;
esac; shift; done

fail=0

if [ "$SCAN_SRC" = 1 ]; then
  # 本番 src のみ（test/spec/__tests__ 除外）。allowlist タグ付き行は除外。
  hits="$(grep -REn "$PATTERN" apps/web/src \
    --include='*.ts' --include='*.tsx' \
    | grep -v -E '\.spec\.|\.test\.|/__tests__/' \
    | grep -v "$ALLOW_TAG" || true)"
  if [ -n "$hits" ]; then echo "::error::localhost baked into apps/web/src:"; echo "$hits"; fail=1; fi
fi

if [ "$SCAN_BUNDLE" = 1 ] && [ -d "$BUNDLE_DIR" ]; then
  # client bundle への混入は無条件 fail
  bhits="$(grep -REl "$PATTERN" "$BUNDLE_DIR" --include='*.js' || true)"
  if [ -n "$bhits" ]; then echo "::error::localhost baked into client bundle:"; echo "$bhits"; fail=1; fi
fi

exit "$fail"
```

### 8.4 smoke-staging-me.sh（骨子）

```bash
#!/usr/bin/env bash
# /me runtime smoke（401=parity 不一致を検出）。cookie/bearer は redact。
set -euo pipefail
[ "${1:-}" = staging ] || { echo "usage: $0 staging [--out-dir <p>] [--ci-summary]" >&2; exit 2; }
shift
OUT_DIR="docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-11/evidence"
while [ $# -gt 0 ]; do case "$1" in --out-dir) OUT_DIR="${2:-}"; shift ;; --ci-summary) : ;; esac; shift; done

: "${STAGING_API_BASE:?STAGING_API_BASE required}"
: "${STAGING_WEB_BASE:?STAGING_WEB_BASE required}"
AUTH_HEADER=()
if [ -n "${STAGING_ME_BEARER:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer ${STAGING_ME_BEARER}")
elif [ -n "${STAGING_SESSION_COOKIE:-}" ]; then AUTH_HEADER=(-H "Cookie: ${STAGING_SESSION_COOKIE}")
else echo "STAGING_ME_BEARER or STAGING_SESSION_COOKIE required" >&2; exit 2; fi

mkdir -p "$OUT_DIR"
code="$(curl -s -o "$OUT_DIR/me-body.json" -w '%{http_code}' "${AUTH_HEADER[@]}" "${STAGING_API_BASE}/me")"
echo "GET /me -> $code"
[ "$code" = 200 ] || { echo "::error::/me returned $code (parity/secret mismatch?)"; exit 1; }
grep -q '"memberId"' "$OUT_DIR/me-body.json" || { echo "::error::/me 200 but no memberId"; exit 1; }

phtml="$(curl -s "${AUTH_HEADER[@]}" "${STAGING_WEB_BASE}/profile")"
echo "$phtml" | grep -q 'data-testid="profile-authenticated-root"' || { echo "::error::/profile not authenticated"; exit 1; }
echo "$phtml" | grep -q 'data-testid="profile-relogin-card"' && { echo "::error::/profile shows relogin card"; exit 1; }

# evidence から cookie/bearer を含む値が残らないよう本 script は body と status のみ保存（header は保存しない）
echo "smoke ok: /me 200 + memberId + /profile authenticated"
```

> 上記はすべて雛形（骨子）。実装時に `cf.sh secret list` の実 JSON 形状、`/profile` の実 testid、build script 名を確認して確定する。

---

## 9. 不変条件遵守チェック

- [x] cf 系 CLI は `scripts/cf.sh` 経由（wrangler 直呼びなし）
- [x] `.env` 実値を cat/read/grep しない（op 参照 / stdin のみ）
- [x] secret 値・token 値・cookie を出力 / doc に転記しない（presence-only / redact）
- [x] D1 直接アクセスなし（apps/web から D1 binding 禁止に抵触しない・本タスクは script のみ）
- [x] 新規 test は `*.spec.ts` のみ（#8 invariant）
- [x] CONST_007: 実投入・staging 実走・commit/PR/branch protection 変更は user-gated（§7）
