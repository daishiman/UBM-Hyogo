#!/usr/bin/env bash
# link-integrity.sh — V2: SKILL.md → references/<topic>.md のリンク健全性検査
#
# 全 .claude/skills/<skill>/SKILL.md から `references/...md` 形式のリンクを抽出し、
# 各 path が実在するか確認する。さらに references → SKILL.md への戻り参照を検出する
# (片方向参照の確認 / AC-4)。
#
# 使い方:
#   bash outputs/phase-04/scripts/link-integrity.sh
#   bash outputs/phase-04/scripts/link-integrity.sh | tee outputs/phase-04/evidence/link-integrity.log
#
# 終了コード:
#   0 = リンク切れ 0 件 / 戻り参照 0 件
#   1 = リンク切れ または 戻り参照 を検出

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

# --- forward link 検査: SKILL.md → references/<topic>.md ---
for skill_dir in .claude/skills/*/; do
  name=$(basename "$skill_dir")
  skill_md="${skill_dir}SKILL.md"
  [[ -f $skill_md ]] || continue

  # references/<topic>.md および references/<sub>/<topic>.md に対応
  links=$(rg -No 'references/[A-Za-z0-9_./\-]+\.md' "$skill_md" 2>/dev/null | sort -u || true)

  if [[ -z $links ]]; then
    echo "INFO: $name -> (no references links)"
    continue
  fi

  while IFS= read -r link; do
    [[ -z $link ]] && continue
    target="${skill_dir}${link}"
    if [[ -f $target ]]; then
      echo "OK:   $name -> $link"
    else
      echo "FAIL: $name -> $link (missing: $target)"
      fail_count=$((fail_count + 1))
    fi
  done <<< "$links"
done

# --- 戻り参照検査: references/*.md → SKILL.md (AC-4 片方向参照) ---
echo "---"
echo "Reverse-link check (references/*.md must NOT reference SKILL.md):"
reverse_hits=$(rg -n 'SKILL\.md' .claude/skills/*/references/ 2>/dev/null || true)
if [[ -n $reverse_hits ]]; then
  echo "FAIL: references から SKILL.md への戻り参照を検出"
  echo "$reverse_hits"
  fail_count=$((fail_count + 1))
else
  echo "OK:   references → SKILL.md 戻り参照 0 件"
fi

echo "---"
printf "SUMMARY: fail=%d\n" "$fail_count"

if [[ $fail_count -gt 0 ]]; then
  exit 1
fi
exit 0
