# Phase 5: 実装手順

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 5 / 13 |
| 実装区分 | 実装仕様書（CONST_004 デフォルト） |
| implementation_mode | new（新規 `bearer-freshness-gate.mts` を含む） |
| 入力 | phase-2-design.md（C-1〜C-6）/ phase-4-test-plan.md（D/A/C/M ケース）|
| 出力 | 新規 / 修正 8 ファイルの差分方針・関数シグネチャ・挿入位置・DoD |

## 目的

Phase 2 §C-1〜C-6 と Phase 4 のテストケースを満たす実装を、ファイル種別・挿入位置・関数シグネチャ・副作用・エラーハンドリングで記録する。本 Phase は実装済み差分の正本同期であり、commit・PR はユーザー承認まで行わない。

## 新規 / 修正ファイル一覧（必須記載）

| # | パス | 種別 | 受入条件 | 主変更点 |
|---|---|---|---|---|
| 1 | `scripts/smoke/bearer-freshness-gate.mts` | **新規** | AC-1, AC-3 | `decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer` 純粋関数 + env 駆動 CLI |
| 2 | `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` | **新規** | AC-1, AC-3 | freshness / stale / expired / invalid と 401 reason 分岐 unit |
| 3 | `.github/workflows/runtime-smoke-staging.yml` | 修正 | AC-1, AC-2, AC-6 | `setup project` の `if` 撤去（常時実行）+ `mask staging credentials` で auth path notice + `verify bearer freshness` step |
| 4 | `scripts/smoke/runtime-attendance-provider.sh` | 修正 | AC-3 | 401 reason を `auth-token-expired` / `auth-secret-drift` に分割（helper import 経由）。decode不能時は auth-secret-drift へ分類 |
| 5 | `scripts/smoke/mint-staging-bearers.mts` | 修正 | AC-4 | 署名直後に `verifySessionJwt` 自己検証を追加 |
| 6 | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` / `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | 修正 / 新規 | AC-4 | 既存 parity / TTL 回帰に加え、self-verify fail path（M-3）を module mock で追加 |
| 7 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | **新規** | AC-5 | bearer ライフサイクル / secret 同期不変条件 / 診断ディシジョンツリーの SSOT |
| 8 | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 修正 | AC-5 | SSOT リンク + 鮮度ゲート運用注記 |

## 1. `scripts/smoke/bearer-freshness-gate.mts`（新規・C-1）

### 1.1 関数シグネチャ（Phase 2 §C-1 と完全一致）

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

### 1.2 各関数のロジック（入出力・副作用・エラーハンドリング）

- `decodeJwtExp(token)`:
  - payload segment を base64url decode して `exp` が finite number の場合だけ返す。decode / JSON parse / 型不一致は `null`。token 文字列や claim は出力しない。
- `classifyBearerFreshness(input)`:
  - `exp === null` は `{ status: "invalid", secondsRemaining: null }`。
  - `secondsRemaining <= 0` は `expired`、`secondsRemaining < thresholdSeconds` は `stale`、それ以外は `fresh`。
  - `label` / `exp` / `secondsRemaining` / `status` のみ返し、token 文字列や `email` / `memberId` などの claim は返さない。
- `explainAuthFailureFromBearer(input)`:
  - `exp !== null && exp <= nowSeconds` なら `auth-token-expired`、それ以外（未来 exp / decode 不能）は `auth-secret-drift`。

### 1.3 CLI

```text
STAGING_ADMIN_BEARER=<token> STAGING_ME_BEARER=<token> pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts
```

| 入力（env） | 振る舞い | 終了コード |
|---|---|---|
| `STAGING_ADMIN_BEARER`, `STAGING_ME_BEARER`, `FRESHNESS_THRESHOLD_SECONDS`（任意、既定 21600） | admin / me の両 bearer を `classifyBearerFreshness` で検査し、`fresh` 以外なら `::error::<LABEL> is <status>; seconds_remaining=<N>; refresh the static bearer or provision STAGING_AUTH_SECRET...` を出す。冒頭に `runtime-smoke auth path: <path>` を出す | 全 bearer が `fresh` なら 0。`stale` / `expired` / `invalid` が 1 件でもあれば 1 |

