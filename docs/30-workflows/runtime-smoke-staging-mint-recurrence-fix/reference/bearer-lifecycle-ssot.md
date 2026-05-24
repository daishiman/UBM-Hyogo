# Bearer ライフサイクル SSOT（runtime-smoke-staging）

> このファイルは `runtime-smoke-staging / smoke` が使う bearer（admin / me）と署名鍵の
> ライフサイクル・同期不変条件・診断ディシジョンツリーの**唯一の正本**である。
> smoke が 401 / 403 / 500 で fail した時、または鮮度ゲートが loud fail した時は、
> まずこの SSOT のディシジョンツリー（§4）を参照して次アクションを一意に決める。
>
> **このファイルに実 secret 値・実 JWT 文字列・署名鍵を記載しない。** 値の管理場所は
> 1Password / GitHub 環境 secret / Cloudflare secret であり、本 SSOT は構造と手順のみを記録する。

---

## 1. bearer の正体

`runtime-smoke-staging / smoke` が staging API に送る bearer は **HS256 で署名された session JWT** である。
発行・検証は `packages/shared/src/auth.ts` の以下 2 関数が単一実装として担う。

| 関数 | シグネチャ | パス:行 | 役割 |
|---|---|---|---|
| `signSessionJwt` | `(secret: string, input: SignJwtInput) => Promise<string>` | `packages/shared/src/auth.ts:93` | HS256 で JWT を署名発行 |
| `verifySessionJwt` | `(token: string, secret: string, nowSeconds?: number) => Promise<SessionJwtClaims \| null>` | `packages/shared/src/auth.ts:127` | 署名・`exp` を検証。失敗時 `null` |

JWT の claims は `SessionJwtClaims`（`packages/shared/src/auth.ts:23`）であり、
`sub` / `memberId` / `isAdmin` / `email` / `iat` / `exp`（任意で `name`）を含む。
staging API 側は `apps/api` の `require-admin` middleware が `verifySessionJwt(token, AUTH_SECRET)` を呼び、
`null`（署名 mismatch または `exp <= now`）なら 401 `unauthorized` を返す。

---

## 2. TTL（有効期限）一覧

bearer は 2 系統あり、TTL が異なる。

| bearer 系統 | TTL | 定数 / 既定値 | パス:行 | 失効するか |
|---|---|---|---|---|
| **静的 fallback bearer**（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`、GitHub 環境 secret に手動登録） | **86400 秒（24 時間）** | `SESSION_JWT_TTL_SECONDS = 24 * 60 * 60` | `packages/shared/src/auth.ts:42` | **する。** 登録から 24 時間後に `exp <= now` となり 401 へ退行 |
| **minted bearer**（CI 実行時に `STAGING_AUTH_SECRET` から発行） | **600 秒（10 分）** | `DEFAULT_TTL_SECONDS = 600` | `scripts/smoke/mint-staging-bearers.mts:18` | **実質しない。** smoke 実行ごとに新規発行され、CI job（`timeout-minutes: 10`）内で失効しない |

> 24h TTL の静的 bearer に依存している限り、登録から 24 時間で必ず再び失効する。
> minted bearer（実行毎発行）に切り替えると失効は原理的に起きなくなる（§6）。

---

## 3. secret 同期不変条件

minted bearer 経路を有効化する場合、**署名鍵と検証鍵が同一値**でなければ署名検証が通らず 401 になる。

```
mint 鍵                              検証鍵
STAGING_AUTH_SECRET            ≡     staging API の AUTH_SECRET
(GitHub 環境 secret)                 (Cloudflare secret)
staging-runtime-smoke 環境           apps/api staging binding
```

| 項目 | 内容 |
|---|---|
| **不変条件** | `STAGING_AUTH_SECRET`（GitHub 環境 secret）の値 = staging API `AUTH_SECRET`（Cloudflare secret）の値 |
| **不一致時の症状** | mint が成功し JWT 形式は正しいが、staging API の `verifySessionJwt` で署名が一致せず 401 `unauthorized`。この時 JWT の `exp` は未来（`exp > now`）であるため、reason は `auth-secret-drift`（§4）に分類される |
| **正本** | この SSOT。両 secret の実値は 1Password に保管し、GitHub / Cloudflare へは op 参照経由で投入する（実値はこのファイルに書かない） |

---

## 4. 診断ディシジョンツリー（reason → 原因 → アクション）

smoke が出力する `reason` 値（`scripts/smoke/runtime-attendance-provider.sh`）から、原因と次アクションを一意に決める。

```
smoke が non-200 で fail
│
├─ HTTP 500  "auth misconfigured"
│     reason = auth-secret-binding-missing
│     原因  : staging API に AUTH_SECRET が未投入（binding 欠落）
│     アクション: scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging
│                （wrangler 直接実行禁止。必ず scripts/cf.sh 経由）
│
├─ HTTP 401  "unauthorized" かつ JWT の exp <= now
│     reason = auth-token-expired
│     原因  : 静的 fallback bearer（24h TTL）が失効した
│     アクション: (a) 静的 bearer を再発行して GitHub 環境 secret を更新する、または
│                (b) STAGING_AUTH_SECRET を投入して mint path を有効化する（§6・恒久化）
│
├─ HTTP 401  "unauthorized" かつ JWT の exp > now
│     reason = auth-secret-drift
│     原因  : 署名鍵 ≠ 検証鍵（STAGING_AUTH_SECRET と staging API AUTH_SECRET が不一致）
│     アクション: §3 の不変条件に従い、両 secret を同一値に再同期する
│
└─ HTTP 403  "forbidden"
      reason = auth-not-admin
      原因  : bearer の identity が isAdmin=false（admin 専用 endpoint への非管理者アクセス）
      アクション: admin 用 member identity secret（STAGING_ADMIN_MEMBER_ID 等）を修正し、
                 isAdmin=true の identity で発行された bearer を使う
