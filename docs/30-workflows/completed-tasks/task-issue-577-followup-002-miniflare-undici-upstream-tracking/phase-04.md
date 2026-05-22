# Phase 4: テスト戦略

## A/B 採用判定基準

改善検知時に `--maxWorkers={N}` を採用するための **必要十分条件**:

1. **連続 3 回実行で 133/133 PASS**（既存テスト件数。Issue #577 と同 baseline）
2. **3 回とも 0 EADDRNOTAVAIL**（log に `EADDRNOTAVAIL` 文字列が 1 件も出ない）
3. wall-clock が現行（`--maxWorkers=1`）より短縮されている（観測値として記録、判定必須ではない）

**1 度でも fail または EADDRNOTAVAIL 発生 → その N は不採用**。より大きい候補は実行せず、`ab-summary.md` に `skipped_due_to_lower_candidate_failure` として記録する。

## 候補値の試行順序

```
1. --maxWorkers=2  → green ならさらに 4 を試す
2. --maxWorkers=4  → green ならさらに auto を試す
3. --maxWorkers=auto
```

採用値は「green を満たした最大値」。`--maxWorkers=2` が fail した場合は `4` / `auto` を試さず `--maxWorkers=1` 維持。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers={N} \
  2>&1 | tee outputs/phase-11/evidence/ab-{N}-run-{R}.log
```

- `{N}` ∈ `{2, 4, auto}`
- `{R}` ∈ `{1, 2, 3}`（連続 3 回）
- 各実行間に `sleep 5` を入れて socket 解放を待つ（macOS TIME_WAIT 緩和）

## evidence 命名規則

```
outputs/phase-11/evidence/
├── triage-table.md                # 必須（改善あり/なし両方）
├── pkg-unchanged.log              # 改善なし時のみ（git status apps/api/package.json）
├── ab-2-run-1.log                 # 改善あり時のみ
├── ab-2-run-2.log
├── ab-2-run-3.log
├── ab-4-run-{1,2,3}.log           # ab-2 が green の場合のみ
├── ab-auto-run-{1,2,3}.log        # ab-4 が green の場合のみ
└── ab-summary.md                  # 改善あり時のみ（採用値と根拠）
```

## 集計コマンド

```bash
# PASS 数確認
grep -E "Tests\s+[0-9]+ passed" outputs/phase-11/evidence/ab-*.log
# EADDRNOTAVAIL カウント
grep -c "EADDRNOTAVAIL" outputs/phase-11/evidence/ab-*.log
```

期待: PASS 行が `133 passed (133)`、EADDRNOTAVAIL カウント 0。

## coverage 閾値（不変条件）

- 既存 coverage gate を **下げない**。`--maxWorkers` 変更は並列数だけが変わる前提
- coverage 数値が下がった場合は採用しない（並列起因の collection 漏れの疑い）

## テスト戦略 out of scope

- vitest 設定ファイル（`vitest.config.ts`）の編集
- テストケース追加 / 削除
- mock 化 / Miniflare 設定変更

## 次フェーズへの引き継ぎ事項

Phase 5 で release 取得 → triage 記入 → A/B 実行までの一気通貫 runbook を作成する。
