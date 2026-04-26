# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

GO 後、人間が `pnpm test --filter @ubm/api` を実行し、coverage report と CI workflow yml を evidence として配置する。

## 実行タスク

- [ ] local 実行手順記述
- [ ] coverage report (`outputs/phase-11/evidence/coverage-report.txt`)
- [ ] test 実行ログ (`outputs/phase-11/evidence/test-run.log`)
- [ ] CI workflow yml (`outputs/phase-11/evidence/ci-workflow.yml`)
- [ ] pass / fail 判定欄

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | runbook |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | CI |

## 5 シナリオ

### シナリオ 1: 全 suite 実行

```bash
pnpm install
pnpm --filter @ubm/api test 2>&1 | tee outputs/phase-11/evidence/test-run.log

# Expected: 全 suite green
# 200+ tests pass, 0 fail
```

### シナリオ 2: coverage 閾値達成

```bash
pnpm --filter @ubm/api test -- --coverage 2>&1 | tee outputs/phase-11/evidence/coverage-report.txt

# Expected output (例):
# Statements   : 87.5% ( ... )
# Branches     : 82.1% ( ... )
# Functions    : 89.0% ( ... )
# Lines        : 87.2% ( ... )
# 全閾値 (85% / 80% / 85% / 85%) を超える
```

### シナリオ 3: type test

```bash
pnpm --filter @ubm/shared typecheck 2>&1 | tee -a outputs/phase-11/evidence/test-run.log
pnpm --filter @ubm/shared test 2>&1 | tee -a outputs/phase-11/evidence/test-run.log

# Expected: type-tests.ts の @ts-expect-error が compile fail を観測
```

### シナリオ 4: lint test

```bash
pnpm --filter @ubm/api test -- src/lint 2>&1 | tee -a outputs/phase-11/evidence/test-run.log

# Expected: import-boundary.spec.ts pass
# apps/web から D1 import 0 件
```

### シナリオ 5: CI workflow validate

```bash
# yml validate
yamllint .github/workflows/api-tests.yml

# placeholder を outputs にコピー
cp .github/workflows/api-tests.yml outputs/phase-11/evidence/ci-workflow.yml

# Expected: yml syntax OK
```

## evidence 配置

```
outputs/phase-11/evidence/
├── test-run.log              # vitest 全出力
├── coverage-report.txt       # coverage 内訳
└── ci-workflow.yml           # GitHub Actions yml
```

## pass / fail 判定欄

| シナリオ | 期待 | 結果 | 備考 |
| --- | --- | --- | --- |
| 1 全 suite green | 0 fail | TBD | — |
| 2 coverage ≥ 85/80 | 達成 | TBD | — |
| 3 type test fail check | @ts-expect-error 観測 | TBD | — |
| 4 lint test pass | 0 件 | TBD | — |
| 5 yml validate | OK | TBD | — |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を implementation-guide に反映 |
| 下流 09a | staging deploy 前に test pass 必須 |
| 下流 09b | CI workflow を release runbook に組込 |

## 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11**: smoke で各 test の pass を確認
- 無料枠: CI 5 min 以内
- secret hygiene: coverage report に PII 含まないこと（fixture が個人情報を持たないこと）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 5 シナリオ手順 | 11 | pending | — |
| 2 | evidence 配置 | 11 | pending | 3 ファイル |
| 3 | pass / fail 判定 | 11 | pending | 各シナリオ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果 |
| evidence | outputs/phase-11/evidence/ | log + coverage + yml |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] 5 シナリオ全 pass
- [ ] evidence ファイル 3 種配置
- [ ] coverage 閾値達成

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: smoke 結果と evidence
- ブロック条件: 1 シナリオでも fail なら Phase 5 戻し