- CLI guard は `import.meta.url === new URL(process.argv[1] ?? "", "file:").href`。test import 時は main を走らせない。
- `Date.now()` / env 読み取りは CLI（main）内に限定し、純粋関数には `nowSeconds` / `thresholdSeconds` を引数で渡す。
- 副作用の境界: stdout / stderr には auth path、label、status、secondsRemaining、threshold のみを出す。token 文字列・`exp` 以外の claim を出さない。

## 2. `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts`（新規・C-1）

Phase 4 の D-1〜D-6 / A-1〜A-6 / C-1〜C-4 を実装する。ダミー token は `signSessionJwt("test-secret", { ttlSeconds: 600, nowSeconds: 1_700_000_000, ... })` で生成（exp=1_700_000_600）、または非署名 token を base64url で手組みする。`Date.now` に依存せず純粋関数へ `nowSeconds` を直接渡す。

## 3. `.github/workflows/runtime-smoke-staging.yml`（修正・C-2）

### 3.1 `setup project` の `if` 撤去（常時実行）

現行（L38-40）:

```yaml
      - name: setup project
        if: env.STAGING_AUTH_SECRET != ''
        uses: ./.github/actions/setup-project
```

→ `if: env.STAGING_AUTH_SECRET != ''` を削除し常時実行へ変更（静的 fallback 時も `pnpm exec tsx` が必要なため）。`mint staging bearers` step（L42-68）の `if: env.STAGING_AUTH_SECRET != ''` は**維持**する（AC-6: mint optional 維持）。

### 3.2 2 step 挿入位置

`mask staging credentials` step で auth path を notice し、同 step の直後・`run runtime smoke` step の直前に freshness gate を挿入する。

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

- `mask staging credentials`: `RUNTIME_SMOKE_AUTH_PATH=minted` は mint step が設定し、未設定なら `static-fallback` として `GITHUB_ENV` に追記する。notice は secret 値を含まない。
- `verify bearer freshness`: admin / me 両 bearer を 1 回の CLI 実行で検査する。いずれかが `stale` / `expired` / `invalid` なら step が fail し smoke は実行されない。
- 副作用の境界: gate step は exit code と redact 済みメッセージのみ。bearer 値は env 経由で渡し echo しない。

## 4. `scripts/smoke/runtime-attendance-provider.sh`（修正・C-3）

現行の 401 分類（L170-174、`auth-token-invalid-or-expired` 単一）を、使用中 bearer の exp を helper で判定して分岐する形へ差し替える。`request_json` は既に `local bearer="$3"`（L139）で bearer を保持している。

差し替え後（L170-174 の `elif [[ "$status" == "401" ]]` ブロック）:

```sh
    elif [[ "$status" == "401" ]] && {
      printf '%s' "$redacted_body" | jq -e '.error == "unauthorized"' >/dev/null 2>&1 ||
        printf '%s' "$redacted_body" | grep -Eq '"error"[[:space:]]*:[[:space:]]*"unauthorized"'
    }; then
      failure_reason="$(classify_unauthorized_bearer "$bearer")"
```

- 500（`auth-secret-binding-missing`、L167-169）と 403（`auth-not-admin`、L175-179）の分岐は不変。
- `classify_unauthorized_bearer` は `pnpm exec tsx -e` で `explainAuthFailureFromBearer({ token })` を import し、`auth-token-expired` / `auth-secret-drift` のいずれかのみ stdout に出す。
- 副作用・エラーハンドリング: bearer は child process の argv で渡し、reason 文字列のみを `failure_reason` に格納する。bearer 値は log / summary に出さない。decode 不能は `explainAuthFailureFromBearer` 側で `auth-secret-drift` へ寄せる。

## 5. `scripts/smoke/mint-staging-bearers.mts`（修正・C-4）

