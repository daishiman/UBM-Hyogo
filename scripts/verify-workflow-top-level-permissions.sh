#!/usr/bin/env bash
set -euo pipefail

missing=()
for workflow in .github/workflows/*.yml; do
  if ! awk '/^jobs:/{exit} /^permissions:/{found=1; exit} END{exit found ? 0 : 1}' "$workflow"; then
    missing+=("$workflow")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Missing top-level permissions:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "All workflows declare top-level permissions"
