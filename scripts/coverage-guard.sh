#!/usr/bin/env bash
# coverage-guard.sh — 全 package で coverage 80% 一律強制 (lines/branches/functions/statements)
# 仕様正本: docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md
#
# Usage:
#   bash scripts/coverage-guard.sh              # 判定対象 package を test:coverage 実行 → 集計 → 判定
#   bash scripts/coverage-guard.sh --changed    # 変更された package のみ実行 (lefthook pre-push 用)
#   bash scripts/coverage-guard.sh --package <name>           # 単一 package 限定
#   bash scripts/coverage-guard.sh --threshold 80             # 閾値上書き (default=80)
#   bash scripts/coverage-guard.sh --no-run     # 既存の coverage-summary.json を集計のみ (テスト/CI 高速化用)
#   bash scripts/coverage-guard.sh --group <web|api-unit|api-d1|packages>  # CI shard 用に group 単独実行
#                                                                          # (issue-617: docs/30-workflows/issue-617-ci-test-time-reduction-split/)
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
GROUP=""
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
    --group)
      [ $# -ge 2 ] || { log "ERROR: --group requires a value"; exit 2; }
      GROUP="$2"; shift 2
      case "$GROUP" in
        web|api-unit|api-d1|packages) ;;
        *) log "ERROR: --group must be one of: web | api-unit | api-d1 | packages"; exit 2 ;;
      esac
      ;;
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

# sync-merge スキップ判定（個人開発運用ポリシー）:
#   --changed モード（pre-push 用）で coverage 評価範囲に merge commit を含む場合、
#   sync-merge による偶発的な coverage 低下を許容してスキップする。
#   範囲は changed_packages と同じ base (merge-base HEAD origin/dev) からの ...HEAD を用いる。
#   これにより sync-merge 後の follow-up コミット (indexes rebuild 等) を push する場面でも、
#   評価範囲に merge commit が残っていればスキップが効く。
#   feature 単体 push は従来通りチェック対象。
if [ "$CHANGED" -eq 1 ] && git rev-parse --verify HEAD >/dev/null 2>&1; then
  if base=$(git -C "$ROOT_DIR" merge-base HEAD origin/dev 2>/dev/null) && [ -n "$base" ]; then
    range="${base}..HEAD"
  elif git rev-parse --verify origin/dev >/dev/null 2>&1; then
    range="origin/dev..HEAD"
  elif git rev-parse --verify origin/main >/dev/null 2>&1; then
    range="origin/main..HEAD"
  else
    range="HEAD~1..HEAD"
  fi
  merge_count=$(git log --merges --format=%H "$range" 2>/dev/null | wc -l | tr -d ' ')
  if [ "${merge_count:-0}" -ge 1 ]; then
    log "SKIP: push 範囲 ($range) に merge commit が ${merge_count} 件含まれます。sync-merge のため coverage-guard をスキップします。"
    exit 0
  fi
fi

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
    | "    \(.path | sub($root; ""))  lines=\(.lines | . * 10 | round / 10)%  suggested test: \(.path | sub($root; "") | sub("\\.tsx$"; ".spec.tsx") | sub("\\.ts$"; ".spec.ts"))"
  ' "$final_json" >&2 || true
}

# issue-617: group-mode shard 実行
# 各 group は対応 package のみ実行し、summary は group 別 reportsDirectory を見る。
# 集約モード (--no-run) では apps/api の unit+d1 を merge して通常パスに乗せる。
run_group() {
  local g="$1"
  case "$g" in
    web)
      log "running: pnpm --filter @ubm-hyogo/web test:coverage:web"
      ( cd "$ROOT_DIR" && pnpm --filter @ubm-hyogo/web test:coverage:web ) || return 1
      ;;
    api-unit)
      log "running: pnpm --filter @ubm-hyogo/api test:coverage:unit"
      ( cd "$ROOT_DIR" && pnpm --filter @ubm-hyogo/api test:coverage:unit ) || return 1
      ;;
    api-d1)
      log "running: pnpm --filter @ubm-hyogo/api test:coverage:d1"
      ( cd "$ROOT_DIR" && pnpm --filter @ubm-hyogo/api test:coverage:d1 ) || return 1
      ;;
    packages)
      local failed=0
      for d in "$ROOT_DIR"/packages/*/ "$ROOT_DIR"/packages/integrations/*/; do
        [ -d "$d" ] || continue
        [ -f "${d}package.json" ] || continue
        local name; name=$(jq -r '.name // empty' "${d}package.json")
        [ -n "$name" ] || continue
        log "running: pnpm --filter ${name} test:coverage"
        ( cd "$ROOT_DIR" && pnpm --filter "$name" test:coverage ) || failed=1
      done
      [ "$failed" -eq 0 ] || return 1
      ;;
  esac
}

