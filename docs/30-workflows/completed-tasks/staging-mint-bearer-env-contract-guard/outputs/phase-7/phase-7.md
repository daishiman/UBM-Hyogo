# Phase 7: カバレッジ確認（対策 B: env 契約 drift 検出 gate）

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)（§2.3 対策 B）, [phase-3.md](../phase-3/phase-3.md), [phase-6.md](../phase-6/phase-6.md)。
> 本 phase は **Lane-2** の担当で、Phase 6 のテストが対象関数を十分に網羅していることを確認する。
> 区分: 実装仕様書 / NON_VISUAL / ci-gate。
> **方針（Feedback BEFORE-QUIT-002 / Feedback 5）**: カバレッジは「全ファイル一律 100%」ではなく、**今回変更/新規したファイルの対象関数のみ**を範囲とする。既存 runner には踏み込まない。

---

## 7.1 カバレッジ対象範囲（限定明記 / Feedback 5）

### 対象（IN — 本タスクの新規/変更関数のみ）

| ファイル | 対象関数 | 種別 | 目標 |
|----------|----------|------|------|
| `scripts/smoke/verify-mint-env-contract.mts` | `detectContractViolations` | pure（判定中核） | line 100% / branch 100% |
| `scripts/smoke/verify-mint-env-contract.mts` | `exitCodeForViolations` | pure（exit 判定） | line 100% / branch 100% |
| `scripts/smoke/verify-mint-env-contract.mts` | `extractMintStepDescriptors` | pure（YAML 抽出） | line 100% / branch 100% |
| `scripts/smoke/verify-mint-env-contract.mts` | `extractProvisionedSecrets` | pure（provision 抽出） | line 100% / branch 100% |

### 対象外（OUT — 明示除外）

