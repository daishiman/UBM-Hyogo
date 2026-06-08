# Phase 2: 設計

> 前提: [phase-1.md](../phase-1/phase-1.md)。本 phase は role-scoping API / drift gate アルゴリズム / degrade / topology を確定し、後続 Phase 4-13 が迷わず実装できる粒度まで固める。

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存資産 | 再利用 | 方針 |
|----------|--------|------|
| `mintStagingBearers(env)` pure 関数 | **再利用 + 拡張** | 全 role を mint する現行関数は維持し、role-scoped な薄い orchestration を `main()` 側 / 新規 helper に追加。pure 関数の責務は変えない |
| `signSessionJwt` / `verifySessionJwt`（`@ubm-hyogo/shared`） | 再利用 | 変更なし |
| `bearer-freshness-gate.mts` の base64url decode パターン | 参考 | drift gate では JWT decode は不要 |
| 既存 workflow の `if: env.X != ''` skip パターン | 再利用 | degrade の job/step 条件に流用 |
| 既存 `verify-hook-integrity.yml` workflow 構造 | 参考テンプレ | 新規 `verify-mint-env-contract.yml` の骨格に流用 |

> 新規 primitive は最小化。新規追加は (1) role-scoping ロジック、(2) drift gate script、(3) gate workflow の 3 点のみ。

## 2.2 対策 A: mint script role-scoping 設計

### 2.2.1 role モデル

```ts
// mint-staging-bearers.mts に追加
type MintRole = "admin" | "me";

// 各 role が必要とする env 名の宣言的マップ（drift gate と共有する単一の真実）
// 注: AUTH_SECRET は全 role 共通の前提 env として別扱い。
const ROLE_REQUIRED_ENV: Record<MintRole, readonly string[]> = {
  admin: ["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"],
  me: ["STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"],
};
const COMMON_REQUIRED_ENV = ["STAGING_AUTH_SECRET"] as const;
```

> **単一の真実（single source of truth）**: `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` は drift gate（対策 B）からも import される。env 契約はこの 2 定数だけが正本。export して B から参照することで「契約の二重定義」を排除する（責務境界の明確化）。

### 2.2.2 公開シグネチャ

```ts
// 新規 export（pure・process.env 非参照）: --roles 文字列を MintRole[] へ
export function parseRoles(rawRoles: string | undefined): MintRole[];
//   - undefined / "" → ["admin", "me"]（既定 = 後方互換）
//   - "admin" → ["admin"]
//   - "me" → ["me"]
//   - "admin,me" / "me,admin" → 重複排除し宣言順 ["admin","me"]
//   - 未知 role（"foo"）→ throw new Error("unknown role: foo")（値のみ・secret 非露出）

// 新規 export（pure）: 要求 role に対する必須 env 名一覧を返す
export function requiredEnvForRoles(roles: MintRole[]): string[];
//   = COMMON_REQUIRED_ENV ∪ (各 role の ROLE_REQUIRED_ENV を flat)

// 新規 export（pure）: env オブジェクトから不足 env 名を返す（値は読まない・存在判定のみ）
export function findMissingEnv(
  required: string[],
  env: Record<string, string | undefined>,
): string[];

// 既存 pure 関数は維持。role-scoped mint の薄い wrapper を追加:
export interface MintRoleResult {
  readonly adminBearer?: string;
  readonly meBearer?: string;
  readonly memberId?: string; // admin role 含有時のみ（既存 STAGING_MEMBER_ID 互換）
}
export async function mintStagingBearersForRoles(
  roles: MintRole[],
  env: {
    authSecret: string;
    adminMemberId?: string;
    adminEmail?: string;
    meMemberId?: string;
    meEmail?: string;
    ttlSeconds?: number;
  },
): Promise<MintRoleResult>;
//   - roles に "admin" 含む → adminBearer + memberId を mint
//   - roles に "me" 含む → meBearer を mint
//   - self-verify は mint した role の bearer のみ実施（既存ガード踏襲）
```

### 2.2.3 `main()` フロー（改修後）

```
1. roles = parseRoles(process.env.MINT_ROLES ?? CLI(--roles))   // CLI 優先、なければ env、なければ既定 admin,me
2. required = requiredEnvForRoles(roles)
3. missing = findMissingEnv(required, process.env)
4. if (missing.length > 0):
     a. degrade 判定: DEGRADE = process.env.RUNTIME_SMOKE_MINT_DEGRADE === "1"
     b. if (DEGRADE):
          stderr: "mint-staging-bearers: degraded (missing env: <names>); skipping mint"
          GITHUB_OUTPUT へ degrade marker（mint_degraded=1）を書く
          exit 0   // ← 対策 D: staging では fail させない
        else:
          stderr: "mint-staging-bearers: missing env: <names>"   // 既存メッセージ維持（AC-4）
          exit 2
5. minted = mintStagingBearersForRoles(roles, {...process.env 由来...})
6. GITHUB_OUTPUT へ存在する role の bearer のみ追記:
     - admin 含む: admin_bearer / member_id
     - me 含む: me_bearer
```

