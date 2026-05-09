# Phase 9: テスト計画

## 目的

unit × 5 ファイル / fixture / leakage / latency benchmark の計画を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## テストファイル一覧

| ファイル | 種別 | 主要ケース |
| --- | --- | --- |
| `scripts/cf-audit-log/__tests__/classifier-isolation-forest.test.ts` | unit | (1) artifact 不在 → fallback / (2) invalid path → fallback / (3) artifact ロード成功時 score → severity |
| `scripts/cf-audit-log/__tests__/classifier-xgboost.test.ts` | unit | (1) artifact 不在 → fallback / (2) artifact ロード成功時 boosted decision score → severity |
| `scripts/cf-audit-log/__tests__/classifier-workers-ai.test.ts` | unit | (1) URL/token 不在 fallback / (2) async fetch mock 200 OK / (3) async gateway error fallback |
| `scripts/cf-audit-log/__tests__/model-comparison.test.ts` | fixture | (1) classifier metrics block / (2) 4 classifier comparison + Workers AI sync fallbackRate=1 |
| `scripts/cf-audit-log/__tests__/selection-criteria.test.ts` | unit | (1) precision below baseline+5pt reject / (2) fallback rate >1% reject / (3) latency p95 >500ms reject / (4) precision tie-break / (5) latency tie-break |

## Fixture

`tests/fixtures/cf-audit/`:

| ファイル | 内容 |
| --- | --- |
| `labeled-90day.jsonl` | synthetic 90 日相当 labeled dataset（FU-03-B output 同 schema、全行 redacted） |
| `model-isolation-forest.json` | 学習済み artifact 例（trees=2, thresholds 既知値） |
| `model-xgboost.json` | 学習済み artifact 例（boosters=2, baseScore=0.5） |
| `comparison-baseline-result.json` | comparison snapshot 比較用 baseline |

## leakage grep test

- `scripts/cf-audit-log/__tests__/classifier-*.test.ts` 各テストの末尾で `runLeakageGrep(artifactPath)` を呼び exit 0 を確認
- `model-comparison.test.ts` で生成された report.md / metrics.json に対しても grep exit 0 を確認

## latency benchmark

- `model-comparison.test.ts` 内で各 classifier の latencyP95 を計測する。Workers AI の sync comparison path は network-bound にせず threshold fallback として扱い、fallbackRate=1 を記録する。Workers AI の real async latency / quota 比較は production-equivalent replay 前提の FU-03-D gate で扱う。

## AC との対応

| AC | 対応 test |
| --- | --- |
| AC-1 | classifier-isolation-forest / xgboost / workers-ai (各 1 ケース) |
| AC-2 | classifier-* (各 fallback ケース 4 種) |
| AC-3 | model-comparison snapshot |
| AC-4 | selection-criteria 全 5 ケース |
| AC-5 | training script output + leakage grep を Phase 11 command evidence で検証 |
| AC-6 | factory env 伝播は `analyze.ts` / `offline-replay.ts` / workflow env contract と Phase 11 grep review で確認 |
| AC-7 | 全 5 test pass |
| AC-8 | comparison test で `outputs/phase-11/` への書き出し evidence |
| AC-12 | leakage grep を全 test の末尾に組み込み |

## 実行コマンド

```bash
# focused
pnpm vitest run scripts/cf-audit-log/__tests__/classifier-isolation-forest.test.ts \
                scripts/cf-audit-log/__tests__/classifier-xgboost.test.ts \
                scripts/cf-audit-log/__tests__/classifier-workers-ai.test.ts \
                scripts/cf-audit-log/__tests__/model-comparison.test.ts \
                scripts/cf-audit-log/__tests__/selection-criteria.test.ts

# 全体
pnpm typecheck
pnpm lint

# 比較レポート手動生成（Phase 11 evidence）
pnpm tsx scripts/cf-audit-log/evaluation/model-comparison.ts \
  --compare-models tests/fixtures/cf-audit/labeled-90day.jsonl \
  --if-model tests/fixtures/cf-audit/model-isolation-forest.json \
  --xgb-model tests/fixtures/cf-audit/model-xgboost.json \
  --output-json docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/comparison-metrics.json \
  --output-md   docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/model-comparison-report.md
```

## 完了条件

- [ ] 5 test ファイルの主要ケースを記述
- [ ] fixture 4 ファイル設計を記述
- [ ] AC との対応表を作成
- [ ] 実行コマンドを確定

## 出力

- `phase-09.md`

## 参照資料

- `index.md`
- `phase-04.md` ・ `phase-06.md` ・ `phase-08.md`
- 親 #515 phase-09

## 統合テスト連携

- 本タスクは NON_VISUAL のため Vitest unit / fixture が integration を兼ねる

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 の成果物を上流契約として参照する。
