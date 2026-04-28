#!/usr/bin/env bash
# orphan-references.sh — V3: 未参照 references の検出
#
# 各 .claude/skills/<skill>/references/*.md ファイルが、対応する SKILL.md から
# 1 回以上参照されているかを確認する。1 件も参照されていないファイルは orphan として FAIL。
#
# 使い方:
#   bash outputs/phase-04/scripts/orphan-references.sh
#   bash outputs/phase-04/scripts/orphan-references.sh | tee outputs/phase-04/evidence/orphan-references.log
#
# 終了コード:
#   0 = orphan 0 件
#   1 = orphan を 1 件以上検出

set -euo pipefail

if REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../../.." && pwd)"
fi
cd "$REPO_ROOT"

if ! command -v rg >/dev/null 2>&1; then
  echo "ERROR: ripgrep (rg) が必要です" >&2
  exit 2
fi

fail_count=0
shopt -s nullglob

for skill_dir in .claude/skills/*/; do
  name=$(basename "$skill_dir")
  refdir="${skill_dir}references"
  skill_md="${skill_dir}SKILL.md"

  [[ -d $refdir ]] || continue
  if [[ ! -f $skill_md ]]; then
    echo "WARN: $name has references/ but no SKILL.md"
    continue
  fi

  # references/ 配下の .md を再帰的に列挙
  while IFS= read -r ref; do
    # skill_dir からの相対パス (例: references/topic.md または references/sub/topic.md)
    rel="${ref#$skill_dir}"
    if rg -F -q "$rel" "$skill_md"; then
      echo "OK:   $name <- $rel"
    else
      echo "FAIL: $name <- $rel (orphan: not referenced from SKILL.md)"
      fail_count=$((fail_count + 1))
    fi
  done < <(find "$refdir" -type f -name '*.md' | sort)
done

echo "---"
printf "SUMMARY: orphan=%d\n" "$fail_count"

if [[ $fail_count -gt 0 ]]; then
  exit 1
fi
exit 0
