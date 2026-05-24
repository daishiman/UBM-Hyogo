# Phase 2: 設計

3 lane を 1 実装サイクルで解消する設計を確定する。各 lane は独立に着手できるが、Lane B は Lane C と同じ `ci.yml` を編集するため**同一ファイル内の別 step として統合する**。

---

## 0. 真の論点・依存・価値（要件レビュー思考法）

| 観点 | 結論 |
|---|---|
| 真の論点 | 「CI を緑にする」ではなく「**bearer 失効・workflow token 縮退・診断不全という 3 つの構造欠陥を恒久的に閉じる**」こと。再発防止が主問題。 |
| 依存・責務境界 | Lane A は smoke 系（`scripts/smoke/` + `runtime-smoke-staging.yml`）に閉じる。Lane B/C は coverage 系（`ci.yml` + `coverage-guard.sh`）に閉じる。両系は**ファイル交差ゼロ**で並列実装可能。Lane B と C のみ `ci.yml` を共有するため 1 PR・1 ファイルで統合する。 |
| 価値とコスト | 最大価値は Lane A の「失効が原理的に起きない bearer 供給」。最大コストは「署名鍵 `STAGING_AUTH_SECRET` を CI に持ち込む」点だが、staging 限定・短命 mint・mask 適用でリスクを限定する。Lane C の permissions hardening は低コスト高価値。 |
| 強化ループ | bearer 失効 → smoke 赤 → 手動で再発行 → また 24h で失効（悪循環）。mint 化でループを断つ。 |
| バランスループ | shard 失敗 → MISSING 誤検知 → 原因誤認 → 復旧遅延。step 順序入れ替えで「shard 失敗を先に明示」しループを安定化。 |

---

## 1. Lane A — runtime-smoke staging admin 401（CI 実行時 mint 方式）

### 1.1 設計概要

静的 bearer secret（24h で失効する JWT 文字列）を廃し、**smoke 実行直前に署名鍵から短命 JWT を mint する**。署名鍵 `STAGING_AUTH_SECRET` は staging API の `AUTH_SECRET` と同値の HS256 鍵。member identity（memberId / email）も secret 化する。

```
（Before）GitHub secret に 24h JWT を静的保存 → 24h 後に失効 → 401
（After）GitHub secret に署名鍵 + identity → 実行毎に signSessionJwt で TTL=600s の JWT を mint → 失効不能
```

### 1.2 新規 mint helper

**ファイル**: `scripts/smoke/mint-staging-bearers.mts`（`.mts` + `tsx` 実行）

```ts
// 入力 env（すべて GitHub environment secret 由来）
//   STAGING_AUTH_SECRET        : HS256 署名鍵（staging AUTH_SECRET と同値）
//   STAGING_ADMIN_MEMBER_ID    : admin bearer の sub/memberId
//   STAGING_ADMIN_EMAIL        : admin bearer の email
//   STAGING_ME_MEMBER_ID       : me bearer の sub/memberId
//   STAGING_ME_EMAIL           : me bearer の email
//   MINT_TTL_SECONDS           : 任意。既定 600（10 分）
//
// 出力（GITHUB_OUTPUT 形式で stdout に key=value、ただし値は出力前に ::add-mask:: 済み前提）
//   admin_bearer=<jwt>
//   me_bearer=<jwt>
//   member_id=<STAGING_ADMIN_MEMBER_ID>   ← admin-detail/attendance 用に既存 STAGING_MEMBER_ID 互換で出す

import { signSessionJwt } from "@ubm-hyogo/shared";

interface MintedBearers {
  readonly adminBearer: string;
  readonly meBearer: string;
  readonly memberId: string;
}

// 純粋関数: env を引数で受け取り JWT を返す（test 可能にするため process.env を直接読まない）
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<MintedBearers>;
```

- `mintStagingBearers` は `signSessionJwt(authSecret, { memberId, email, isAdmin, ttlSeconds })` を 2 回呼ぶ。admin は `isAdmin: true`、me は `isAdmin: false`。
- 必須 env 欠落時は明示メッセージで `process.exit(2)`（後方互換 fallback は workflow 側で判定するため、helper 自体は「鍵が来たら mint する」責務に閉じる）。
- `import.meta.main` 相当の guard（`tsx` 実行時のみ main を走らせ、test import 時は走らせない）で純粋関数と CLI を分離する。
- 値を stdout へ出す前に、呼び出し元 workflow が `::add-mask::` を済ませる。helper 自身は `GITHUB_OUTPUT` への追記のみ行い、コンソールには JWT 文字列を絶対に echo しない。

### 1.3 workflow 改修（`runtime-smoke-staging.yml`）

