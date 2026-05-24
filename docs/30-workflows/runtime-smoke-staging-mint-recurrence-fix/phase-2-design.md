# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 2 / 13 |
| 入力 | phase-1-requirements.md（AC・inventory・命名規則） |
| 出力 | 鮮度ゲート module 設計 / workflow 差分 / reason 細分化 / mint 自己検証 / SSOT 構成 |

## 目的

Phase 1 で確定した AC-1〜AC-7 と inventory を入力に、鮮度ゲート module（C-1）・workflow 差分（C-2）・401 reason 細分化（C-3）・mint 自己検証（C-4）・SSOT（C-5/C-6）の各コンポーネントを、関数シグネチャ・差分位置・責務境界まで実装可能な粒度で確定する。検証側 API・required check 名・mint 基盤を変更せず、静的 fallback を維持したまま 24h 周期の 401 再発を構造的に断つ設計を固定する。

## 設計の論点（要件レビュー思考法）

| 観点 | 結論 |
|---|---|
| 真の論点 | 「失敗が起きること」ではなく「**失効・退行・鍵 drift がサイレントに進行し、smoke 失敗で初めて顕在化する**こと」。検知を smoke 実行前へ前倒しし、原因を区別可能にすることが本質。 |
| 因果（バランスループ） | 静的 bearer 失効 → 401 → 手動再発行 → 一時 green → 24h 後再失効（自己強化）。鮮度ゲートが「失効前に loud fail」を割り込ませてループを断つ。 |
| 状態所有権 | bearer 値の所有 = GitHub 環境 secret（mint 未有効時）/ mint step（有効時）。鮮度判定の所有 = 新規 freshness gate（読み取り専用・署名検証なし）。reason 判定の所有 = smoke runner。鍵同期の正本 = SSOT doc。これらを混在させない。 |
| 価値とコスト | 最大価値 = 「24h 周期の再発を 0 にし、原因切り分けの往復を消す」。最大コスト = freshness gate の新規 module（小）。静的経路は維持するため運用退行リスクは増やさない。 |
| 4 条件 | 価値性◎（再発と誤診断の両方を消す）/ 実現性◎（新規 1 module + 既存 3 ファイルの局所差分）/ 整合性◎（検証側 API・required check 名・mint 基盤を変更しない）/ 運用性◎（fallback 維持・loud fail で運用者が次アクションを即判断）。 |

## コンポーネント設計

### C-1. `scripts/smoke/bearer-freshness-gate.mts`（新規）

責務: bearer の `exp` claim を**署名検証せず**読み取り、鮮度判定と exp ステータス分類を行う純粋関数群 + CLI。token 文字列・`exp` 以外の claim を出力しない。

```ts
// 署名検証は行わない。payload セグメントの base64url を decode し exp(number)のみ取り出す。
// 失敗（セグメント不足 / JSON 不正 / exp 非数値）時は null を返し throw しない。
export function decodeJwtExp(token: string): number | null;

export interface JwtFreshness {
  readonly label: string;
  readonly exp: number | null;
  readonly secondsRemaining: number | null;
  readonly status: "fresh" | "stale" | "expired" | "invalid";
}

export function classifyBearerFreshness(input: {
  readonly label: string;
  readonly token: string;
  readonly nowSeconds?: number;
  readonly thresholdSeconds?: number;
}): JwtFreshness;

export function explainAuthFailureFromBearer(input: {
  readonly token: string;
  readonly nowSeconds?: number;
}): "auth-token-expired" | "auth-secret-drift";
```

CLI 仕様（`pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts`）:

| 入力（env） | 振る舞い | 終了コード |
|---|---|---|
| `STAGING_ADMIN_BEARER`, `STAGING_ME_BEARER`, `FRESHNESS_THRESHOLD_SECONDS`（既定 21600）, `RUNTIME_SMOKE_AUTH_PATH`（任意） | admin / me 両 bearer を `classifyBearerFreshness` で検査し、`fresh` 以外なら `::error::<LABEL> is <status>; seconds_remaining=<N>; refresh the static bearer or provision STAGING_AUTH_SECRET...` を出力 | 全 bearer が fresh なら 0。`stale` / `expired` / `invalid` があれば 1 |

> token は env 経由で受け取り、stdout / error には `secondsRemaining` と label のみ出す。token 文字列は決して出さない（不変条件 5）。

### C-2. `.github/workflows/runtime-smoke-staging.yml`（修正）

