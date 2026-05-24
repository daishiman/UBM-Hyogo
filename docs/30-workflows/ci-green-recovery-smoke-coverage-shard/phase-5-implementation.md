# Phase 5: 実装手順

Phase 2 §4 の変更対象 7 ファイルそれぞれの具体的な編集手順・差分方針を確定し、本サイクルで実装へ反映した。実装済み差分は `.github/workflows/ci.yml`、`.github/workflows/runtime-smoke-staging.yml`、`scripts/smoke/`、`scripts/coverage-guard.sh`、runtime smoke secret runbook に存在する。

---

## 0. 新規 / 修正ファイル一覧（Feedback RT-03 必須記載）

| # | パス | 種別 | lane | 主変更点 |
|---|---|---|---|---|
| 1 | `scripts/smoke/mint-staging-bearers.mts` | **新規** | A | mint helper（純粋関数 + CLI guard） |
| 2 | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | **新規** | A | parity / 欠落 / TTL unit |
| 3 | `scripts/smoke/runtime-attendance-provider.sh` | 修正 | A | 401/403 reason 分岐追加 |
| 4 | `.github/workflows/runtime-smoke-staging.yml` | 修正 | A | setup-project + mint step + mask + fallback |
| 5 | `.github/workflows/ci.yml` | 修正 | B,C | top-level permissions / shard checkout token / coverage-gate step 順序 |
| 6 | `scripts/coverage-guard.sh` | 修正 | B | `--no-run` MISSING 診断メッセージ強化 |
| 7 | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 修正 | A | mint 方式 secret 5 種 + 即時再発行手順追記 |

---

## 1. `scripts/smoke/mint-staging-bearers.mts`（新規）

### 1.1 構造（純粋関数 + CLI guard）

```ts
import { signSessionJwt } from "@ubm-hyogo/shared";
import type { MemberId } from "@ubm-hyogo/shared";  // branded 型

interface MintedBearers {
  readonly adminBearer: string;
  readonly meBearer: string;
  readonly memberId: string;
}

// --- 純粋関数: env を引数で受け、JWT を返す。process.env を直接読まない（test 可能化） ---
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<MintedBearers> {
  const ttlSeconds = env.ttlSeconds ?? 600;          // 既定 10 分
  const adminBearer = await signSessionJwt(env.authSecret, {
    memberId: env.adminMemberId as MemberId,
    email: env.adminEmail,
    isAdmin: true,
    ttlSeconds,
  });
  const meBearer = await signSessionJwt(env.authSecret, {
    memberId: env.meMemberId as MemberId,
    email: env.meEmail,
    isAdmin: false,
    ttlSeconds,
  });
  return { adminBearer, meBearer, memberId: env.adminMemberId };
}
```

- `signSessionJwt` の実シグネチャ `signSessionJwt(secret, { memberId, email, isAdmin, name?, nowSeconds?, ttlSeconds? })` に完全準拠。admin は `isAdmin: true`、me は `isAdmin: false`。
- `secret` が falsy のとき `signSessionJwt` が内部で throw（`"AUTH_SECRET missing"`）するため、純粋関数側で改めて検証不要だが、CLI guard では明示メッセージを優先する（下記）。

### 1.2 CLI guard（`tsx` 実行時のみ main を走らせる）

```ts
// import.meta.main 相当の guard。test import 時は走らせない。
// tsx 実行では import.meta.url === pathToFileURL(process.argv[1]).href で判定。
const isCliEntry = import.meta.url === `file://${process.argv[1]}`
  || import.meta.url.endsWith(process.argv[1] ?? "__never__");

if (isCliEntry) {
  await main();
}

async function main(): Promise<void> {
  const required = {
    authSecret: process.env.STAGING_AUTH_SECRET,
    adminMemberId: process.env.STAGING_ADMIN_MEMBER_ID,
    adminEmail: process.env.STAGING_ADMIN_EMAIL,
    meMemberId: process.env.STAGING_ME_MEMBER_ID,
    meEmail: process.env.STAGING_ME_EMAIL,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    process.stderr.write(`mint-staging-bearers: missing env: ${missing.join(", ")}\n`);
    process.exit(2);                       // 必須 env 欠落 → exit 2
  }
  const ttlSeconds = process.env.MINT_TTL_SECONDS
    ? Number(process.env.MINT_TTL_SECONDS)
    : 600;
  const minted = await mintStagingBearers({ ...(required as Required<...>), ttlSeconds });

  // GITHUB_OUTPUT へ key=value 追記のみ。console / stdout への JWT echo は禁止。
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `admin_bearer=${minted.adminBearer}\n`);
    appendFileSync(out, `me_bearer=${minted.meBearer}\n`);
    appendFileSync(out, `member_id=${minted.memberId}\n`);
  }
  // mask は呼び出し元 workflow が GITHUB_OUTPUT 消費前に ::add-mask:: を適用する。
}
```

- **絶対条件**: JWT 文字列を `console.log` / stdout に出さない。`GITHUB_OUTPUT` への追記のみ。
- 必須 env 欠落時は欠落 env 名（値ではなく**名前**）のみを stderr に出し `process.exit(2)`。
- 後方互換 fallback（`STAGING_AUTH_SECRET` 未設定時の静的 bearer 使用）は **workflow 側の `if:` で判定**する。helper 自体は「鍵が来たら mint する」責務に閉じる（鍵欠落で exit2）。

### 1.3 ローカル実行コマンド

```bash
# 純粋関数の unit
mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts

# CLI guard の手動実行（実 secret は使わず、ダミー鍵で動作確認のみ。GITHUB_OUTPUT は一時ファイル）
GITHUB_OUTPUT=/tmp/mint-out STAGING_AUTH_SECRET=dummy \
  STAGING_ADMIN_MEMBER_ID=m1 STAGING_ADMIN_EMAIL=a@example.com \
  STAGING_ME_MEMBER_ID=m2 STAGING_ME_EMAIL=b@example.com \
  mise exec -- pnpm exec tsx scripts/smoke/mint-staging-bearers.mts
# /tmp/mint-out の中身は実運用以外で確認し、確認後に削除する（JWT を残さない）
```

---

## 2. `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（新規）

Phase 4 §1 の T-A1〜T-A8 を実装する。`verifySessionJwt`（`@ubm-hyogo/shared`）で parity を固定し、TTL は `verifySessionJwt(token, secret, nowSeconds)` の第 3 引数で境界を突く。ダミー鍵リテラルのみ使用し、実 secret を fixture に置かない。

---

## 3. `scripts/smoke/runtime-attendance-provider.sh`（修正）

L165-168 の reason 判定ブロックを Phase 2 §1.4 の通りに拡張する。

- 既存: 500 + `{"error":"auth misconfigured"}` → `auth-secret-binding-missing`（**据え置き**）。
- 追加 1: `status == "401"` かつ `{"error":"unauthorized"}` → `auth-token-invalid-or-expired`。
- 追加 2: `status == "403"` かつ `{"error":"forbidden"}` → `auth-not-admin`。
- reason は redact 済み body（`$redacted_body`）から `jq -e '.error == ...'` で error 種別のみ判定。JWT 文字列・body 全文は出力しない。

差分方針: 既存 `if` を `elif` で連結し、判定順は 500（auth misconfigured）→ 401（unauthorized）→ 403（forbidden）。

---

## 4. `.github/workflows/runtime-smoke-staging.yml`（修正）

現状の `jobs.smoke` を以下の通り改修する（step の追加位置を明示）。

| 位置 | 変更 |
|---|---|
| `env:`（L27-31） | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` を `secrets.*` から追加注入 |
| checkout（L33）直後 | `- uses: ./.github/actions/setup-project`（install 込み・mint helper を tsx 実行するため）を追加 |
| setup-project 直後・既存「verify required staging secrets」より前 | **mint step（新規）**: `if: env.STAGING_AUTH_SECRET != ''`。step 内で `tsx scripts/smoke/mint-staging-bearers.mts` を実行し `GITHUB_OUTPUT` から `admin_bearer`/`me_bearer`/`member_id` を受け取り、**同一 step 内で先に `echo "::add-mask::$VALUE"` を適用してから** `GITHUB_ENV` に `STAGING_ADMIN_BEARER`/`STAGING_ME_BEARER`/`STAGING_MEMBER_ID` を export |
| 既存「verify required staging secrets」（L35-48） | 据え置き。mint 経路では `GITHUB_ENV` 設定後に bearer 2 種 + memberId が満たされる。fallback 経路では既存静的 secret が満たす |
| 既存「mask staging credentials」（L50-55） | 据え置き。mint 経路で `GITHUB_ENV` 経由になった bearer も改めて mask 対象に含まれる |

> mint step 内の順序は厳守: **mint → `::add-mask::` → `GITHUB_ENV` export** を 1 step に閉じ、JWT 平文露出のレースを排除（R-1）。fallback は `if: env.STAGING_AUTH_SECRET != ''` で mint step をスキップし、既存静的 bearer をそのまま使う（AC-4）。

mint step スケルトン（値の echo は禁止、mask のみ）:

```yaml
- name: mint staging bearers
  if: env.STAGING_AUTH_SECRET != ''
  id: mint
  env:
    STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
    STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
    STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
    STAGING_ME_MEMBER_ID: ${{ secrets.STAGING_ME_MEMBER_ID }}
    STAGING_ME_EMAIL: ${{ secrets.STAGING_ME_EMAIL }}
    MINT_TTL_SECONDS: '600'
  run: |
    pnpm exec tsx scripts/smoke/mint-staging-bearers.mts
    admin="$(grep '^admin_bearer=' "$GITHUB_OUTPUT" | tail -n1 | cut -d= -f2-)"
    me="$(grep '^me_bearer=' "$GITHUB_OUTPUT" | tail -n1 | cut -d= -f2-)"
    mid="$(grep '^member_id=' "$GITHUB_OUTPUT" | tail -n1 | cut -d= -f2-)"
    echo "::add-mask::$admin"
    echo "::add-mask::$me"
    echo "::add-mask::$mid"
    {
      echo "STAGING_ADMIN_BEARER=$admin"
      echo "STAGING_ME_BEARER=$me"
      echo "STAGING_MEMBER_ID=$mid"
    } >> "$GITHUB_ENV"