```

reason 値の一覧（正本）:

| reason | HTTP | 判定条件 | 原因区分 |
|---|---|---|---|
| `auth-secret-binding-missing` | 500 | body `error == "auth misconfigured"` | API に AUTH_SECRET 未投入 |
| `auth-token-expired` | 401 | body `error == "unauthorized"` かつ `exp <= now` | 静的 bearer 失効 |
| `auth-secret-drift` | 401 | body `error == "unauthorized"` かつ `exp > now` | 署名鍵不一致 |
| `auth-not-admin` | 403 | body `error == "forbidden"` | isAdmin=false |

> `exp <= now` / `exp > now` の判定は `scripts/smoke/bearer-freshness-gate.mts` の
> `explainAuthFailureFromBearer`（署名検証なし・payload の `exp` のみ decode）で行う。
> decode 不能な token は署名鍵不一致と同じ復旧導線に寄せ、`auth-secret-drift` として扱う。

---

## 5. 鮮度ゲート運用

smoke 実行**前**に、実際に使う bearer の `exp` を decode し、失効間近を loud fail させる。

| 項目 | 値 |
|---|---|
| 実装 | `scripts/smoke/bearer-freshness-gate.mts` の `classifyBearerFreshness({ label, token, nowSeconds, thresholdSeconds })` |
| 既定 threshold | **21600 秒（6 時間）**（env `FRESHNESS_THRESHOLD_SECONDS` で上書き可） |
| 発火条件 | `exp - now < 21600` または decode 不能なら workflow step が exit 非ゼロで smoke を実行せず fail |
| fail メッセージ | `<label> is <stale\|expired\|invalid>; seconds_remaining=<N>; refresh the static bearer or provision STAGING_AUTH_SECRET...`（JWT 文字列は出力しない。label と secondsRemaining のみ） |
| loud fail 時の参照先 | 本 SSOT の §4 ディシジョンツリー（`auth-token-expired` 系へ誘導） |

> 鮮度ゲートは「失効の事前警告」が責務であり署名検証はしない（改ざん検出は API 側と mint 自己検証が担う）。
> 静的 bearer が失効する 6 時間前に必ず loud fail するため、24h 周期の 401 がサイレントに再発する構造を排除する。

---

## 6. 恒久化手順への導線

24h で失効する静的 bearer 依存を終わらせる恒久対策は、**mint path の有効化**である。

| ステップ | 内容 |
|---|---|
| 1 | `STAGING_AUTH_SECRET` を `staging-runtime-smoke` 環境（GitHub 環境 secret）へ投入する。値は staging API `AUTH_SECRET`（Cloudflare secret）と**同一**にする（§3 の不変条件） |
| 2 | 投入後、workflow の mint step（`if: env.STAGING_AUTH_SECRET != ''`）が有効化され、毎回 TTL=600s の JWT を発行する。静的 24h bearer への fallback は不要になる |
| 3 | 投入手順の詳細は `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` を参照する |

> secret の実投入は 1Password → `gh secret set --env staging-runtime-smoke` を要するユーザー操作であり、
> このタスク（spec 作成）では実行しない（user-gated）。
> 投入されるまでは鮮度ゲート（§5）が失効 6 時間前に loud fail し、サイレント再発を防ぐ。
