#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/capture-profile-evidence.sh --base-url URL --storage-state FILE [--out-dir DIR] [--project NAME] [--markers LIST]

Required:
  --base-url        Local or staging origin to test, for example http://localhost:3000
  --storage-state   Playwright storageState JSON for a logged-in member session

Optional:
  --out-dir         Evidence output directory
  --project         Playwright project name (default: staging)
  --markers         Marker list for contract compatibility. Automated capture runs M-08,M-09,M-10,M-16.
USAGE
}

BASE_URL=""
STORAGE_STATE=""
OUT_DIR="docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11"
PROJECT="staging"
MARKERS="M-08,M-09,M-10,M-16"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --storage-state)
      STORAGE_STATE="${2:-}"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="${2:-}"
      shift 2
      ;;
    --project)
      PROJECT="${2:-}"
      shift 2
      ;;
    --markers)
      MARKERS="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$BASE_URL" || -z "$STORAGE_STATE" ]]; then
  usage >&2
  exit 2
fi

if [[ ! -f "$STORAGE_STATE" ]]; then
  echo "storageState file not found: $STORAGE_STATE" >&2
  exit 4
fi

if [[ "$BASE_URL" != http://localhost:* && "$BASE_URL" != http://127.0.0.1:* && "$BASE_URL" != https://staging.* && "$BASE_URL" != *".pages.dev"* ]]; then
  echo "Refusing non-local/non-staging base URL: $BASE_URL" >&2
  echo "Production evidence requires a separate user approval gate." >&2
  exit 3
fi

if [[ "$MARKERS" == *"M-14"* || "$MARKERS" == *"M-15"* ]]; then
  echo "M-14/M-15 require manual headed OAuth/Magic Link capture; automated run covers M-08/M-09/M-10/M-16." >&2
fi

mkdir -p "$OUT_DIR/screenshots" "$OUT_DIR/dom"

PLAYWRIGHT_BASE_URL="$BASE_URL" \
PLAYWRIGHT_STAGING_BASE_URL="$BASE_URL" \
PROFILE_EVIDENCE_STORAGE_STATE="$STORAGE_STATE" \
PROFILE_EVIDENCE_OUT_DIR="$OUT_DIR" \
pnpm --filter @ubm-hyogo/web exec playwright test \
  --project="$PROJECT" \
  playwright/tests/profile-readonly.spec.ts \
  --reporter=line