`signSessionJwt` の import に `verifySessionJwt` を追加し、署名後に admin / me bearer を自己検証する。

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

- 副作用なし（純粋関数を維持）。
- エラーハンドリング: self-verify が `null` または claim mismatch を返したら `Error` を throw。`Error.message` は固定文言のみで、token 文字列・secret を含めない（不変条件 5/6）。

## 6. `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（修正・C-4）

既存 `mint-staging-bearers.spec.ts` は parity / TTL / 戻り値キーの回帰を維持する。self-verify 失敗経路は `mint-staging-bearers-self-verify.spec.ts` で `@ubm-hyogo/shared` の `verifySessionJwt` を module mock し、`null` 返却時に reject し、`Error.message` に JWT 文字列や secret が含まれないことを assert する。

## 7. `reference/bearer-lifecycle-ssot.md`（新規・C-5）

Phase 2 §C-5 の 6 項目を単一 SSOT として記載する。

1. bearer = HS256 session JWT（`signSessionJwt` / `verifySessionJwt`、`packages/shared/src/auth.ts:93,127`）。
2. TTL: 静的 fallback bearer = 86400 秒（24h、`SESSION_JWT_TTL_SECONDS`、`auth.ts:42`）/ minted = 600 秒（`mint-staging-bearers.mts:18`）。
3. secret 同期不変条件: mint 鍵 `STAGING_AUTH_SECRET`（GitHub 環境 secret）≡ staging API `AUTH_SECRET`（Cloudflare secret）。不一致時は署名検証が通らず 401 `unauthorized`（drift）。
4. 診断ディシジョンツリー（smoke reason → 原因 → アクション）:
   - `auth-secret-binding-missing`（500）→ staging API に `AUTH_SECRET` 未投入 → `bash scripts/cf.sh secret put`。
   - `auth-token-expired`（401, exp ≤ now）→ 静的 bearer 失効 → 再発行 or mint 有効化。
   - `auth-secret-drift`（401, exp > now）→ mint 鍵 ≠ API 鍵 → 両者を同値に再同期。
   - `auth-not-admin`（403）→ identity の isAdmin=false → member identity secret 修正。
5. 鮮度ゲート運用: 既定 threshold=21600 秒（6h）。loud fail 時は本 SSOT のディシジョンツリーへ誘導。
6. 恒久化: `STAGING_AUTH_SECRET` を staging-runtime-smoke 環境へ投入すると mint path（失効しない）が有効化される。手順は `secret-provisioning.md`。

実 secret 値・JWT 文字列・署名鍵は記載しない（不変条件 1）。

## 8. `secret-provisioning.md`（修正・C-6）

冒頭に SSOT（`reference/bearer-lifecycle-ssot.md`）へのリンクと、「鮮度ゲートが失効 6h 前に loud fail する」運用注記を追記する。実値は転記せず op 参照のみ（不変条件 1）。

## 実装順序（推奨）

1. `bearer-freshness-gate.mts`（#1）→ unit（#2）で純粋関数の Red→Green を固定。
2. `mint-staging-bearers.mts` self-verify（#5）→ unit（#6）。
3. `runtime-attendance-provider.sh` reason 分岐（#4）。
4. `runtime-smoke-staging.yml`（#3）— setup 常時化 + 2 step 挿入。
5. SSOT（#7）+ runbook（#8）。
6. ローカル検証: typecheck / lint / vitest / actionlint。

## DoD（完了の定義）

- `mise exec -- pnpm typecheck` がエラー 0（新規 `.mts` の型を含む）。
- `mise exec -- pnpm lint` がエラー 0。
- `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` が全 pass。
- `actionlint .github/workflows/runtime-smoke-staging.yml` がエラー 0。
- `bash -n scripts/smoke/runtime-attendance-provider.sh` が構文エラー 0。
- 想定動作確認: `STAGING_ADMIN_BEARER="<fresh token>" STAGING_ME_BEARER="<fresh token>" mise exec -- pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts` が exit 0。失効済み / stale / invalid token では exit 1 となり、token 文字列を含まない `::error::` を出す。
- `git grep` で新規 / 変更ファイルに JWT 文字列 / 署名鍵 / secret 実値の平文出力が 0 件。required status check context 名（`runtime smoke staging / smoke`）が不変。