> **CLI 引数の解釈**: `--roles admin` のように `process.argv` から取得。`--roles=admin` 形式も許容。env `MINT_ROLES` も同等にサポート（workflow からは env 渡しが簡潔なため両対応）。CLI と env 両指定時は CLI 優先。

### 2.2.4 後方互換（AC-12）

- 引数・env 無指定 → `parseRoles(undefined) = ["admin","me"]` → 現行と完全同一動作（既存 `smoke` job は無改修で動く）。
- 既存 pure 関数 `mintStagingBearers` のシグネチャ・返り値は不変。既存テスト T-A1〜T-A5 は影響なし。

### 2.2.5 bulk-tag job 配線（AC-5）

`.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke.steps[mint staging admin bearer]`:

```yaml
        env:
          STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
          STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
          STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
          MINT_ROLES: 'admin'                      # ← 追加（admin only）
          RUNTIME_SMOKE_MINT_DEGRADE: '1'          # ← 追加（D: staging degrade）
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
          ...
```

> ME 系 secret 参照は bulk-tag job から**削除/不追加**（不要なため）。`smoke` job は両 role 必要なので無改修（既定 admin,me）か明示 `--roles admin,me` を付与（gate が要求する明示性に応じて Phase 5 で決定）。

## 2.3 対策 B: env 契約 drift 検出 gate 設計

### 2.3.1 `verify-mint-env-contract.mts` の責務

workflow YAML を静的解析し、mint-staging-bearers.mts を呼ぶ全 step について次を検証:

| 検証 | 内容 | drift 時 |
|------|------|----------|
| V-1 | step が呼ぶ `--roles`（または `MINT_ROLES` env）から要求 env 集合を算出し、step の `env:` ブロックがそれを満たすか。`RUNTIME_SMOKE_MINT_DEGRADE=1` は runtime fallback であり、静的契約欠落を免除しない | 不足 env を列挙し exit 1 |
| V-2 | step の `env:` に、その role で**不要**な env（例 admin-only step に ME 系）が無いか（過剰参照の警告。staging では warn、strict mode で fail） | warn（既定）/ fail（`--strict`） |
| V-3 | provision script（`provision-staging-secrets.sh`）の `SECRETS` カバー集合が、全 role 合算の必須 env（mint script が要求しうる全 env）を含むか | 不足 secret を列挙し exit 1（AC-7） |
| V-4 | `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV`（mint script から import）が gate 算出の基準であること（契約の単一の真実） | — |

### 2.3.2 公開シグネチャ（pure 中心・test 可能化）

```ts
// 解析対象を表す中間表現（pure 関数が受け取る）
export interface MintStepDescriptor {
  readonly jobId: string;
  readonly stepName: string;
  readonly roles: MintRole[];        // --roles / MINT_ROLES から解決済み（既定 admin,me）
  readonly providedEnv: string[];    // step env: ブロックのキー名
  readonly degrade: boolean;         // RUNTIME_SMOKE_MINT_DEGRADE === '1'
}

export interface ContractViolation {
  readonly jobId: string;
  readonly stepName: string;
  readonly kind: "missing_env" | "excess_env" | "provision_gap";
  readonly names: string[];          // 値ではなく env 名のみ
  readonly severity: "error" | "warn";
}

// pure: step 記述子群 + provision カバー集合 → 違反一覧
export function detectContractViolations(input: {
  readonly steps: MintStepDescriptor[];
  readonly provisionedSecrets: string[];
  readonly strict?: boolean;
}): ContractViolation[];

// I/O 層（main）: 対象 workflow YAML / provision shell を読み、descriptor を抽出して detectContractViolations へ
//   - YAML パースは既存依存（js-yaml 等）を確認し利用。無ければ最小の正規表現抽出（Phase 2 §2.6 で確定）
//   - error severity の違反が 1 件以上 → exit 1、warn のみ → exit 0（メッセージは出す）
```

### 2.3.3 抽出ロジック（main）

- 対象 workflow: `.github/workflows/runtime-smoke-staging.yml`（拡張容易なよう対象パスは定数配列で持つ）。
- 各 job の steps を走査し、`run` に `mint-staging-bearers.mts` を含む step を mint step と判定。
- `roles`: 同 step の `--roles <v>`（run 文字列）または `env.MINT_ROLES` を読み、`parseRoles` で解決。
- `providedEnv`: step の `env:` キー一覧。
- `degrade`: step `env.RUNTIME_SMOKE_MINT_DEGRADE === '1'`。
- `provisionedSecrets`: `provision-staging-secrets.sh` の `SECRETS` 配列の `NAME:ref` から NAME を抽出。

> **依存確認（Phase 4/5 前チェック）**: `js-yaml` が repo に存在するか `grep -r "js-yaml" package.json pnpm-lock.yaml`。存在すれば import、無ければ追加せず正規表現ベースの最小 parser（job/step/env ブロックのインデント解析）で実装。詳細は Phase 5 で確定。