| 変更 | 内容 |
|---|---|
| env 追加 | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` を `secrets.*` から注入。 |
| node setup | mint helper を `tsx` で動かすため `- uses: ./.github/actions/setup-project`（install 有り）を checkout 直後に追加。 |
| mint step（新規） | `STAGING_AUTH_SECRET` が空でなければ `tsx scripts/smoke/mint-staging-bearers.mts` を実行。step 内で先に `echo "::add-mask::"` を **mint した値に対して**適用してから `GITHUB_ENV` に `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID` を export。 |
| 後方互換 fallback | `STAGING_AUTH_SECRET` が空のときは mint step を `if:` でスキップし、既存の静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID` をそのまま使う（即時運用復旧経路を壊さない）。 |
| 既存 mask step | mint 経路でも `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を改めて mask（`GITHUB_ENV` 経由の値も mask 対象に含める）。 |
| 既存 verify step | 必須 secret 検査の対象は「最終的に smoke が使う」変数（`STAGING_API_BASE` / `STAGING_MEMBER_ID` / bearer 2 種）に据え置く。mint 経路ではこれらは `GITHUB_ENV` 設定後に満たされる。 |

> mint step → mask → smoke の順序が崩れると JWT が平文露出する。step 内で「mint した瞬間に mask、その後 export」を 1 step に閉じることでレースを排除する。

### 1.4 smoke runner 改修（`runtime-attendance-provider.sh`）

401 の reason 検出を拡張する。現状 L165-168 は `{"error":"auth misconfigured"}`（=500 由来）のみ `auth-secret-binding-missing` を付ける。今回は **401 + `{"error":"unauthorized"}`** を `auth-token-invalid-or-expired` として分類する分岐を追加する。

```sh
# request_json 内、status != 200 のブロック（L165-168 を拡張）
if printf '%s' "$redacted_body" | jq -e '.error == "auth misconfigured"' >/dev/null 2>&1; then
  failure_reason="auth-secret-binding-missing"          # 500: AUTH_SECRET binding 欠落
elif [[ "$status" == "401" ]] && printf '%s' "$redacted_body" | jq -e '.error == "unauthorized"' >/dev/null 2>&1; then
  failure_reason="auth-token-invalid-or-expired"        # 401: bearer 失効/改ざん（mint 化で恒久解消対象）
elif [[ "$status" == "403" ]] && printf '%s' "$redacted_body" | jq -e '.error == "forbidden"' >/dev/null 2>&1; then
  failure_reason="auth-not-admin"                        # 403: isAdmin=false
