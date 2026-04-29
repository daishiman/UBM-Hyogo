#!/usr/bin/env bash
# coverage-guard.sh — 全 package で coverage 80% 一律強制 (lines/branches/functions/statements)
# 仕様正本: docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md
#
# Usage:
#   bash scripts/coverage-guard.sh              # 全 package を test:coverage 実行 → 集計 → 判定
#   bash scripts/coverage-guard.sh --changed    # 変更された package のみ実行 (lefthook pre-push 用)
#   bash scripts/coverage-guard.sh --package <name>           # 単一 package 限定
#   bash scripts/coverage-guard.sh --threshold 80             # 閾値上書き (default=80)
#   bash scripts/coverage-guard.sh --no-run     # 既存の coverage-summary.json を集計のみ (テスト/CI 高速化用)
#
# Exit code:
#   0 = PASS (全 pkg / 全 metric ≥ threshold)
#   1 = FAIL (いずれか未達 / coverage-summary.json 欠損)
#   2 = ENV ERROR (jq 未導入 / vitest 失敗)

set -u
set -o pipefail

THRESHOLD=80
CHANGED=0
RUN_TESTS=1
PKG_FILTER=""
ROOT_DIR="${COVERAGE_GUARD_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

log() { printf '[coverage-guard] %s\n' "$*" >&2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --changed) CHANGED=1; shift ;;
    --package)
      [ $# -ge 2 ] || { log "ERROR: --package requires a value"; exit 2; }
      PKG_FILTER="$2"; shift 2
      ;;
    --threshold)
      [ $# -ge 2 ] || { log "ERROR: --threshold requires a value"; exit 2; }
      THRESHOLD="$2"; shift 2
      ;;
    --no-run) RUN_TESTS=0; shift ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *) log "ERROR: unknown arg: $1"; exit 2 ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  log "ENV ERROR: jq is required (>=1.6). brew install jq"
  exit 2
fi

case "$THRESHOLD" in
  ''|*[!0-9.]*|.*|*.*.*) log "ERROR: --threshold must be a number"; exit 2 ;;
esac

