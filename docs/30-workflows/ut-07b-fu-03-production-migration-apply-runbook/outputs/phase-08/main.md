# Phase 8 成果物: DRY 化 / 重複検出（実装仕様書版）

## 検出対象と DRY 化方針

### 1. `scripts/cf.sh` helper ↔ 新規 `scripts/d1/*.sh`

| helper | DRY 化方針 |
| --- | --- |
| `op run --env-file=.env` | `scripts/cf.sh` を `source` で再利用（`_lib.sh` 薄層） |
| `ESBUILD_BINARY_PATH` 解決 | 同上 |
| `mise exec --` | 同上 |
| Token redaction | 新設 `scripts/d1/_redact.sh`（cf.sh には逆輸入しない） |
| exit code 規約 | 新設 `scripts/d1/_exit_codes.sh` |

### 2. UT-07B Phase 5 ↔ 本タスク Phase 5 Part A

| 項目 | DRY 化方針 |
| --- | --- |
| 対象 SQL 設計意図 | UT-07B canonical を参照リンク化、本タスクは production apply 差分のみ |
| collision detection SQL | コマンドのみ再掲、SQL 文面は UT-07B canonical |
| rollback シナリオ表 | UT-07B 4 行を base、Phase 6 で production 固有 4 行を追補 |
| `cf.sh` ルール | 本タスクで強化、UT-07B は base reference |

### 3. CI workflow 重複

| workflow | 方針 |
| --- | --- |
| `deploy.yml` ↔ `d1-migration-verify.yml` | composite action `setup-cf-cli` 抽出は時期尚早（3 件目発生時に再評価） |

### 4. bats fixture

| fixture | 方針 |
| --- | --- |
| mock wrangler / mock op / migrations list / wrangler.toml.sample | 単一 `scripts/d1/__tests__/__fixtures__/` に集約 |

## DRY 化候補の採否（YAGNI 適用）

| 候補 | 採否 |
| --- | --- |
| `_lib.sh` / `_redact.sh` / `_exit_codes.sh` | 採用 |
| 文書参照リンク化 / rollback 継承 + 追補 / bats fixture 集約 | 採用 |
| 統合 runbook 化 | 不採用 |
| 共通 SQL スニペット集 | 不採用（将来候補） |
| composite action `setup-cf-cli` | 不採用（将来候補） |
| 自動化 wrapper（preflight + apply + postcheck の bash 集約） | 不採用（AC-2 侵害） |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | cf.sh 拡張と新規 d1/*.sh の責務分離明確 |
| 漏れなし | PASS | helper / 文書 / CI / fixture すべてに採否判定 |
| 整合性 | PASS | CLAUDE.md / U-FIX-CF-ACCT-01 / UT-07B canonical / AC-9 / AC-19 と整合 |
| 依存関係整合 | PASS | 上流 / 下流タスクと破綻しない |

## 将来再評価条件

- 共通 SQL スニペット集: 参照箇所 3 件目発生時
- composite action `setup-cf-cli`: workflow 3 件目で抽出

## 関連リンク

- 仕様書: `../../phase-08.md`
- index: `../../index.md`
