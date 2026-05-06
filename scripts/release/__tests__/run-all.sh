#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat > "$tmp/changelog.md" <<'MD'
# Changelog

- Deployed release candidate.
MD

note="$(
  bash scripts/release/generate-release-notes.sh \
    --tag v20260506-1530 \
    --commit abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --rollback-url "https://example.test/rollback" \
    --followup-url "https://example.test/followup" \
    --generated-at "2026-05-06T15:30:00Z"
)"

case "$note" in
  *"Release v20260506-1530"*"- Deployed release candidate."*"abcdef1234"*) ;;
  *) echo "generated note missing expected content" >&2; exit 1 ;;
esac

if bash scripts/release/generate-release-notes.sh \
  --tag bad-tag \
  --commit abcdef1234 \
  --changelog-path "$tmp/changelog.md" \
  --evidence-url "https://example.test/evidence" >/dev/null 2>&1; then
  echo "bad tag should fail" >&2
  exit 1
fi

cat > "$tmp/gh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [ "$1 $2 $3" = "release view v20260506-1530" ]; then
  exit 1
fi
if [ "$1 $2 $3" = "release create v20260506-1530" ]; then
  printf '%s\n' "$*" > "$GH_CAPTURE"
  exit 0
fi
echo "unexpected gh invocation: $*" >&2
exit 2
SH
chmod +x "$tmp/gh"

git -C "$tmp" init -q
git -C "$tmp" config user.email test@example.test
git -C "$tmp" config user.name "Release Test"
printf 'fixture\n' > "$tmp/file.txt"
git -C "$tmp" add file.txt
git -C "$tmp" commit -q -m "fixture"
target="$(git -C "$tmp" rev-parse HEAD)"
git -C "$tmp" tag v20260506-1530 "$target"

export GH_RELEASE_BIN="$tmp/gh"
export GH_CAPTURE="$tmp/gh.args"
export RELEASE_NOTES_GENERATOR="$ROOT_DIR/scripts/release/generate-release-notes.sh"
export RELEASE_NOTES_TEMPLATE="$ROOT_DIR/scripts/release/release-notes.template.md"
(
cd "$tmp"
bash "$ROOT_DIR/scripts/release/create-github-release.sh" \
  --tag v20260506-1530 \
  --target "$target" \
  --changelog-path "$tmp/changelog.md" \
  --evidence-url "https://example.test/evidence" \
  --dry-run \
  > "$tmp/reviewed-notes.md"
bash "$ROOT_DIR/scripts/release/create-github-release.sh" \
  --tag v20260506-1530 \
  --target "$target" \
  --changelog-path "$tmp/changelog.md" \
  --evidence-url "https://example.test/evidence" \
  --apply \
  --draft \
  --reviewed-notes-file "$tmp/reviewed-notes.md"
)

case "$(cat "$GH_CAPTURE")" in
  *"--notes-file"*"--draft"*) ;;
  *) echo "gh release create args missing --draft or --notes-file" >&2; exit 1 ;;
esac

if (
  cd "$tmp"
  bash "$ROOT_DIR/scripts/release/create-github-release.sh" \
    --tag v20260506-1530 \
    --target "$target" \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --apply \
    --reviewed-notes-file "$tmp/reviewed-notes.md"
); then
  echo "apply without --draft should fail" >&2
  exit 1
fi

dry="$(
  bash scripts/release/create-github-release.sh \
    --tag v20260506-1530 \
    --target abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --dry-run
)"
case "$dry" in
  *"Release v20260506-1530"*) ;;
  *) echo "dry-run did not render note" >&2; exit 1 ;;
esac

echo "release script tests passed"
