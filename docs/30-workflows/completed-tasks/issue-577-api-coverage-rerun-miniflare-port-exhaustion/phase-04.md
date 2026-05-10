# Phase 4 — 統合テスト設計（rerun 手順 / triage 再実行手順 / matrix シナリオ）

## 目的

Phase 11 で機械的に走らせるため、rerun と triage の実行スクリプトレベルのシナリオを Phase 4 で固定する。

## 入力 / 前提

- Phase 2 の canonical path
- Phase 3 の matrix 軸

## 手順

1. baseline rerun シナリオを定義する:
   ```
   for i in 1 2 3; do
     workflow=docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion
     mkdir -p "$workflow/outputs/phase-11/evidence"
     start_epoch=$(date +%s)
     set +e
     mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 \
       | tee "$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log"
     exit_code=${PIPESTATUS[0]}
     set -e
     duration_sec=$(($(date +%s) - start_epoch))
     {
       echo ""
       echo "# command_result"
       echo "exit_code=$exit_code"
       echo "duration_sec=$duration_sec"
     } >> "$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log"
   done
   ```
2. triage matrix シナリオを軸別に定義する:
   - 軸 B: `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" --maxWorkers=1 --minWorkers=1 apps/api`
   - 軸 A: `vitest --pool=forks`
   - 軸 C: `vitest --no-file-parallelism`
   - 軸 D: `vitest --shard=1/2` を 2 回（1/2, 2/2）
3. 各シナリオの判定条件:
   - PASS: exit_code=0 かつ EADDRNOTAVAIL stack trace なし
   - FAIL（再現）: EADDRNOTAVAIL を log 内に検出（`grep -c EADDRNOTAVAIL` ≥ 1）。assertion failure / timeout / command setup failure は別 `exit_reason` として分類する。
   - FAIL（その他）: 別エラー → triage 対象外、別 Issue 候補として `unassigned-task` へ
4. matrix 結果を Phase 11 の `triage-summary.md` に表形式で記録する仕様を定義する。

## 成果物

- `outputs/phase-04/main.md`（baseline / matrix シナリオの実行コマンド集 + 判定条件）

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage --help 2>&1 | head -20
mise exec -- pnpm vitest --pool=forks --help 2>&1 | head -20
```

## 完了条件（DoD）

- [ ] baseline rerun シナリオが具体コマンドで記述されている。
- [ ] matrix 軸 B/A/C/D 各シナリオが具体コマンドで記述されている。
- [ ] 判定条件（PASS / FAIL再現 / FAIL別 ）が明示されている。
