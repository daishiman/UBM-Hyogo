# Phase 11: 実行 evidence

## 目的

NON_VISUAL evidence として typecheck / lint / focused test / 比較レポート JSON / Markdown を `outputs/phase-11/` に保存する。本 wave では synthetic 90-day fixture による harness smoke evidence まで完了し、production winner selection は FU-03-B / FU-03-D に分離する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | IMPLEMENTATION_PASS_SYNTHETIC |

## evidence 一覧

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | evidence index（全コマンド + exit code + リンク） |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck` 出力（exit 0） |
| `outputs/phase-11/evidence/lint.log` | `pnpm lint` 出力（exit 0） |
| `outputs/phase-11/evidence/vitest.log` | focused 5 test 実行ログ（all pass） |
| `outputs/phase-11/comparison-metrics.json` | 4 classifier × labeled-90day の比較結果 JSON（Phase 4 schema） |
| `outputs/phase-11/model-comparison-report.md` | 同 Markdown 版（table + winner section） |
| `outputs/phase-11/evidence/leakage-grep.log` | training output / comparison report に対する grep exit 0 ログ |

## 実行コマンド

```bash
pnpm typecheck                                                                                      | tee outputs/phase-11/evidence/typecheck.log
pnpm lint                                                                                           | tee outputs/phase-11/evidence/lint.log
pnpm vitest run scripts/cf-audit-log/__tests__/{classifier-isolation-forest,classifier-xgboost,classifier-workers-ai,model-comparison,selection-criteria}.test.ts | tee outputs/phase-11/evidence/vitest.log

pnpm tsx scripts/cf-audit-log/evaluation/training/train-isolation-forest.ts \
  --input  tests/fixtures/cf-audit/labeled-90day.jsonl \
  --output tests/fixtures/cf-audit/model-isolation-forest.json \
  --seed 42

pnpm tsx scripts/cf-audit-log/evaluation/training/train-xgboost.ts \
  --input  tests/fixtures/cf-audit/labeled-90day.jsonl \
  --output tests/fixtures/cf-audit/model-xgboost.json \
  --seed 42

pnpm tsx scripts/cf-audit-log/evaluation/model-comparison.ts \
  --dataset  tests/fixtures/cf-audit/labeled-90day.jsonl \
  --if-model tests/fixtures/cf-audit/model-isolation-forest.json \
  --xgb-model tests/fixtures/cf-audit/model-xgboost.json \
  --output-json docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/comparison-metrics.json \
  --output-md   docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/model-comparison-report.md

pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts \
  docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/comparison-metrics.json \
  docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/model-comparison-report.md \
  tests/fixtures/cf-audit/model-isolation-forest.json \
  tests/fixtures/cf-audit/model-xgboost.json | tee outputs/phase-11/evidence/leakage-grep.log
```

## evidence 検収基準

- typecheck / lint / vitest exit 0
- comparison-metrics.json に 4 classifier すべての metrics が存在
- selection.winner が `threshold` 含む 4 値のいずれかで明示
- leakage-grep.log の最終行が `OK` で exit 0
- model-comparison-report.md に baseline / each ML / winner の 3 セクション存在

## 完了条件（implementation wave）

- [x] synthetic evidence bundle が `outputs/phase-11/` に実体存在
- [x] AC-1〜AC-12 のうち production dataset / production switch を除く対応 evidence を記録
- [x] leakage grep が training artifact 2 本 + report 2 本に対し exit 0

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/comparison-metrics.json`
- `outputs/phase-11/model-comparison-report.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/vitest.log`
- `outputs/phase-11/evidence/leakage-grep.log`

## 今回 wave の出力

- `outputs/phase-11/main.md`: `IMPLEMENTATION_PASS_SYNTHETIC`
- production winner selection: FU-03-B redacted 90-day dataset replay後に FU-03-D で実施

## 参照資料

- `index.md`
- `phase-09.md` ・ `phase-10.md`
- 親 #515 phase-11

## 統合テスト連携

- vitest.log の集計結果が Phase 12 implementation-guide の test plan セクションに転記される

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 の成果物を上流契約として参照する。
