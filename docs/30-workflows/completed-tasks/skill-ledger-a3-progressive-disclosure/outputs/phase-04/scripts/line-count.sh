#!/usr/bin/env bash
# line-count.sh — V1: 全 .claude/skills/*/SKILL.md の行数を検査し、200 未満なら OK
#
# 使い方:
#   bash outputs/phase-04/scripts/line-count.sh
#   bash outputs/phase-04/scripts/line-count.sh | tee outputs/phase-04/evidence/line-count.log
#
# 終了コード:
#   0 = 全 SKILL.md が 200 行未満
#   1 = 1 件以上が 200 行以上 (FAIL)
#   2 = SKILL.md が 1 件も見つからない

set -euo pipefail

# リポジトリルートに移動 (git rev-parse 優先、無ければ既知の階層から逆算)
if REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  # docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/ から 6 階層上
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../../.." && pwd)"
fi
cd "$REPO_ROOT"

THRESHOLD=200
fail_count=0
total_count=0

shopt -s nullglob
skill_files=( .claude/skills/*/SKILL.md )

if [[ ${#skill_files[@]} -eq 0 ]]; then
  echo "ERROR: .claude/skills/*/SKILL.md が見つかりません (cwd=$PWD)" >&2
  exit 2
fi

for f in "${skill_files[@]}"; do
  lines=$(wc -l < "$f" | tr -d ' ')
  total_count=$((total_count + 1))
  if [[ $lines -ge $THRESHOLD ]]; then
    printf "FAIL: %s = %s lines (>= %s)\n" "$f" "$lines" "$THRESHOLD"
    fail_count=$((fail_count + 1))
  else
    printf "OK:   %s = %s lines\n" "$f" "$lines"
  fi
done

echo "---"
printf "SUMMARY: total=%d fail=%d threshold=%d\n" "$total_count" "$fail_count" "$THRESHOLD"

if [[ $fail_count -gt 0 ]]; then
  exit 1
fi
exit 0