| 対象 | 除外理由 |
|------|----------|
| `verify-mint-env-contract.mts` の `main()` | I/O 薄層（ファイル読込・`process.exit`・メッセージ出力）。判定は上記 pure 関数へ寄せ済み（phase-2 §2.3.2 / phase-6 §6.5）。pure 関数網羅で実質担保 |
| `scripts/smoke/runtime-attendance-provider.sh` 等の既存 runner | 本タスクスコープ外（index.md §2 スコープ外: smoke runner 本体ロジック変更なし） |
| `scripts/smoke/mint-staging-bearers.mts` の role-scoping 関数 | **Lane-1（Phase 4/7 の A 側）の担当範囲**。本 phase（Lane-2）は B gate のみを対象とする |
| `scripts/smoke/provision-staging-secrets.sh` | shell（C / Lane-3）。`bash -n` + verify gate で担保（vitest coverage 対象外） |
| その他全 apps/* / packages/* | 本タスクで非変更 |

> import 元の mint script 定数（`ROLE_REQUIRED_ENV` 等）は gate の依存だが、その定義自体のカバレッジは Lane-1 の mint spec が担保する。本 phase は gate 側の利用経路（`requiredEnvForRoles` 呼び出しを経た violation 算出分岐）を網羅できていれば良い。

---

## 7.2 カバレッジ取得コマンド（CONST_005: 実行コマンド）

vitest の coverage provider は `@vitest/coverage-v8`（`package.json` devDependencies に存在・spec 作成時確認済み）。

```bash
# 対象 spec のみで coverage を取得（範囲を絞る）
pnpm exec vitest run --coverage \
  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts

# 対象ファイルだけに include を絞って取りたい場合（推奨・他ファイルのノイズ排除）
pnpm exec vitest run --coverage \
  --coverage.include='scripts/smoke/verify-mint-env-contract.mts' \
  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts
```

> `vitest.config.ts` に coverage 設定が無い / provider 未解決などで `--coverage` が動かない場合は、§7.4 の **手動分岐網羅チェックリスト**で代替する（Feedback 5 の許容代替経路）。代替時もチェックリスト全項目 ✅ を Phase 11 証跡に残す。

---

## 7.3 カバレッジ実測値の取得方針（証跡に残す）

| 関数 | line 目標 | branch 目標 | 実測値の記録先 |
|------|----------|------------|----------------|
| `detectContractViolations` | 100% | 100% | `outputs/phase-11/evidence/verify-mint-env-contract-coverage.log`（vitest coverage table 抜粋） |
| `exitCodeForViolations` | 100% | 100% | 同上 |
| `extractMintStepDescriptors` | 100% | 100% | 同上 |
| `extractProvisionedSecrets` | 100% | 100% | 同上 |

- 実測値は coverage table（`% Stmts / % Branch / % Funcs / % Lines`）の該当ファイル行を Phase 11 証跡 log に転記する。
- 目標未達（branch < 100%）の場合は、未踏分岐を §7.4 チェックリストで特定し、Phase 6 spec へケースを追記してから再取得する（Phase 6 ↔ Phase 7 反復）。
- カバレッジ数値そのものを AC とはしない（AC は drift 検出の振る舞い）。**変更関数の branch を踏み残さない**ことを DoD とする。

---

## 7.4 手動分岐網羅チェックリスト（coverage 設定不在時の代替 / Feedback 5）

> phase-6 の T-Bn と対応づけ、各関数の分岐を漏れなく踏むことをチェックする。

### `detectContractViolations` の分岐

| # | 分岐 | 踏むケース |
|---|------|-----------|
| 1 | missing_env あり（required ⊄ providedEnv） | T-B1 |
| 2 | missing_env なし（required ⊆ providedEnv） | T-B2 / T-B6 |
| 3 | excess_env あり + `strict` 未指定/false → severity=warn | T-B3 |
| 4 | excess_env あり + `strict===true` → severity=error | T-B4 |
| 5 | excess_env なし | T-B2 / T-B6 |
| 6 | provision_gap あり（required 全 env ⊄ provisionedSecrets） | T-B5 |
| 7 | provision_gap なし | T-B2 / T-B6 |
| 8 | 複数 step ループ（steps.length ≥ 1） | 各ケース（単一 step）+ 任意で複数 step ケース |

### `exitCodeForViolations` の分岐

| # | 分岐 | 踏むケース |
|---|------|-----------|
| 1 | error を 1 件以上含む → 1 | T-B8 / T-B11 |
| 2 | error なし（warn のみ） → 0 | T-B9 |
| 3 | 空配列 → 0 | T-B10 |

### `extractMintStepDescriptors` の分岐

| # | 分岐 | 踏むケース |
|---|------|-----------|
| 1 | run に mint script 含む step を抽出 | T-B12 / T-B13 |
| 2 | roles 明示（--roles / MINT_ROLES）→ parseRoles | T-B12 |
| 3 | roles 無指定 → 既定 ["admin","me"] | T-B13 |
| 4 | degrade=true（RUNTIME_SMOKE_MINT_DEGRADE==="1"） | T-B12 |
| 5 | degrade=false（env 不在 / "1" 以外） | T-B13 |
| 6 | mint script を呼ばない step を除外 | T-B14 |

### `extractProvisionedSecrets` の分岐

| # | 分岐 | 踏むケース |
|---|------|-----------|
| 1 | `NAME:op://...` 行から NAME 抽出（`:` で分割） | T-B15 |
| 2 | op 参照 / 値を捨てる（NAME のみ返す） | T-B15（`op://` 非露出 assert） |

> 上記すべてに対応 T-Bn が存在することを確認 → branch を踏み残さない設計。新たな分岐を Phase 5 実装で追加した場合は、その分岐を踏むケースを Phase 6 へ追記し本表を更新する。

---

## 7.5 DoD（Phase 7 / CONST_005）

| # | 完了条件 | 検証 |
|---|----------|------|
| DoD-1 | カバレッジ対象を変更/新規ファイルの 4 pure 関数に限定明記（全ファイル一律でない / Feedback 5） | §7.1 |
| DoD-2 | `detectContractViolations` / `exitCodeForViolations` / 抽出 2 関数の line 100% / branch 100% を目標とし、実測を証跡 log に残す | §7.2 / §7.3 + coverage log |
| DoD-3 | coverage 設定不在時は手動分岐網羅チェックリスト全項目 ✅ で代替 | §7.4 |
| DoD-4 | 対象外（既存 runner / mint script Lane-1 関数 / provision shell / apps）を明示除外 | §7.1 OUT 表 |
| DoD-5 | drift 検出で exit 1・正常で exit 0 の振る舞い（Phase 6 T-B8〜T-B11）がカバレッジ範囲に含まれる | §7.4 `exitCodeForViolations` 表 |

## 7.6 完了条件（Phase 7）

- [x] カバレッジ対象範囲を「変更/新規関数のみ」に限定明記（Feedback BEFORE-QUIT-002 / Feedback 5）
- [x] line / branch カバレッジ目標（100%）と実測取得方針を確定
- [x] カバレッジ取得コマンド（`--coverage`）+ 代替（手動分岐チェックリスト）を確定
- [x] 対象外を明示除外（既存 runner / Lane-1 関数 / shell / apps）
- [x] DoD を記載