`mask staging credentials` で auth path を notice し、`run runtime smoke` の直前に freshness gate を挿入する。

```yaml
      - name: mask staging credentials
        run: |
          if [ -z "${RUNTIME_SMOKE_AUTH_PATH:-}" ]; then
            echo "RUNTIME_SMOKE_AUTH_PATH=static-fallback" >> "$GITHUB_ENV"
            echo "::notice::runtime-smoke auth path: static-fallback (STAGING_AUTH_SECRET not provisioned)"
          else
            echo "::notice::runtime-smoke auth path: $RUNTIME_SMOKE_AUTH_PATH"
          fi
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_ME_BEARER"
          echo "::add-mask::$STAGING_API_BASE"
          echo "::add-mask::$STAGING_MEMBER_ID"

      - name: verify bearer freshness
        run: pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts
```

> `setup-project` は鮮度ゲートが `pnpm exec tsx` を要するため常時実行へ変更する。これは AC-6（mint optional 維持）と両立する（setup を常時化するだけで mint step の `if: env.STAGING_AUTH_SECRET != ''` は維持）。

### C-3. `scripts/smoke/runtime-attendance-provider.sh`（修正）

`request_json` の 401 分類（既存 L170-174）を差し替える。401 `unauthorized` を受けたら、その request に使った `$bearer` の exp を C-1 の `explainAuthFailureFromBearer` で判定し reason を分岐する。

```sh
    elif [[ "$status" == "401" ]] && {
      printf '%s' "$redacted_body" | jq -e '.error == "unauthorized"' >/dev/null 2>&1 ||
        printf '%s' "$redacted_body" | grep -Eq '"error"[[:space:]]*:[[:space:]]*"unauthorized"'
    }; then
      failure_reason="$(classify_unauthorized_bearer "$bearer")"
```

> `request_json` 内で使用中の bearer をローカル変数として保持する（既存は `local bearer="$3"`）。`classify_unauthorized_bearer` は `explainAuthFailureFromBearer({ token })` を `tsx -e` 経由で呼び、`auth-token-expired` / `auth-secret-drift` の reason 文字列のみを返す。

### C-4. `scripts/smoke/mint-staging-bearers.mts`（修正）

`mintStagingBearers` で各 JWT を署名した直後に自己検証を追加する（AC-4）。

```ts
import { signSessionJwt, verifySessionJwt } from "@ubm-hyogo/shared";

const [adminClaims, meClaims] = await Promise.all([
  verifySessionJwt(adminBearer, env.authSecret),
  verifySessionJwt(meBearer, env.authSecret),
]);
if (
  !adminClaims ||
  !meClaims ||
  adminClaims.memberId !== env.adminMemberId ||
  adminClaims.isAdmin !== true ||
  meClaims.memberId !== env.meMemberId ||
  meClaims.isAdmin !== false
) {
  throw new Error("minted bearer self verification failed");
}
```

token 文字列や secret は error message に含めない。

### C-5. `reference/bearer-lifecycle-ssot.md`（新規・AC-5）

単一の正本として以下を記載する。

1. bearer = HS256 session JWT（`signSessionJwt` / `verifySessionJwt`、`packages/shared/src/auth.ts`）。
2. TTL: 静的 fallback bearer = 86400 秒（24h, `SESSION_JWT_TTL_SECONDS`）/ minted = 600 秒。
3. secret 同期不変条件: mint 鍵 `STAGING_AUTH_SECRET`（GitHub 環境 secret）≡ staging API `AUTH_SECRET`（Cloudflare secret）。不一致時は署名検証が通らず 401 `unauthorized`（drift）。
4. 診断ディシジョンツリー（smoke reason → 原因 → アクション）:
   - `auth-secret-binding-missing`（500 "auth misconfigured"）→ staging API に `AUTH_SECRET` 未投入 → `scripts/cf.sh secret put`。
   - `auth-token-expired`（401, exp ≤ now）→ 静的 bearer 失効 → 再発行 or mint 有効化。
   - `auth-secret-drift`（401, exp > now）→ mint 鍵 ≠ API 鍵 → 両者を同値に再同期。
   - `auth-not-admin`（403）→ identity の isAdmin=false → member identity secret 修正。