### 2.3.4 `verify-mint-env-contract.yml`（CI gate）

```yaml
name: verify-mint-env-contract
on:
  pull_request:
    paths:
      - 'scripts/smoke/mint-staging-bearers.mts'
      - 'scripts/smoke/verify-mint-env-contract.mts'
      - 'scripts/smoke/provision-staging-secrets.sh'
      - '.github/workflows/runtime-smoke-staging.yml'
  push:
    branches: [dev, main]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - name: verify mint env contract
        run: pnpm exec tsx scripts/smoke/verify-mint-env-contract.mts
```

> required status check への登録は CLAUDE.md ブランチ戦略に従い user 明示承認後（Phase 13 / 別途）。仕様書では「候補」として記載。

## 2.4 対策 C: provision script 整合更新設計

`provision-staging-secrets.sh` の `SECRETS` を JWT-mint 集合へ更新:

```bash
SECRETS=(
  "STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  "STAGING_AUTH_SECRET:op://Employee/ubm-hyogo-env/STAGING_AUTH_SECRET"
  "STAGING_ADMIN_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ADMIN_MEMBER_ID"
  "STAGING_ADMIN_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ADMIN_EMAIL"
  "STAGING_ME_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ME_MEMBER_ID"
  "STAGING_ME_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ME_EMAIL"
  "SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"
)
```

> - 旧 static-bearer は runtime workflow が temporary fallback として受け付けるが、本 provision script の投入対象からは明示分離する。
> - 既存の `verify_staging_marker` / `ensure_environment` は維持。
> - inventory 検証は「`SECRETS` に列挙した JWT-mint 必須集合が live environment に含まれる」ことを確認する。legacy static-bearer fallback や他 job 用 secret が live inventory に残っていても fail しない。
> - 1Password item 名（`op://.../STAGING_AUTH_SECRET` 等）が実在するかは provision 実行者（user）の前提。仕様書では参照キーのみ記載（CLAUDE.md: 実値非記載）。
> - drift gate（V-3）は「全 role の必須 env が SECRETS に含まれる」ことを検証するため、この更新が gate を満たす。

## 2.5 対策 D: degrade 設計（staging セキュリティ緩和許容）

| 項目 | 設計 |
|------|------|
| トリガ env | `RUNTIME_SMOKE_MINT_DEGRADE=1`（staging job で設定。production は未設定 = hard-fail 維持 / AC-11） |
| degrade 挙動 | 必須 env 欠落時、mint script は exit 0 + `mint_degraded=1` を GITHUB_OUTPUT へ。bearer は書かない |
| workflow 側 | degrade 時は後続の "verify required staging secrets" が static fallback の存在を確認、または該当 job を後続 step の `if` で skip。staging では static-bearer fallback が既にあるため、mint 失敗 → static fallback パスへ自然に流れる |
| 安全性 | degrade は B の gate と併用。gate が drift を PR で止めるため、degrade が実際に発火するのは「secret 未配備の過渡期」のみ。production は対象外 |

> **責務境界**: degrade の発火判定は mint script（env 読み取り主体）。job skip の最終判定は workflow（CI orchestration 主体）。状態所有権を混在させない。

## 2.6 topology / SubAgent lane

| lane | 対象 | 対策 | 並列 |
|------|------|------|------|
| Lane-1 | Phase 4-5（mint role-scoping test + 実装） | A, D | ○ |
| Lane-2 | Phase 6-7（drift gate test 拡充 + coverage） | B | ○ |
| Lane-3 | Phase 8-9（provision 整合 + QA） | C | ○ |
| Lane-4 | Phase 10-13（review / manual / docs / PR 準備） | close-out | 直列 |

> validation lane（Phase 9-10）は直列で締める（skill ベストプラクティス: validation lane は直列）。

## 2.7 ロック変数 / 状態所有権テーブル（参考: STATE-DETAIL-01）

本タスクに UI state machine は無いが、env 解決の状態所有権を明記:

| 状態 | 所有者 |
|------|--------|
| 「どの role が必要か」 | workflow step（`--roles` / `MINT_ROLES`） |
| 「role → 必須 env」契約 | mint script の `ROLE_REQUIRED_ENV`（単一の真実） |
| 「degrade するか」 | mint script（`RUNTIME_SMOKE_MINT_DEGRADE` 読み取り） |
| 「secret が provision 済みか」 | provision script + GitHub Environment |
| 「drift が無いか」 | verify-mint-env-contract gate |

## 2.8 完了条件（Phase 2）

- [x] 既存再利用可否を判定
- [x] A: role-scoping API（`parseRoles`/`requiredEnvForRoles`/`findMissingEnv`/`mintStagingBearersForRoles`）+ main フロー確定
- [x] B: drift gate API（`detectContractViolations` + descriptor）+ workflow 確定
- [x] C: provision script 更新内容確定
- [x] D: degrade 設計（staging 限定・責務境界）確定
- [x] topology / lane / 状態所有権を確定
