#!/usr/bin/env bash
# task-09 phase-4: HEX 直書き 0 件検証（task-18 への先行実装）
# tokens.css 内の HEX（fallback ブロック内の sRGB 近似値）は許可
set -euo pipefail

ROOT="${1:-apps/web/src}"

# 6 or 8 桁の HEX color literal、または bg-[#...] / text-[#...] / border-[#...] arbitrary value
matches=$(grep -REn "(#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?\b|(bg|text|border|fill|stroke|ring|outline)-\[#[0-9a-fA-F]{3,8}\])" "$ROOT" \
  --include='*.ts' --include='*.tsx' --include='*.css' \
  --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)

filtered=$(echo "$matches" | awk -F: '
  /^$/ { next }
  $1 ~ /tokens\.css$/ { next }
  { print }
')

if [ -n "$filtered" ]; then
  echo "HEX 直書き検出（fallback 外）:"
  echo "$filtered"
  exit 1
fi
echo "HEX 直書き 0 件（OK）"