5. 鮮度ゲート運用: 既定 threshold=6h。loud fail 時は本 SSOT のディシジョンツリーへ誘導。
6. 恒久化: `STAGING_AUTH_SECRET` を staging-runtime-smoke 環境へ投入すると mint path（失効しない）が有効化される。手順は secret-provisioning.md。

### C-6. `secret-provisioning.md`（修正・AC-5）

冒頭に SSOT へのリンクと「鮮度ゲートが失効間近を 6h 前に loud fail する」運用注記を追記する。

## ステップ間の責務境界テーブル

| レイヤ | 所有する判断 | 出力 | 出力してはいけないもの |
|---|---|---|---|
| freshness gate（C-1） | exp 鮮度 / exp ステータス | label + secondsRemaining + reason 文字列 | token 文字列・exp 以外の claim・署名鍵 |
| workflow（C-2） | どの path が有効か / smoke 実行可否 | `runtime-smoke auth path: ...` notice / gate exit code | secret 値 |
| smoke runner（C-3） | HTTP status と body から reason 確定 | redact 済み reason | 未 redact の body・bearer |
| mint helper（C-4） | 署名 JWT の自己整合性 | GITHUB_OUTPUT 値 | console への JWT echo |
| SSOT（C-5） | ライフサイクル/同期不変条件の正本 | docs | 実 secret 値 |

## 実行タスク

1. C-1 `bearer-freshness-gate.mts` の純粋関数群（`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）と env 駆動 CLI の終了コード規約を確定する。
2. C-2 workflow の step 挿入位置（`mask staging credentials` 直後・`run runtime smoke` 直前）と `setup-project` 常時化の差分を確定する。
3. C-3 smoke runner の 401 分岐を `auth-token-expired` / `auth-secret-drift` / auth-secret-drift reason に細分化するロジックを確定する。
4. C-4 mint helper の self verification（署名直後の `verifySessionJwt` 自己検証）を確定する。
5. C-5/C-6 SSOT doc の記載項目（TTL / 同期不変条件 / 診断ディシジョンツリー）と runbook リンクを確定する。
6. 責務境界テーブルで各レイヤの状態所有権と「出力してはいけないもの」を固定する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 4（テスト計画） | C-1 の純粋関数（`classifyBearerFreshness` / `explainAuthFailureFromBearer` / `decodeJwtExp`）の境界値テスト設計、C-4 自己検証の throw 経路テスト設計の入力とする | phase-4-test-plan.md |
| Phase 5（実装手順） | C-1〜C-6 の差分位置・シグネチャを実装手順の正本として参照する | phase-5-implementation.md |
| smoke runner ↔ freshness gate | C-3 が 401 時に C-1 の `explainAuthFailureFromBearer` を `tsx -e` で呼び reason を確定する統合経路 | scripts/smoke/runtime-attendance-provider.sh ↔ scripts/smoke/bearer-freshness-gate.mts |
| workflow ↔ freshness gate | C-2 の `verify bearer freshness` step が C-1 の CLI を呼び、`stale` / `expired` / `invalid` で smoke 実行前に job を fail させる pre-flight 統合 | .github/workflows/runtime-smoke-staging.yml ↔ scripts/smoke/bearer-freshness-gate.mts |

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
|---|---|---|
| 認証/セキュリティ core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | session 検証境界 |
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud 設計 |

### プロジェクト仕様 / コードアンカー

| 参照資料 | パス:行 | 内容 |
|---|---|---|
| 署名/検証/TTL | `packages/shared/src/auth.ts:42,93,127` | `SESSION_JWT_TTL_SECONDS` / `signSessionJwt` / `verifySessionJwt` |
| mint helper | `scripts/smoke/mint-staging-bearers.mts:18-43` | `mintStagingBearers` / `DEFAULT_TTL_SECONDS` |
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh:167-180` | 現行 reason 分類 |
| workflow | `.github/workflows/runtime-smoke-staging.yml:38-95` | setup / mint / mask / smoke step |

## 成果物

- 本ファイル（`phase-2-design.md`）: C-1〜C-6 の設計・責務境界・差分スケッチ。

## 完了条件

- [x] 新規 module の関数シグネチャ（`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）が確定している。
- [x] workflow 差分（step 挿入位置・`setup-project` 常時化）が具体的に記述されている。
- [x] reason 細分化のロジック分岐が確定している。
- [x] mint 自己検証の関数が確定している。
- [x] SSOT の記載項目が列挙されている。
- [x] 責務境界テーブルで状態所有権の混在が無いことを確認した。
