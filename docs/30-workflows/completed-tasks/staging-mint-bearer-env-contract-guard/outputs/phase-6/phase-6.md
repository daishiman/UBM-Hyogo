# Phase 6: テスト拡充（対策 B: env 契約 drift 検出 gate）

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)（特に §2.3 対策 B drift gate）, [phase-3.md](../phase-3/phase-3.md)。
> 本 phase は **Lane-2** の担当で、新規 `scripts/smoke/verify-mint-env-contract.mts` の pure 関数 `detectContractViolations` と descriptor 抽出関数に対するテストを確定する。
> 区分: 実装仕様書（CONST_004）/ NON_VISUAL / ci-gate。証跡は自動テスト + actionlint（Phase 11）。

---

## 6.1 テスト対象と責務（CONST_005: 変更/新規ファイルパスと種別）

| パス | 種別 | テスト対象 | 対策 |
|------|------|-----------|------|
| `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | **新規** | 下記 2 関数 | B |
| `scripts/smoke/verify-mint-env-contract.mts` | **新規**（Phase 5 実装） | `detectContractViolations`（pure）/ descriptor 抽出関数 | B |

> 本 phase は **テスト spec のみ**を確定する。`verify-mint-env-contract.mts` 本体実装は Phase 5（Lane-1/Lane-2 接合）で行う。本 spec は phase-2 §2.3.2 のシグネチャを正本として RED→GREEN を駆動する。

### 不変条件（既存維持・本 spec で検証する境界）

1. `detectContractViolations` は pure（`process.env` / `process.exit` / I/O を触らない）。入力 descriptor + provisionedSecrets のみから violation を返す。
2. `ContractViolation.names` は **env 名のみ**（値・secret・JWT を一切含まない）。phase-2 不変条件 #1（env 名のみ・値非露出）を spec で機械検証する。
3. `main` の I/O（YAML 読込・exit）は薄く保ち、判定ロジックは pure 関数へ寄せる。fail path のテストは pure 関数の戻り値 + 薄い exit 判定の組合せで網羅する。

---

## 6.2 対象シグネチャ（phase-2 §2.3.2 を逐語転記 / CONST_005）

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
```

### 契約の単一の真実（gate が参照する基準）

`detectContractViolations` は `requiredEnvForRoles(roles)`（= `COMMON_REQUIRED_ENV ∪ 各 role の ROLE_REQUIRED_ENV`）を mint script から import して算出する（phase-2 §2.3.1 V-4 / §2.2.1）。テストは以下の契約定数を前提に期待値を組む（phase-2 §2.2.1）:

| 定数 | 値 |
|------|-----|
| `COMMON_REQUIRED_ENV` | `["STAGING_AUTH_SECRET"]` |
| `ROLE_REQUIRED_ENV.admin` | `["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"]` |
| `ROLE_REQUIRED_ENV.me` | `["STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"]` |

→ `requiredEnvForRoles(["admin"])` = `["STAGING_AUTH_SECRET","STAGING_ADMIN_MEMBER_ID","STAGING_ADMIN_EMAIL"]`
→ `requiredEnvForRoles(["admin","me"])` = 上記 + `["STAGING_ME_MEMBER_ID","STAGING_ME_EMAIL"]`

---

## 6.3 入出力（CONST_005: descriptor + provisionedSecrets → violation[]）

| 入力 | 型 | 説明 |
|------|----|------|
| `input.steps` | `MintStepDescriptor[]` | workflow から抽出した mint step 群（テストでは直接組み立てる） |
| `input.provisionedSecrets` | `string[]` | `provision-staging-secrets.sh` の `SECRETS` から抽出した NAME 集合 |
| `input.strict` | `boolean?` | 既定 `false`。`excess_env`（V-2）の severity 切替（既定 warn / strict=true で error） |
| **出力** | `ContractViolation[]` | 各 step の missing_env / excess_env / provision_gap。空配列 = drift なし |

---

## 6.4 V-1〜V-3 を網羅するテストケース表（CONST_005: テストケース）

> 出典: phase-2 §2.3.1 の検証 V-1（missing_env）/ V-2（excess_env）/ V-3（provision_gap）。
> 完全 provision 集合 = 全 role 必須 env（テストで共通利用）:
> `FULL_SECRETS = ["STAGING_AUTH_SECRET","STAGING_ADMIN_MEMBER_ID","STAGING_ADMIN_EMAIL","STAGING_ME_MEMBER_ID","STAGING_ME_EMAIL"]`

