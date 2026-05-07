#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/format-dashboard.test.sh"
bash "$SCRIPT_DIR/judgment.test.sh"
bash "$SCRIPT_DIR/redaction-check.test.sh"
bash "$SCRIPT_DIR/30day-summary.test.sh"

echo "post-release-dashboard tests passed"