fi
```

- これにより、将来また 401 が出た場合に summary.json / log の `reason` で「失効」「鍵欠落」「権限不足」を即時切り分けできる（診断強化）。
- reason 値は redact 済み body から `jq` で error 種別のみを読むため、JWT 文字列は出力しない（不変条件 3 維持）。

### 1.5 secret provisioning 更新（runbook）

`docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` に以下を追記する（**実行はユーザー gated、本仕様では手順記述のみ**）:

- 新規 secret 5 種（`STAGING_AUTH_SECRET` ほか）の op 参照と `gh secret set --env staging-runtime-smoke` 投入手順。
- mint 方式への移行後も静的 bearer を残す理由（fallback 即時復旧経路）。
- 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）の静的 bearer 再発行手順。
- `provision-staging-secrets.sh` の `SECRETS=()` 配列へ 5 種追加する差分例（実コミットはユーザー承認後）。

---

## 2. Lane C — coverage-gate-shard checkout 失敗（permissions / token hardening）

### 2.1 設計概要

`ci.yml` には top-level `permissions:` ブロックが無く、default workflow token の権限が縮退した場合に `actions/checkout@v4` が credential を読めず `could not read Username` で失敗しうる。`runtime-smoke-staging.yml:15-16` は `permissions: contents: read` を持つため、これに揃える。

| 変更 | 内容 |
|---|---|
| top-level permissions | `on:` と `jobs:` の間に `permissions:\n  contents: read` を追加。全 job の default token を明示し縮退を防ぐ。 |
| shard checkout token 明示 | `coverage-gate-shard` / `coverage-gate` の `actions/checkout@v4` に `with:\n  token: ${{ github.token }}\n  persist-credentials: true` を明示。default と同じだが「意図された認証」を固定し transient 再発時の原因を切り分け可能にする。 |
| 診断 | checkout 直後に `git remote -v` 相当の軽量確認は不要（credential は表示しない）。代わりに `coverage-gate` の shard 失敗検知を先頭化（Lane B と統合）。 |

> 注: 同一 run の前段 `ci` job は同じ default checkout で成功していたため transient の可能性が残る。本設計は「再現したら確実に直る hardening を入れておく」防御的設計であり、再現確認（re-run）はユーザー運用側で行う。hardening 自体は無害かつ回帰リスクなし。

---

## 3. Lane B — coverage-gate MISSING 誤検知（step 順序 + 診断強化）

### 3.1 根本原因の精緻化（Phase 1 から更新）

`coverage-gate` job（`ci.yml:204-263`）の step 順序が問題:

```
1. checkout
2. setup-project
3. download-artifact (coverage-*)      ← packages shard 失敗時は coverage-packages が無い
4. merge api unit+d1
5. coverage-guard.sh --no-run          ← L242-246: ここで MISSING を出して exit 1 ★誤解を招く
6. Fail closed on failed shard          ← L248-252: shard 失敗の本当の原因。だが 5 で死ぬため到達しない
```

shard（Lane C）が checkout で死ぬと `coverage-packages` artifact が upload されず、step 5 の `--no-run` が「packages の coverage-summary.json が無い」= MISSING と報告して exit 1 する。本当の原因（upstream shard 失敗）を示す step 6 に到達しない。

### 3.2 修正設計

**(a) step 順序入れ替え**: 「Fail closed on failed shard」を `coverage-guard.sh --no-run` の**前**に移動する。

```
3. download-artifact
4. Fail closed on failed shard   ← needs.coverage-gate-shard.result != 'success' なら明確なエラーで即 exit 1
5. merge api unit+d1
6. coverage-guard.sh --no-run    ← shard 全成功時のみ到達。MISSING が出れば真の coverage 欠落
```

これで shard 失敗時は「upstream shard X failed — coverage artifacts unavailable」が先に出る（AC-7）。

**(b) coverage-guard.sh 診断メッセージ強化**: `--no-run` の MISSING 出力（`scripts/coverage-guard.sh:304-338`）に「shard 成功時にここに来た場合のみ真の欠落。shard 失敗が疑われる場合は coverage-gate-shard の結果を確認せよ」という誘導を追記する。MISSING 判定ロジック自体は変えない（false negative を作らない）。

### 3.3 Lane B と C の統合方針

Lane B の (a) と Lane C は同じ `ci.yml` を編集する。**1 つの ci.yml diff** にまとめ、(a) step 順序入れ替え + Lane C の permissions/token を同時に適用する。`coverage-guard.sh` の (b) は独立ファイルなので別 hunk。

---

## 4. 変更対象ファイル一覧（種別・シグネチャ）

| パス | 種別 | 主シグネチャ / 変更点 | 副作用 |
|---|---|---|---|
| `scripts/smoke/mint-staging-bearers.mts` | 新規 | `export async function mintStagingBearers(env): Promise<{adminBearer,meBearer,memberId}>` + CLI guard | `GITHUB_OUTPUT`/`GITHUB_ENV` 追記のみ。JWT を console 出力しない |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 新規 | parity test（mint→`verifySessionJwt` で isAdmin 検証）、必須 env 欠落 test | なし（純粋関数 test） |
| `scripts/smoke/runtime-attendance-provider.sh` | 修正 | `request_json` の 401/403 reason 分岐追加（§1.4） | log/summary の reason 拡張のみ |
| `.github/workflows/runtime-smoke-staging.yml` | 修正 | setup-project + mint step + mask + fallback（§1.3） | mint 経路追加。fallback で既存挙動維持 |
| `.github/workflows/ci.yml` | 修正 | top-level `permissions: contents: read` / shard checkout token / coverage-gate step 順序入れ替え（§2,§3） | required context 名不変 |
| `scripts/coverage-guard.sh` | 修正 | `--no-run` MISSING 診断メッセージ強化（§3.2b） | 判定ロジック不変・メッセージのみ |
| `docs/.../runbooks/secret-provisioning.md` | 修正 | mint 方式 secret 5 種 + 即時再発行手順追記（§1.5） | docs のみ |

---

## 5. 設計上の不変条件（再掲・遵守確認）

1. required status context 名（`coverage-gate` / `runtime smoke staging / smoke`）を変更しない。
2. secret 実値・JWT 文字列・署名鍵を log / docs / コードに転記しない。mint した JWT は `::add-mask::` 後に `GITHUB_ENV` へ。
3. mint helper の JWT は `verifySessionJwt`（`@ubm-hyogo/shared`）で必ず検証通過（parity test 必須）。
4. coverage MISSING 判定ロジックは変えない（false negative を作らない）。メッセージと step 順序のみ改善。
5. 新規 test は `*.spec.ts` のみ。

## 6. 成果物

- `outputs/phase-2/design.md`（本 Phase の設計確定サマリ）
