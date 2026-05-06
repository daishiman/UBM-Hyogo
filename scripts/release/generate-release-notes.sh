#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage: generate-release-notes.sh --tag vYYYYMMDD-HHMM --commit <sha> --changelog-path <path> --evidence-url <url> [--rollback-url <url>] [--followup-url <url>] [--generated-at <iso8601>] [--template <path>]
USAGE
}

die() {
  echo "generate-release-notes: $*" >&2
  exit 64
}

TAG=""
COMMIT=""
CHANGELOG_PATH=""
EVIDENCE_URL=""
ROLLBACK_URL="N/A"
FOLLOWUP_URL="N/A"
GENERATED_AT=""
TEMPLATE_PATH="${RELEASE_NOTES_TEMPLATE:-scripts/release/release-notes.template.md}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag) TAG="${2:-}"; shift 2 ;;
    --commit) COMMIT="${2:-}"; shift 2 ;;
    --changelog-path) CHANGELOG_PATH="${2:-}"; shift 2 ;;
    --evidence-url) EVIDENCE_URL="${2:-}"; shift 2 ;;
    --rollback-url) ROLLBACK_URL="${2:-}"; shift 2 ;;
    --followup-url) FOLLOWUP_URL="${2:-}"; shift 2 ;;
    --generated-at) GENERATED_AT="${2:-}"; shift 2 ;;
    --template) TEMPLATE_PATH="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$TAG" ] || die "--tag is required"
[ -n "$COMMIT" ] || die "--commit is required"
[ -n "$CHANGELOG_PATH" ] || die "--changelog-path is required"
[ -n "$EVIDENCE_URL" ] || die "--evidence-url is required"

case "$TAG" in
  v[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]) ;;
  *) die "tag must match vYYYYMMDD-HHMM" ;;
esac

case "$COMMIT" in
  *[!0-9a-fA-F]*|"") die "--commit must be a git sha" ;;
esac

[ -f "$TEMPLATE_PATH" ] || die "template not found: $TEMPLATE_PATH"

if [ -f "$CHANGELOG_PATH" ]; then
  CHANGELOG="$(sed -n '1,160p' "$CHANGELOG_PATH")"
else
  CHANGELOG="Changelog file not found: \`$CHANGELOG_PATH\`"
fi

if [ -z "$GENERATED_AT" ]; then
  GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi

NOTE="$(cat "$TEMPLATE_PATH")"
NOTE="${NOTE//'{{TAG}}'/$TAG}"
NOTE="${NOTE//'{{COMMIT}}'/$COMMIT}"
NOTE="${NOTE//'{{CHANGELOG}}'/$CHANGELOG}"
NOTE="${NOTE//'{{EVIDENCE_URL}}'/$EVIDENCE_URL}"
NOTE="${NOTE//'{{ROLLBACK_URL}}'/$ROLLBACK_URL}"
NOTE="${NOTE//'{{FOLLOWUP_URL}}'/$FOLLOWUP_URL}"
NOTE="${NOTE//'{{GENERATED_AT}}'/$GENERATED_AT}"

printf '%s\n' "$NOTE"
