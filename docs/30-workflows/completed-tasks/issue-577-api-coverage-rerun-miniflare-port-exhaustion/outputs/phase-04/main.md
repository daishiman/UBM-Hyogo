# Phase 04 — 統合テスト設計（rerun / triage matrix シナリオ）

Status: COMPLETED
Date: 2026-05-09

## 1. baseline rerun シナリオ

```bash
workflow=docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion
mkdir -p "$workflow/outputs/phase-11/evidence"
for i in 1 2 3; do
  log="$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log"
  {
    echo "# rerun-id=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "# host=$(uname -a)"
    echo "# node=$(mise exec -- node -v)"
    echo "# pnpm=$(mise exec -- pnpm -v)"
    echo "# port_range_first=$(sysctl -n net.inet.ip.portrange.first 2>/dev/null || echo NA)"
    echo "# port_range_last=$(sysctl -n net.inet.ip.portrange.last 2>/dev/null || echo NA)"
  } > "$log"

  start_epoch=$(date +%s)
  set +e
  mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 | tee -a "$log"
  exit_code=${PIPESTATUS[0]}
  set -e
  duration_sec=$(($(date +%s) - start_epoch))
  eaddr_count=$(grep -c EADDRNOTAVAIL "$log" || true)
  {
    echo ""
    echo "# command_result"
    echo "exit_code=$exit_code"
    echo "duration_sec=$duration_sec"
    echo "eaddrnotavail_count=$eaddr_count"
  } >> "$log"
  sleep 10  # TIME_WAIT mitigation
done
```

## 2. triage matrix シナリオ

各シナリオは「baseline で再現した場合のみ」実行する。コマンドは `--root=../..`、`--config=vitest.config.ts` を維持し、`--coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}"` を保ったまま flag を追加する。

### 軸 B: worker cap（`--maxWorkers=1 --minWorkers=1`）

```bash
log="$workflow/outputs/phase-11/evidence/triage-matrix-maxWorkers-1.log"
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --passWithNoTests --root=../.. --config=vitest.config.ts \
  --coverage --coverage.reportsDirectory=apps/api/coverage \
  --coverage.include="apps/api/src/**/*.{ts,tsx}" \
  --maxWorkers=1 --minWorkers=1 apps/api 2>&1 | tee -a "$log"
```

### 軸 A: `--pool=forks`

```bash
log="$workflow/outputs/phase-11/evidence/triage-matrix-pool-forks.log"
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --passWithNoTests --root=../.. --config=vitest.config.ts \
  --coverage --coverage.reportsDirectory=apps/api/coverage \
  --coverage.include="apps/api/src/**/*.{ts,tsx}" \
  --pool=forks apps/api 2>&1 | tee -a "$log"
```

### 軸 C: `--no-file-parallelism`

```bash
log="$workflow/outputs/phase-11/evidence/triage-matrix-no-file-parallelism.log"
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --passWithNoTests --root=../.. --config=vitest.config.ts \
  --coverage --coverage.reportsDirectory=apps/api/coverage \
  --coverage.include="apps/api/src/**/*.{ts,tsx}" \
  --no-file-parallelism apps/api 2>&1 | tee -a "$log"
```

### 軸 D: `--shard=1/2` + `--shard=2/2`

```bash
for s in 1 2; do
  log="$workflow/outputs/phase-11/evidence/triage-matrix-shard-${s}-of-2.log"
  mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
    --passWithNoTests --root=../.. --config=vitest.config.ts \
    --coverage --coverage.reportsDirectory=apps/api/coverage \
    --coverage.include="apps/api/src/**/*.{ts,tsx}" \
    --shard=${s}/2 apps/api 2>&1 | tee -a "$log"
done
```

## 3. 判定条件

| 結果 | 条件 |
| --- | --- |
| PASS | `exit_code=0` かつ `grep -c EADDRNOTAVAIL <log>` が `0` |
| FAIL（再現） | `grep -c EADDRNOTAVAIL <log>` ≥ 1 |
| FAIL（その他） | exit_code≠0 かつ EADDRNOTAVAIL=0 → assertion / timeout / setup error。triage 対象外 |

## 4. 結果記録

各シナリオ終了時に `triage-summary.md` の表を 1 行ずつ更新する。停止条件（PASS が出た時点で以降の軸を skip）に従う。
