#!/usr/bin/env bash
# mirror-diff.sh — V4: canonical (.claude/skills/<skill>) と mirror (.agents/skills/<skill>) の差分検査
#
# 全 skill について `diff -r` を実行し、差分が空であることを確認する。
# mirror が存在しない skill も FAIL として扱う。
#
# 使い方:
#   bash outputs/phase-04/scripts/mirror-diff.sh
#   bash outputs/phase-04/scripts/mirror-diff.sh | tee outputs/phase-04/evidence/mirror-diff.log
#
# 終了コード:
#   0 = 全 skill で canonical == mirror
#   1 = 1 件以上で差分または mirror 不在

set -euo pipefail

if REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../../.." && pwd)"
fi
cd "$REPO_ROOT"

fail_count=0
total_count=0
shopt -s nullglob

for skill_dir in .claude/skills/*/; do
  name=$(basename "$skill_dir")
  total_count=$((total_count + 1))
  canonical="$skill_dir"
  mirror=".agents/skills/$name/"

  if [[ ! -d $mirror ]]; then
    echo "FAIL: $name mirror missing ($mirror)"
    fail_count=$((fail_count + 1))
    continue
  fi

  # diff -r は差分があると非 0 終了するので set -e 下では `|| true` で受ける
  diff_out=$(diff -r "$canonical" "$mirror" 2>&1 || true)
  if [[ -z $diff_out ]]; then
    echo "OK:   $name canonical == mirror"
  else
    echo "FAIL: $name diff:"
    echo "$diff_out" | sed 's/^/      /'
    fail_count=$((fail_count + 1))
  fi
done

# mirror 側に canonical が存在しない skill (取り残し) がないかも確認
for mirror_dir in .agents/skills/*/; do
  mname=$(basename "$mirror_dir")
  if [[ ! -d ".claude/skills/$mname" ]]; then
    echo "FAIL: $mname canonical missing (mirror-only: $mirror_dir)"
    fail_count=$((fail_count + 1))
  fi
done

echo "---"
printf "SUMMARY: total=%d fail=%d\n" "$total_count" "$fail_count"

if [[ $fail_count -gt 0 ]]; then
  exit 1
fi
exit 0