```

> 注: 上記は GITHUB_OUTPUT を read-back する形だが、実装時は helper が直接 `GITHUB_ENV` へ書く設計に寄せても良い。いずれにせよ **mask を export より前に必ず適用**する点が不変条件。helper を `GITHUB_ENV` 直書きにする場合は、helper 自身が export 前に値を握っているため、mask は workflow step の最初に「helper 実行 → 直後に env を読み戻して mask」できない。安全側として **helper は GITHUB_OUTPUT のみ書き、workflow が mask 後に GITHUB_ENV へ昇格**する上記方式を推奨する。

---

## 5. `.github/workflows/ci.yml`（修正 / Lane B+C 統合）

1 ファイル diff に統合する（Lane B の step 順序入れ替え + Lane C の permissions/token）。

### 5.1 top-level permissions（Lane C / AC-5）

`on:` ブロックと `jobs:` ブロックの間に追加:

```yaml
permissions:
  contents: read
```

`runtime-smoke-staging.yml:15-16` と同形。job 個別 permissions は据え置き（R-6）。

### 5.2 shard / aggregate checkout token 明示（Lane C）

`coverage-gate-shard`（現 L147）と `coverage-gate`（現 L204 付近）の `- uses: actions/checkout@v4` に明示 with を付与:

```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ github.token }}
    persist-credentials: true
```

default と同等だが「意図された認証」を固定し、transient 再発時の切り分けを可能にする。

### 5.3 coverage-gate step 順序入れ替え（Lane B / AC-7）

現状の `coverage-gate` job:

```
1. checkout → 2. ready → 3. setup-project → 4. download-artifact
→ 5. Merge apps/api unit+d1
→ 6. Coverage gate (aggregate, no-run)        ← ここで MISSING → exit 1（誤解）
→ 7. Fail closed on failed shard               ← 到達しない
```

入れ替え後:

```
1. checkout → 2. ready → 3. setup-project → 4. download-artifact
→ 5. Fail closed on failed shard               ← needs.coverage-gate-shard.result != 'success' なら明確なエラーで即 exit 1
→ 6. Merge apps/api unit+d1
→ 7. Coverage gate (aggregate, no-run)         ← shard 全成功時のみ到達。MISSING が出れば真の欠落
```

具体編集: 現「Fail closed on failed shard」step（`if: ... && needs.coverage-gate-shard.result != 'success'`）を、「Merge apps/api unit + d1 coverage」step の**前**へ移動する。job name `coverage-gate` / `coverage-gate-shard (...)` は変更しない（AC-8）。

---

## 6. `scripts/coverage-guard.sh`（修正 / Lane B）

`--no-run` 集約モードの MISSING 出力箇所（L304-338 のループ内、L309-311 の `log "MISSING: ..."`）に診断誘導を追記する。判定ロジック（`MISSING=1` / `exit 1`）は不変（R-4）。

追記メッセージ案（L310 の MISSING ログ直後、または L334-337 の HINT ブロックに 1 行追加）:

```sh
log "HINT: shard が全成功した場合のみ、これは真の coverage 欠落です。"
log "HINT: coverage-gate-shard のいずれかが失敗していると artifact 未 upload で本 MISSING が出ます。先に coverage-gate-shard の結果を確認してください。"
```

> step 順序入れ替え（§5.3）で shard 失敗は先に検知されるため、本メッセージはローカル `--no-run` 実行や予期せぬ経路向けの保険的診断。判定の閾値・分岐は変えない。

---

## 7. runbook 修正（`secret-provisioning.md`）

§1.5 の通り、実行はユーザー gated（本仕様では手順記述のみ）。追記内容:

- 新規 secret 5 種（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）の op 参照と `gh secret set --env staging-runtime-smoke` 投入手順（**実値は転記せず op 参照のみ**）。
- `STAGING_AUTH_SECRET` は **staging API の `AUTH_SECRET` と同値**を投入する旨を明記（R-3。不一致だと verify 失敗で 401 継続）。
- mint 方式移行後も静的 bearer を残す理由（fallback 即時復旧経路 / AC-4）。
- 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）の静的 bearer 再発行手順。
- `provision-staging-secrets.sh` の `SECRETS=()` 配列へ 5 種追加する差分例（実コミットはユーザー承認後）。

---

## 8. 実装順序（推奨）

1. mint helper（#1）→ unit（#2）で parity を固定（先に format 正本を確定）。
2. runner reason 分岐（#3）。
3. workflow（#4）— mint step + fallback。
4. ci.yml（#5）+ coverage-guard.sh（#6）— Lane B/C 統合。
5. runbook（#7）。
6. ローカル検証: `pnpm typecheck` / `pnpm lint` / vitest / `actionlint`。

---

## 9. 成果物

- `outputs/phase-5/implementation.md`（本 Phase の実装手順サマリ）