# group 別 coverage-summary.json パスを返す
group_summary_paths() {
  case "$1" in
    web) printf '%s\n' "$ROOT_DIR/apps/web/coverage/coverage-summary.json" ;;
    api-unit) printf '%s\n' "$ROOT_DIR/apps/api/coverage/unit/coverage-summary.json" ;;
    api-d1) printf '%s\n' "$ROOT_DIR/apps/api/coverage/d1/coverage-summary.json" ;;
    packages)
      for d in "$ROOT_DIR"/packages/*/ "$ROOT_DIR"/packages/integrations/*/; do
        [ -d "$d" ] || continue
        [ -f "${d}package.json" ] || continue
        printf '%s\n' "${d%/}/coverage/coverage-summary.json"
      done
      ;;
  esac
}

# group モード: 対応 group を実行 (or skip) して、その group の summary 生成だけを確認する。
# 分割 shard は apps/api の unit / d1 のように部分 coverage になり得るため、
# 80% threshold 判定は aggregate coverage-gate (--no-run) だけで行う。
if [ -n "$GROUP" ]; then
  if [ "$RUN_TESTS" = "1" ]; then
    if ! run_group "$GROUP"; then
      log "ENV ERROR: --group $GROUP test:coverage failed"
      exit 2
    fi
  fi
  GROUP_MISSING=0
  while IFS= read -r summary; do
    [ -n "$summary" ] || continue
    rel="${summary#$ROOT_DIR/}"
    if [ ! -f "$summary" ]; then
      log "MISSING: ${rel} (group=$GROUP — テスト未実行 or coverage 未生成)"
      GROUP_MISSING=1
      continue
    fi
    metrics_json=$(jq -c '.total | {lines: .lines.pct, branches: .branches.pct, functions: .functions.pct, statements: .statements.pct}' "$summary")
    log "PASS: ${rel} generated for group=$GROUP ($(printf '%s' "$metrics_json"))"
  done < <(group_summary_paths "$GROUP")
  if [ "$GROUP_MISSING" = "1" ]; then
    exit 1
  fi
  log "PASS: group=$GROUP coverage artifact generated; aggregate threshold is enforced by --no-run"
  exit 0
fi

# 集約モード fallback: apps/api/coverage/coverage-summary.json が無くて unit+d1 が両方ある場合に merge を試行
if [ "$RUN_TESTS" = "0" ]; then
  api_unit_final="$ROOT_DIR/apps/api/coverage/unit/coverage-final.json"
  api_d1_final="$ROOT_DIR/apps/api/coverage/d1/coverage-final.json"
  api_merged_summary="$ROOT_DIR/apps/api/coverage/coverage-summary.json"
  if [ ! -f "$api_merged_summary" ] && [ -f "$api_unit_final" ] && [ -f "$api_d1_final" ]; then
    log "aggregate fallback: merging apps/api unit + d1 coverage"
    if ! ( cd "$ROOT_DIR" && node scripts/coverage-merge.mjs \
        --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
        --output="apps/api/coverage" ); then
      log "ENV ERROR: coverage-merge.mjs failed"
      exit 2
    fi
  fi
fi

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
# Full mode intentionally runs the same TARGETS that are later aggregated, so the
# executed packages and the judged packages cannot drift.
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