# Package 列挙: workspace 慣例に従い apps/* / packages/* / packages/integrations/*
discover_packages() {
  local dirs=()
  for d in "$ROOT_DIR"/apps/*/ "$ROOT_DIR"/packages/*/ "$ROOT_DIR"/packages/integrations/*/; do
    [ -d "$d" ] || continue
    [ -f "${d}package.json" ] || continue
    # packages/integrations 自体は package だが、サブディレクトリ packages/integrations/google も別 package
    case "$d" in
      */node_modules/*) continue ;;
    esac
    dirs+=("${d%/}")
  done
  printf '%s\n' "${dirs[@]}"
}

changed_packages() {
  # base = origin/dev or HEAD~1 (fallback)
  local base
  base=$(git -C "$ROOT_DIR" merge-base HEAD origin/dev 2>/dev/null || echo "HEAD~1")
  local changed
  changed=$(git -C "$ROOT_DIR" diff --name-only "$base"...HEAD 2>/dev/null || true)
  if [ -z "$changed" ]; then
    return 0
  fi
  discover_packages | while read -r pkg; do
    rel="${pkg#$ROOT_DIR/}"
    if printf '%s\n' "$changed" | grep -q "^${rel}/"; then
      printf '%s\n' "$pkg"
    fi
  done
}

package_name() {
  jq -r '.name // empty' "$1/package.json"
}

run_tests() {
  if [ "$CHANGED" = "0" ] && [ -z "$PKG_FILTER" ]; then
    log "running: pnpm -r --workspace-concurrency=1 test:coverage"
    ( cd "$ROOT_DIR" && pnpm -r --workspace-concurrency=1 test:coverage )
    return $?
  fi

  local failed=0
  for pkg in "${TARGETS[@]}"; do
    local name
    name=$(package_name "$pkg")
    if [ -z "$name" ]; then
      log "ENV ERROR: package name not found: ${pkg#$ROOT_DIR/}"
      failed=1
      continue
    fi
    log "running: pnpm --filter ${name} test:coverage"
    if ! ( cd "$ROOT_DIR" && pnpm --filter "$name" test:coverage ); then
      failed=1
    fi
  done
  return "$failed"
}

# 集計対象 package を解決
resolve_targets() {
  if [ -n "$PKG_FILTER" ]; then
    discover_packages | while read -r p; do
      rel="${p#$ROOT_DIR/}"
      base=$(basename "$p")
      if [ "$rel" = "$PKG_FILTER" ] || [ "$base" = "$PKG_FILTER" ]; then
        printf '%s\n' "$p"
      fi
    done
  elif [ "$CHANGED" = "1" ]; then
    changed_packages
  else
    discover_packages
  fi
}

format_top10() {
  local pkg="$1"
  local final_json="${pkg}/coverage/coverage-final.json"
  if [ ! -f "$final_json" ]; then
    log "  (coverage-final.json なし: $final_json — top10 出力スキップ)"
    return
  fi
  log "  Top10 unsatisfied files (sorted by lines%):"
  jq -r --arg root "$ROOT_DIR/" '
    to_entries
    | map({
        path: .key,
        lines: (
          (.value.s // {})
          | (to_entries | length) as $total
          | (to_entries | map(select(.value > 0)) | length) as $hit
          | if $total == 0 then 100 else ($hit / $total * 100) end
        )
      })
    | sort_by(.lines)
    | .[:10]
    | .[]
    | "    \(.path | sub($root; ""))  lines=\(.lines | . * 10 | round / 10)%  suggested test: \(.path | sub($root; "") | sub("\\.tsx$"; ".test.tsx") | sub("\\.ts$"; ".test.ts"))"
  ' "$final_json" >&2 || true
}

TARGETS=()
while IFS= read -r line; do
  [ -n "$line" ] || continue
  TARGETS+=("$line")
done < <(resolve_targets)

if [ "${#TARGETS[@]}" -eq 0 ]; then
  log "no target packages (changed mode で変更なし、または filter に該当なし)"
  exit 0
fi

# Main: Vitest is used for measurement; this guard owns the threshold decision.
if [ "$RUN_TESTS" = "1" ]; then
  if ! run_tests; then
    log "ENV ERROR: test:coverage command failed before coverage aggregation completed"
    exit 2
  fi
fi

FAIL=0
MISSING=0
for pkg in "${TARGETS[@]}"; do
  rel="${pkg#$ROOT_DIR/}"
  summary="${pkg}/coverage/coverage-summary.json"
  if [ ! -f "$summary" ]; then
    log "MISSING: ${rel}/coverage/coverage-summary.json (テスト未実行 or coverage 未生成)"
    MISSING=1
    continue
  fi
  # 4 metric を抽出
  metrics_json=$(jq -c '.total | {lines: .lines.pct, branches: .branches.pct, functions: .functions.pct, statements: .statements.pct}' "$summary")
  pkg_fail=0
  for m in lines branches functions statements; do
    pct=$(printf '%s' "$metrics_json" | jq -r ".${m}")
    # awk で float 比較
    cmp=$(awk -v a="$pct" -v t="$THRESHOLD" 'BEGIN{print (a+0 < t+0) ? 1 : 0}')
    if [ "$cmp" = "1" ]; then
      log "FAIL: ${rel} ${m}=${pct}% (< ${THRESHOLD}%)"
      pkg_fail=1
      FAIL=1
    fi
  done
  if [ "$pkg_fail" = "1" ]; then
    format_top10 "$pkg"
  else
    log "PASS: ${rel} ($(printf '%s' "$metrics_json"))"
  fi
done

if [ "$MISSING" = "1" ] || [ "$FAIL" = "1" ]; then
  log "HINT: 上記の suggested test を作成し、\`pnpm test:coverage\` を再実行してください。"
  log "HINT: テスト不能領域は vitest.config.ts coverage.exclude に追加してください (要レビュー)。"
  exit 1
fi

log "PASS: all packages ≥ ${THRESHOLD}%"
exit 0
