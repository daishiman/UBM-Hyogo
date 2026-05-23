#!/usr/bin/env bash
# verify-pr-ready.sh — PR push 前に CI gate を local で先回り検証する pre-flight。
#
# 目的: `verify-phase12-compliance` / `gate-metadata:validate` 等の docs-only gate は
# `pnpm typecheck` / `pnpm lint` ではカバーされない。これらは過去複数回 PR push 後に
# CI で初めて落ちる失敗を繰り返してきたため、ここで一括 fail-fast させる。
#
# 含めない: typecheck / lint / install / test (PR flow 側で先行実行する想定)。
# 終了コード: 1 つでも fail があれば非 0。

set -uo pipefail

# 色とアイコンは出さない（CLAUDE.md ポリシー）
FAIL_COUNT=0
RUN_LOG=()

run_gate() {
  local label="$1"
  shift
  echo "==> ${label}"
  if "$@"; then
    RUN_LOG+=("PASS ${label}")
  else
    RUN_LOG+=("FAIL ${label}")
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo
}

# Phase 12 compliance: canonical 9 headings + Phase 11 evidence table + workflow root scan
run_gate "verify:phase12-compliance" mise exec -- pnpm verify:phase12-compliance

# gate-metadata: artifacts.json schema (status enum / passed_at ISO datetime / evidence_path existence)
run_gate "gate-metadata:validate" mise exec -- pnpm gate-metadata:validate

# indexes drift (post-merge から廃止された経路の代替)
if mise exec -- pnpm run --silent indexes:rebuild >/dev/null 2>&1; then
  if ! git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes; then
    echo "==> indexes:rebuild produced drift in .claude/skills/aiworkflow-requirements/indexes — commit the regenerated files"
    git --no-pager diff --stat -- .claude/skills/aiworkflow-requirements/indexes
    RUN_LOG+=("FAIL indexes:rebuild drift")
    FAIL_COUNT=$((FAIL_COUNT + 1))
  else
    RUN_LOG+=("PASS indexes:rebuild (no drift)")
  fi
else
  RUN_LOG+=("SKIP indexes:rebuild (script not available)")
fi

echo "===== verify-pr-ready summary ====="
for line in "${RUN_LOG[@]}"; do
  echo "${line}"
done
echo "===== ${FAIL_COUNT} gate(s) failed ====="

exit "${FAIL_COUNT}"
