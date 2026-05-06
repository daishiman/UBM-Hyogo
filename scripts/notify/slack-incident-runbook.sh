#!/usr/bin/env bash
# Usage:
#   bash scripts/notify/slack-incident-runbook.sh \
#     --mode=dryrun \
#     --release-version=v0.0.0-test \
#     --deployed-at="$(date -u +%FT%TZ)" \
#     --runbook-path=docs/30-workflows/.../incident-runbook.md \
#     --oncall-handle=@manju
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec mise exec -- bash "${REPO_ROOT}/scripts/with-env.sh" tsx "${REPO_ROOT}/scripts/notify/slack-incident-runbook.ts" "$@"
