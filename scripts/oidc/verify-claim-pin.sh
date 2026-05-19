#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPOSITORY="daishiman/UBM-Hyogo"
EXPECTED_EVENT_NAME="push"

usage() {
  cat >&2 <<'USAGE'
usage: scripts/oidc/verify-claim-pin.sh --repository <owner/repo> --ref <ref> --environment <environment> --event-name <event_name>
USAGE
}

repository=""
ref_name=""
environment_name=""
event_name=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repository)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      repository="$2"
      shift 2
      ;;
    --ref)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      ref_name="$2"
      shift 2
      ;;
    --environment)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      environment_name="$2"
      shift 2
      ;;
    --event-name)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      event_name="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ -z "$repository" ] || [ -z "$ref_name" ] || [ -z "$environment_name" ] || [ -z "$event_name" ]; then
  usage
  exit 2
fi

mismatches=0

check_equal() {
  local field="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" != "$actual" ]; then
    echo "MISMATCH ${field}: expected=${expected}, got=${actual}" >&2
    mismatches=$((mismatches + 1))
  fi
}

check_equal "repository" "$EXPECTED_REPOSITORY" "$repository"
check_equal "event_name" "$EXPECTED_EVENT_NAME" "$event_name"

case "$ref_name" in
  refs/heads/main|refs/heads/dev)
    ;;
  *)
    echo "MISMATCH ref: expected=refs/heads/main or refs/heads/dev, got=${ref_name}" >&2
    mismatches=$((mismatches + 1))
    ;;
esac

case "$environment_name" in
  production|staging)
    ;;
  *)
    echo "MISMATCH environment: expected=production or staging, got=${environment_name}" >&2
    mismatches=$((mismatches + 1))
    ;;
esac

case "${ref_name}:${environment_name}" in
  refs/heads/main:production|refs/heads/dev:staging)
    ;;
  *)
    echo "MISMATCH ref/environment pair: expected=refs/heads/main:production or refs/heads/dev:staging, got=${ref_name}:${environment_name}" >&2
    mismatches=$((mismatches + 1))
    ;;
esac

if [ "$mismatches" -gt 0 ]; then
  exit 1
fi

echo "PASS: subject claim pin verified (repository=${repository}, ref=${ref_name}, environment=${environment_name}, event_name=${event_name})"
