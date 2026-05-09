#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

# shellcheck disable=SC1091
. "$REPO_ROOT/scripts/lib/redaction.sh"

redact_stream
