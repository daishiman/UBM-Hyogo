#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage: create-github-release.sh --tag vYYYYMMDD-HHMM --target <sha> --changelog-path <path> --evidence-url <url> (--dry-run|--apply --draft --reviewed-notes-file <path>)
USAGE
}

die() {
  echo "create-github-release: $*" >&2
  exit 64
}

TAG=""
TARGET=""
CHANGELOG_PATH=""
EVIDENCE_URL=""
ROLLBACK_URL="N/A"
FOLLOWUP_URL="N/A"
MODE=""
DRAFT=0
REVIEWED_NOTES_FILE=""
GH_BIN="${GH_RELEASE_BIN:-gh}"
GENERATOR="${RELEASE_NOTES_GENERATOR:-scripts/release/generate-release-notes.sh}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag) TAG="${2:-}"; shift 2 ;;
    --target|--commit) TARGET="${2:-}"; shift 2 ;;
    --changelog-path) CHANGELOG_PATH="${2:-}"; shift 2 ;;
    --evidence-url) EVIDENCE_URL="${2:-}"; shift 2 ;;
    --rollback-url) ROLLBACK_URL="${2:-}"; shift 2 ;;
    --followup-url) FOLLOWUP_URL="${2:-}"; shift 2 ;;
    --dry-run)
      [ -z "$MODE" ] || die "exactly one of --dry-run or --apply is required"
      MODE="dry-run"
      shift
      ;;
    --apply)
      [ -z "$MODE" ] || die "exactly one of --dry-run or --apply is required"
      MODE="apply"
      shift
      ;;
    --draft) DRAFT=1; shift ;;
    --reviewed-notes-file) REVIEWED_NOTES_FILE="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$TAG" ] || die "--tag is required"
[ -n "$TARGET" ] || die "--target is required"
[ -n "$CHANGELOG_PATH" ] || die "--changelog-path is required"
[ -n "$EVIDENCE_URL" ] || die "--evidence-url is required"
[ -n "$MODE" ] || die "exactly one of --dry-run or --apply is required"

case "$TAG" in
  v[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]) ;;
  *) die "tag must match vYYYYMMDD-HHMM" ;;
esac

case "$TARGET" in
  *[!0-9a-fA-F]*|"") die "--target must be a git sha" ;;
esac

if [ "$MODE" = "dry-run" ]; then
  exec bash "$GENERATOR" \
    --tag "$TAG" \
    --commit "$TARGET" \
    --changelog-path "$CHANGELOG_PATH" \
    --evidence-url "$EVIDENCE_URL" \
    --rollback-url "$ROLLBACK_URL" \
    --followup-url "$FOLLOWUP_URL"
fi

if [ "$DRAFT" -ne 1 ]; then
  die "--apply requires --draft"
fi

[ -n "$REVIEWED_NOTES_FILE" ] || die "--apply requires --reviewed-notes-file from a prior dry-run"
[ -s "$REVIEWED_NOTES_FILE" ] || die "--reviewed-notes-file must exist and be non-empty"
if grep -q '{{\\|}}' "$REVIEWED_NOTES_FILE"; then
  die "--reviewed-notes-file still contains template placeholders"
fi

if ! git cat-file -e "$TARGET^{commit}" 2>/dev/null; then
  die "--target must resolve to a local git commit"
fi

tag_commit="$(git rev-parse -q --verify "refs/tags/$TAG^{commit}")" \
  || die "tag must exist locally before --apply: $TAG"
target_commit="$(git rev-parse "$TARGET^{commit}")"
if [ "$tag_commit" != "$target_commit" ]; then
  die "tag $TAG does not point at --target"
fi

if "$GH_BIN" release view "$TAG" >/dev/null 2>&1; then
  die "release already exists for tag: $TAG"
fi

args=(release create "$TAG" --target "$TARGET" --title "$TAG" --notes-file "$REVIEWED_NOTES_FILE")
args+=(--draft)

exec "$GH_BIN" "${args[@]}"