## 実行タスク

1. 新規 / 修正 8 ファイルを種別付きで列挙し、各受入条件を割り当てる（本 Phase で完了）。
2. `bearer-freshness-gate.mts` の 3 関数シグネチャ・ロジック・CLI 仕様を確定する（#1）。
3. `runtime-smoke-staging.yml` の `setup project` if 撤去と 2 step 挿入位置（mask step 直後 L85-90）を確定する（#3）。
4. `runtime-attendance-provider.sh` の 401 reason 分岐差し替え（L170-174）を確定する（#4）。
5. `mint-staging-bearers.mts` の self verification 追加位置を確定する（#5）。
6. SSOT（#7）と runbook（#8）の追記項目を確定する。
7. DoD（typecheck / lint / vitest / actionlint / shell 構文 / 想定動作確認 / grep gate）を確定する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 4（テスト計画） | D-1〜D-6 / A-1〜A-6 / C-1〜C-4 / M-1〜M-3 を Green へ遷移させる実装の正本入力とする | phase-4-test-plan.md |
| Phase 6（テスト追加） | 実装後に freshness gate CLI exit code・auth-secret-drift・token 非出力の回帰 guard を追加する | phase-6-test-additions.md |
| workflow ↔ scripts 統合 | C-2 workflow から C-1 freshness gate CLI（direct CLI）と C-3 経由の classify を結線し、pre-flight fail と 401 reason 細分化が end-to-end で成立することを確認する | .github/workflows/runtime-smoke-staging.yml ↔ scripts/smoke/ |
| mint ↔ shared 統合 | C-4 self verification が `@ubm-hyogo/shared` の `signSessionJwt` / `verifySessionJwt` と結線して self-verify する | scripts/smoke/mint-staging-bearers.mts ↔ packages/shared/src/auth.ts |

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
|---|---|---|
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud / throw 設計 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret / token 非露出の運用基準 |
| 認証/セキュリティ core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | session 検証境界 |

### プロジェクト仕様 / コードアンカー

| 参照資料 | パス:行 | 内容 |
|---|---|---|
| 設計 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-6 |
| テスト計画 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-4-test-plan.md` | D/A/C/M ケース |
| 署名/検証/TTL | `packages/shared/src/auth.ts:42,93,127` | `SESSION_JWT_TTL_SECONDS` / `signSessionJwt` / `verifySessionJwt` |
| mint helper | `scripts/smoke/mint-staging-bearers.mts:18,30,36,88-92` | `DEFAULT_TTL_SECONDS` / 置換対象 sign 呼び出し / CLI guard 形 |
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh:139,167-180` | bearer 保持 / 現行 reason 分類 |
| workflow | `.github/workflows/runtime-smoke-staging.yml:38-95` | setup / mint / mask / smoke step |

## 成果物

- 本ファイル（`phase-5-implementation.md`）: 新規 / 修正 8 ファイルの差分方針・行アンカー・関数シグネチャ・DoD。

## 完了条件

- [x] 新規 / 修正 8 ファイルが種別付きで列挙されている。
- [x] 各ファイルの差分方針が phase-2-design.md の C-1〜C-6 を引用して具体化されている。
- [x] 挿入位置が行アンカー（workflow mask step 直後 L85-90 / smoke runner L170-174 差し替え / mint L30,36 の signSessionJwt 置換 / setup-project L38-40 の if 撤去）で明記されている。
- [x] 関数シグネチャ・入出力・副作用・エラーハンドリングが記述されている。
- [x] DoD（ビルド / typecheck / lint / vitest / actionlint / shell 構文 / 想定動作確認 / grep gate）が確定している。
