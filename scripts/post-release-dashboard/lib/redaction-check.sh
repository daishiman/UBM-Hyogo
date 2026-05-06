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

if rg -i "(token|bearer|secret|CLOUDFLARE_API_TOKEN|Authorization)" "$TARGET_DIR"; then
  echo "redaction check failed: sensitive marker found in $TARGET_DIR" >&2
  exit 1
fi

echo "redaction check passed: $TARGET_DIR"