| ID | 目的 | 入力 descriptor / provision | 期待 violation |
|----|------|------------------------------|----------------|
| **T-B1（V-1 missing_env）** | admin-only step が `STAGING_ADMIN_MEMBER_ID` を渡していない | `{jobId:"bulk-tag-runtime-smoke", stepName:"mint staging admin bearer", roles:["admin"], providedEnv:["STAGING_AUTH_SECRET","STAGING_ADMIN_EMAIL"], degrade:true}`、`provisionedSecrets=FULL_SECRETS` | `[{ kind:"missing_env", severity:"error", names:["STAGING_ADMIN_MEMBER_ID"], jobId/stepName 一致 }]`。`severity==="error"` を assert |
| **T-B2（正常系）** | bulk-tag step が `roles=[admin]` + providedEnv に admin 系完備 | `{roles:["admin"], providedEnv:["STAGING_AUTH_SECRET","STAGING_ADMIN_MEMBER_ID","STAGING_ADMIN_EMAIL"], degrade:true}`、`provisionedSecrets=FULL_SECRETS` | **violation 0 件**（`toHaveLength(0)`） |
| **T-B3（V-2 excess_env / 既定 warn）** | admin-only step に `STAGING_ME_MEMBER_ID` が居る（不要 env 過剰参照）。`strict` 未指定 | `{roles:["admin"], providedEnv:["STAGING_AUTH_SECRET","STAGING_ADMIN_MEMBER_ID","STAGING_ADMIN_EMAIL","STAGING_ME_MEMBER_ID"]}`、`provisionedSecrets=FULL_SECRETS` | `[{ kind:"excess_env", severity:"warn", names:["STAGING_ME_MEMBER_ID"] }]`（`severity==="warn"`） |
| **T-B4（V-2 excess_env / strict=true で error）** | T-B3 と同入力で `strict:true` | T-B3 の steps + `strict:true` | `[{ kind:"excess_env", severity:"error", names:["STAGING_ME_MEMBER_ID"] }]`（`severity==="error"`） |
| **T-B5（V-3 provision_gap）** | `provisionedSecrets` が `STAGING_ME_EMAIL` を欠く | steps = 既定 admin,me の正常 step（providedEnv 完備）、`provisionedSecrets = FULL_SECRETS から STAGING_ME_EMAIL を除いた集合` | `provision_gap` violation を含み、`names` に `"STAGING_ME_EMAIL"` を含む。`kind==="provision_gap"` の要素を抽出して assert |
| **T-B6（既定 roles 完備正常系）** | `roles` 未指定（= 既定 `["admin","me"]`）の step で両系 env 完備 | `{roles:["admin","me"], providedEnv:[...COMMON, ...admin, ...me 全 5 件], degrade:false}`、`provisionedSecrets=FULL_SECRETS` | **violation 0 件** |
| **T-B7（names が env 名のみ・値非露出）** | 全 kind の violation で `names` の各要素が `STAGING_` で始まる env 名のみであること（secret 値・JWT 文字列・`op://` 参照を含まない） | T-B1 / T-B3 / T-B5 の violation 群 | 各 `v.names.every(n => /^STAGING_[A-Z_]+$/.test(n))` が true。`op://` / `.` / 空白を含まない |

### 補足（テスト実装方針）

- T-B6 の「既定 roles」は descriptor 抽出側（main）が `roles` 未解決時に `["admin","me"]` を充てる契約（phase-2 §2.2.4）。`detectContractViolations` には解決済み `roles` が渡る前提のため、descriptor に明示的に `["admin","me"]` を入れる。
- `missing_env`（V-1）と `provision_gap`（V-3）は常に `error`、`excess_env`（V-2）のみ `strict` で `warn↔error` が切り替わる（phase-2 §2.3.1）。この severity マッピングを各ケースで明示 assert する。
- `names` は出現順を断定しない（`toContain` / `expect.arrayContaining` を使用し配列等値比較を避ける）。

---

## 6.5 fail path / 回帰 guard（main の exit 判定 / CONST_005: DoD）

