# Phase 04 outputs / main

## A/B 採用判定基準

1. 連続 3 回 133/133 PASS
2. 3 回とも 0 EADDRNOTAVAIL
3. wall-clock 短縮（観測値、判定必須ではない）

→ 1 度でも fail / EADDRNOTAVAIL は不採用。より大きい候補は実行せず、`ab-summary.md` に skip 理由を記録する。

## 試行順序

```
--maxWorkers=2 → green なら 4 → green なら auto
```

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers={N} \
  2>&1 | tee outputs/phase-11/evidence/ab-{N}-run-{R}.log
```

実行間 `sleep 5`。

## evidence 命名規則

- `ab-{2,4,auto}-run-{1,2,3}.log`
- `ab-summary.md`（採用根拠 / skip 理由）
- `triage-table.md`（改善なしも必須）
- `pkg-unchanged.log`（改善なし時）

## coverage 不変条件

baseline より低下したら不採用。

## 次フェーズ

Phase 5 runbook 化。
