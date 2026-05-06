#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <outputs/post-release-dashboard/yyyy-mm-dd>" >&2
  exit 64
fi

TARGET_DIR="$1"
if [ ! -d "$TARGET_DIR" ]; then
  echo "target directory not found: $TARGET_DIR" >&2
  exit 66
fi

REPORT="$TARGET_DIR/redaction-check.md"
PATTERN="(token|bearer|secret|CLOUDFLARE_API_TOKEN|Authorization)"

if findings="$(grep -ril -E "$PATTERN" "$TARGET_DIR" --exclude='redaction-check.md')" && [ -n "$findings" ]; then
  {
    echo "# Redaction Check"
    echo
    echo "status: FAIL"
    echo "checked_path: \`$TARGET_DIR\`"
    echo "finding_files: $(printf '%s\n' "$findings" | wc -l | tr -d ' ')"
    echo
    echo "Sensitive marker-like strings were found. File names and matching lines are intentionally omitted from this artifact."
  } > "$REPORT"
  echo "redaction check failed: sensitive marker found in $TARGET_DIR" >&2
  exit 1
fi

{
  echo "# Redaction Check"
  echo
  echo "status: PASS"
  echo "checked_path: \`$TARGET_DIR\`"
  echo "finding_files: 0"
} > "$REPORT"

echo "redaction check passed: $TARGET_DIR"
