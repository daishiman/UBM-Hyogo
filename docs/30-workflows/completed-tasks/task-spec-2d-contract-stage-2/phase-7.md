# Phase 7: カバレッジ確認

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 7 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 判定方針

本 contract test は **standard tier の coverage 加点対象外**。理由は以下:

- 検証対象が型・schema parse のみで、route の business logic を実行しない（DB 触らない）
- カバレッジ計測対象は `apps/api/src/routes/admin/*.ts` の logic 行であり、本 spec は parse pass を確認するのみ
- 既存 per-route `contract.spec.ts`（例: audit-correlation）も同様の方針

したがって、本 phase の判定基準は **「green の有無」のみ** とする。

---

## 2. 判定基準

| # | 条件 | 検証 |
|---|------|------|
| 1 | `pnpm --filter @ubm-hyogo/api test contract-stage-2` exit 0 | reporter |
| 2 | 7 describe すべて pass | reporter |
| 3 | fail 0 / skip 0 | reporter |

---

## 3. 線形 coverage 数値の扱い

| 項目 | 扱い |
|------|------|
| `apps/api` 全体の line coverage | 既存 tier 基準で別途計測（本 test は加算しない前提） |
| 本 test 自身の coverage | 計測しない（pure assertion ファイルのため） |
| coverage-guard hook | 本 PR で coverage 低下が出る場合は他 task の merge 影響であり、本 test 由来ではない |

---

## 4. 想定 evidence

- vitest reporter 出力（`PASS apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`）を Phase 11 evidence として記録する

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| coverageException | contract schema parse test; line coverage uplift is not a success metric |

## 目的

本 task の coverage 判定を green/fail、skip 0、grep gate に固定し、line coverage の加点対象外である理由を root metadata と一致させる。

## 実行タスク

1. coverageTier `standard` と coverageException の整合を確認する。
2. focused test の pass/fail を Phase 11 evidence として保存する。
3. coverage guard が本 task の成功条件ではない理由を `phase12-task-spec-compliance-check.md` に転記する。
4. skip 0 / fail 0 を reporter で確認する。

## 参照資料

- `artifacts.json`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `outputs/phase-11/manual-smoke-log.md`

## 成果物

- coverage exception decision
- focused test reporter evidence
- skip 0 evidence

## 完了条件

- [x] root metadata の `coverageException` と Phase 7 本文が一致している
- [x] focused test green が coverage 代替 evidence として記録されている
- [x] line coverage を PASS 根拠にしないことが明記されている
- [x] タスク100%実行確認: Phase 7 の実行タスクをすべて完了してから Phase 8 へ進む

## 統合テスト連携

`mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` の reporter を正本 evidence とする。line coverage の数値を本 task の合否に使わない。