> 方針（phase-2 §2.3.2 / 不変条件 #3）: **main の I/O は薄く、判定は pure 関数に寄せる**。
> exit code は「`error` severity の violation が 1 件以上 → exit 1、`warn` のみ（または 0 件）→ exit 0」。
> この `violations → exitCode` のマッピングを **小さな pure helper に切り出してテストする**（直接 `process.exit` をテストしない）。

### 抽出する exit 判定 helper（Phase 5 実装・本 spec で要求）

```ts
// pure: violation 一覧 → exit code（main はこれを呼ぶだけ）
export function exitCodeForViolations(violations: ContractViolation[]): 0 | 1;
//   - violations に severity==="error" を 1 件以上含む → 1
//   - error なし（warn のみ / 空）→ 0
```

| ID | 目的 | 入力 | 期待 |
|----|------|------|------|
| **T-B8（fail: error 1 件で exit 1）** | error severity 1 件以上で main が落ちる回帰 guard | T-B1 の violation（`severity:"error"`）1 件を含む配列 | `exitCodeForViolations(...) === 1` |
| **T-B9（pass: warn のみで exit 0）** | warn のみ（drift 軽微）で CI を止めない | T-B3 の violation（`severity:"warn"`）のみの配列 | `exitCodeForViolations(...) === 0` |
| **T-B10（pass: 空配列で exit 0）** | 違反なしで exit 0 | `[]` | `exitCodeForViolations([]) === 0` |
| **T-B11（fail: error + warn 混在で exit 1）** | warn が混ざっても error が 1 件あれば 1 | T-B1（error）+ T-B3（warn）混在配列 | `exitCodeForViolations(...) === 1` |

> `main` 自体（YAML 読込 → descriptor 抽出 → `detectContractViolations` → `exitCodeForViolations` → `process.exit` / メッセージ出力）は薄い orchestration のためユニット直接テストしない。`detectContractViolations` と `exitCodeForViolations` の 2 pure 関数を網羅することで main の振る舞いを実質的に担保する（bearer-freshness-gate.mts の `evaluateFreshnessGate` を pure に寄せ `main` を薄くした既存パターンを踏襲）。

---

## 6.6 descriptor 抽出ロジックのテスト方針（YAML 抽出 / js-yaml 依存判定）

### 依存確認手順（Phase 5/6 着手時に必ず実行 / phase-2 §2.3.3）

```bash
# js-yaml が repo の直接依存に存在するか確認
grep -r "js-yaml" package.json pnpm-lock.yaml
node -e "const p=require('./package.json'); console.log(JSON.stringify({dep:p.dependencies?.['js-yaml'],dev:p.devDependencies?.['js-yaml']}))"
```

**現時点の確認結果（spec 作成時 2026-06-07）**: `js-yaml` は `package.json` の `dependencies` / `devDependencies` いずれにも**直接依存として存在しない**（`pnpm-lock.yaml` には transitive で 3 箇所出現するのみ）。
→ **新規依存追加はしない**（phase-2 §2.3.3「無ければ追加せず正規表現ベースの最小 parser」）。**正規表現抽出のユニットテスト**を採用する。

> Phase 5 着手時に再確認し、もし直接依存が追加済みなら `js-yaml` の `load` を用いる方針へ切替可。本 spec の抽出テスト（T-B12〜T-B15）は parser 実装手段に依存しない「fixture YAML 文字列 → MintStepDescriptor」の入出力契約でテストするため、いずれの手段でも同一 spec が使える。

### 抽出関数シグネチャ（Phase 5 実装・pure・process.env 非参照）

```ts
// pure: workflow YAML 文字列を受け取り、mint-staging-bearers.mts を呼ぶ step を MintStepDescriptor[] へ抽出
export function extractMintStepDescriptors(workflowYaml: string): MintStepDescriptor[];
//   - run に "mint-staging-bearers.mts" を含む step を mint step と判定
//   - roles: run の "--roles <v>" または env.MINT_ROLES を parseRoles で解決（無指定 → ["admin","me"]）
//   - providedEnv: 当該 step の env: ブロックのキー一覧
//   - degrade: env.RUNTIME_SMOKE_MINT_DEGRADE === "1"

// pure: provision shell 文字列から SECRETS の NAME 集合を抽出
export function extractProvisionedSecrets(provisionShell: string): string[];
//   - SECRETS 配列の "NAME:op://..." 行から NAME を取得（値・op 参照は捨てる）
```

