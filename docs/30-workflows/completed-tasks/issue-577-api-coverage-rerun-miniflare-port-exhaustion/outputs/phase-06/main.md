# Phase 06 — `scripts/api-coverage-rerun.sh` ヘルパスクリプト仕様

Status: SKELETON_READY (実装は Phase 11 で判断)
Date: 2026-05-09

## 1. インタフェース仕様

```
Usage:
  bash scripts/api-coverage-rerun.sh baseline [--count=N]
  bash scripts/api-coverage-rerun.sh matrix --axis=<B|A|C|D> --value=<value>
  bash scripts/api-coverage-rerun.sh --help
```

| subcommand | flag | 役割 |
| --- | --- | --- |
| `baseline` | `--count=N`（既定 3） | `pnpm --filter @ubm-hyogo/api test:coverage` を N 回実行し log を `baseline-rerun-{1..N}.log` に保存 |
| `matrix` | `--axis=B --value=maxWorkers=1` | 軸 B 実行 |
| `matrix` | `--axis=A --value=pool=forks` | 軸 A 実行 |
| `matrix` | `--axis=C --value=no-file-parallelism` | 軸 C 実行 |
| `matrix` | `--axis=D --value=shard=1/2`（と `2/2` を 2 回） | 軸 D 実行 |

## 2. 副作用

- log ファイル書き出しのみ。`outputs/phase-11/evidence/` 配下に書き出す。
- git 操作・ネットワーク以外の変更操作なし。
- 1 回でも fail しても残りの rerun は継続し、各 log 末尾に `exit_code` / `duration_sec` / `eaddrnotavail_count` を append する。

## 3. スケルトン

```bash
#!/usr/bin/env bash
set -uo pipefail

WORKFLOW="docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion"
EVIDENCE_DIR="$WORKFLOW/outputs/phase-11/evidence"
mkdir -p "$EVIDENCE_DIR"

write_header() {
  local log="$1"
  {
    echo "# rerun-id=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "# host=$(uname -a)"
    echo "# node=$(mise exec -- node -v 2>/dev/null || echo NA)"
    echo "# pnpm=$(mise exec -- pnpm -v 2>/dev/null || echo NA)"
    echo "# port_range_first=$(sysctl -n net.inet.ip.portrange.first 2>/dev/null || echo NA)"
    echo "# port_range_last=$(sysctl -n net.inet.ip.portrange.last 2>/dev/null || echo NA)"
  } > "$log"
}

write_footer() {
  local log="$1" exit_code="$2" duration_sec="$3"
  local eaddr_count
  eaddr_count=$(grep -c EADDRNOTAVAIL "$log" || true)
  {
    echo ""
    echo "# command_result"
    echo "exit_code=$exit_code"
    echo "duration_sec=$duration_sec"
    echo "eaddrnotavail_count=$eaddr_count"
  } >> "$log"
}

run_once() {
  local log="$1"; shift
  write_header "$log"
  local start_epoch=$(date +%s)
  set +e
  "$@" 2>&1 | tee -a "$log"
  local exit_code=${PIPESTATUS[0]}
  set -e
  write_footer "$log" "$exit_code" "$(($(date +%s) - start_epoch))"
  return "$exit_code"
}

cmd_baseline() {
  local count=3
  for arg in "$@"; do
    case "$arg" in
      --count=*) count="${arg#*=}";;
    esac
  done
  local last_exit=0
  for i in $(seq 1 "$count"); do
    local log="$EVIDENCE_DIR/baseline-rerun-${i}.log"
    run_once "$log" mise exec -- pnpm --filter @ubm-hyogo/api test:coverage || last_exit=$?
    sleep 10
  done
  return "$last_exit"
}

cmd_matrix() {
  local axis="" value=""
  for arg in "$@"; do
    case "$arg" in
      --axis=*) axis="${arg#*=}";;
      --value=*) value="${arg#*=}";;
    esac
  done
  local slug
  slug=$(echo "$value" | tr '/=' '--')
  local log="$EVIDENCE_DIR/triage-matrix-${slug}.log"
  case "$axis" in
    B) run_once "$log" mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" --maxWorkers=1 --minWorkers=1 apps/api ;;
    A) run_once "$log" mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" --pool=forks apps/api ;;
    C) run_once "$log" mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" --no-file-parallelism apps/api ;;
    D) run_once "$log" mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" --shard="$value" apps/api ;;
    *) echo "unknown axis: $axis" >&2; return 2;;
  esac
}

case "${1:-}" in
  baseline) shift; cmd_baseline "$@";;
  matrix)   shift; cmd_matrix "$@";;
  --help|-h|"")
    sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# //'
    ;;
  *) echo "unknown subcommand: $1" >&2; exit 2;;
esac
```

## 4. smoke test 計画（Phase 10 と整合）

| ケース | 期待 |
| --- | --- |
| `baseline --count=0` | exit 0、log 書き出しなし |
| `--help` | usage を stdout に出力 |
| `matrix --axis=B --value=maxWorkers=1` | `triage-matrix-maxWorkers-1.log` を書き出し |
| 不正 subcommand | exit 2、stderr に usage |

## 5. 採用判断

- 既定: 仕様書（本ファイル）にスケルトンを記録するのみ。
- Phase 11 baseline 3 回連続 PASS が得られた場合、`scripts/api-coverage-rerun.sh` の実体追加は **行わない**（no-code verification close-out 整合）。
- baseline で再現した場合に、本スケルトンを実コードとして `scripts/api-coverage-rerun.sh` に追加し matrix を回す。
