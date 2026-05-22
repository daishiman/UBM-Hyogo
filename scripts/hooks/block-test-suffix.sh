#!/usr/bin/env bash
# pre-commit: 新規 *.test.ts(x) ファイルの混入を block する
# ADR: docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md
# テストファイル suffix は *.spec.{ts,tsx} に統一する。*.test.{ts,tsx} は禁止。
set -euo pipefail

# Added / Copied / Modified / Renamed (to) を対象に staged path を取得
OFFENDERS=$(git diff --cached --name-only --diff-filter=ACMR \
  | grep -E '\.test\.(ts|tsx)$' \
  | grep -v -E '(^|/)node_modules/' \
  | grep -v -E '(^|/)\.next/' \
  | grep -v -E '(^|/)\.open-next/' \
  || true)

if [ -n "$OFFENDERS" ]; then
  echo ""
  echo "🚫 [pre-commit] *.test.{ts,tsx} ファイルは追加禁止です（ADR: *.spec.{ts,tsx} に統一）"
  echo ""
  echo "  対象 staged ファイル:"
  while IFS= read -r f; do
    echo "    - $f"
  done <<< "$OFFENDERS"
  echo ""
  echo "  対処: 末尾を .spec.ts(x) に rename してから再 stage してください。"
  echo "    git mv path/to/foo.test.ts path/to/foo.spec.ts"
  echo ""
  exit 1
fi

exit 0