### fixture YAML 文字列を渡す抽出テスト（pure / I/O 非依存）

| ID | 目的 | 入力 fixture（テスト内文字列） | 期待 |
|----|------|--------------------------------|------|
| **T-B12** | admin-only mint step を抽出し roles/providedEnv/degrade を解決 | `MINT_ROLES: 'admin'` + `--roles admin` を含み、`env:` に `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `RUNTIME_SMOKE_MINT_DEGRADE: '1'` を持つ最小 job YAML 文字列 | 1 件抽出、`roles===["admin"]`、`providedEnv` に 3 env 含む、`degrade===true` |
| **T-B13** | roles 無指定 step は既定 admin,me に解決 | `--roles` も `MINT_ROLES` も持たず `mint-staging-bearers.mts` を run する step | `roles===["admin","me"]`、`degrade===false`（RUNTIME_SMOKE_MINT_DEGRADE 不在） |
| **T-B14** | mint script を呼ばない step は抽出されない | `run: echo hello` のみの step を含む YAML | mint step 0 件（`toHaveLength(0)`） |
| **T-B15** | provision shell から SECRETS NAME のみ抽出（値・op 参照非露出） | `SECRETS=( "STAGING_AUTH_SECRET:op://Employee/ubm-hyogo-env/STAGING_AUTH_SECRET" "STAGING_ADMIN_MEMBER_ID:op://..." )` を含む shell 文字列 | `["STAGING_AUTH_SECRET","STAGING_ADMIN_MEMBER_ID"]`（`op://` を含まない・`:` 以降を捨てる） |

> T-B15 は抽出結果に `op://` / Vault 名 / Field 名が混入しないことも assert し、不変条件 #1（値非露出）を抽出層でも担保する。fixture 文字列内に実 secret 値は書かない（参照キー名のみ）。

---

## 6.7 ローカル実行コマンド（CONST_005: 実行コマンド）

```bash
# 本 spec 単体実行
pnpm exec vitest run scripts/smoke/__tests__/verify-mint-env-contract.spec.ts

# Phase 5/6 着手前の依存確認
grep -r "js-yaml" package.json pnpm-lock.yaml

# 後方互換回帰（既存 mint spec が壊れていないこと / AC-12）
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts \
  scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts
```

---

## 6.8 DoD（Phase 6 / CONST_005）

| # | 完了条件 | 検証 |
|---|----------|------|
| DoD-1 | `verify-mint-env-contract.spec.ts` が新規作成され、V-1/V-2/V-3 を網羅（T-B1〜T-B7） | spec 内ケース存在 |
| DoD-2 | fail path / 回帰 guard（error→exit 1 / warn のみ→exit 0）を `exitCodeForViolations` で検証（T-B8〜T-B11） | `pnpm exec vitest run` PASS |
| DoD-3 | descriptor 抽出（fixture YAML → MintStepDescriptor、provision shell → secrets）を検証（T-B12〜T-B15） | 同上 |
| DoD-4 | `ContractViolation.names` が env 名のみ（値・op 参照非露出）を機械 assert（T-B7 / T-B15） | 同上 |
| DoD-5 | js-yaml 直接依存の有無を着手時 grep で確認し、無ければ正規表現抽出テストを採用（新規依存追加なし） | §6.6 手順実行ログ |
| DoD-6 | `pnpm exec vitest run scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` が全 PASS | コマンド実行 |
| DoD-7 | 既存 mint spec 2 本が後方互換で PASS（AC-12 / 回帰防止） | §6.7 回帰コマンド |

## 6.9 完了条件（Phase 6）

- [x] テスト対象（`verify-mint-env-contract.mts` の `detectContractViolations` / 抽出関数 / `exitCodeForViolations`）を確定
- [x] V-1/V-2/V-3 網羅のテストケース表（T-B1〜T-B7）を確定
- [x] fail path / 回帰 guard（T-B8〜T-B11）を確定
- [x] YAML 抽出テスト方針（js-yaml 依存判定 + 正規表現抽出 / T-B12〜T-B15）を確定
- [x] ローカル実行コマンド・DoD を記載
