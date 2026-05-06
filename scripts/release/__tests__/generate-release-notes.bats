#!/usr/bin/env bats

@test "generate-release-notes renders deterministic required fields" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"

  run bash scripts/release/generate-release-notes.sh \
    --tag v20260506-1530 \
    --commit abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --generated-at "2026-05-06T15:30:00Z"

  [ "$status" -eq 0 ]
  [[ "$output" == *"Release v20260506-1530"* ]]
  [[ "$output" == *"abcdef1234"* ]]
  [[ "$output" == *"- Item"* ]]
}

@test "generate-release-notes rejects invalid tag" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n' > "$tmp/changelog.md"

  run bash scripts/release/generate-release-notes.sh \
    --tag bad-tag \
    --commit abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence"

  [ "$status" -ne 0 ]
}

@test "generate-release-notes falls back when changelog is missing" {
  run bash scripts/release/generate-release-notes.sh \
    --tag v20260506-1530 \
    --commit abcdef1234 \
    --changelog-path /tmp/ubm-hyogo-missing-changelog.md \
    --evidence-url "https://example.test/evidence" \
    --generated-at "2026-05-06T15:30:00Z"

  [ "$status" -eq 0 ]
  [[ "$output" == *"Changelog file not found"* ]]
}

@test "generate-release-notes replaces all placeholders" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"

  run bash scripts/release/generate-release-notes.sh \
    --tag v20260506-1530 \
    --commit abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --rollback-url "https://example.test/rollback" \
    --followup-url "https://example.test/followup" \
    --generated-at "2026-05-06T15:30:00Z"

  [ "$status" -eq 0 ]
  [[ "$output" != *"{{"* ]]
  [[ "$output" != *"}}"* ]]
}

@test "create-github-release dry-run does not call gh" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '#!/usr/bin/env bash\nexit 99\n' > "$tmp/gh"
  chmod +x "$tmp/gh"
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"

  run env GH_RELEASE_BIN="$tmp/gh" bash scripts/release/create-github-release.sh \
    --tag v20260506-1530 \
    --target abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --dry-run

  [ "$status" -eq 0 ]
  [[ "$output" == *"Release v20260506-1530"* ]]
}

@test "create-github-release dry-run is deterministic with fixed generator time" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"

  first="$(
    bash scripts/release/generate-release-notes.sh \
      --tag v20260506-1530 \
      --commit abcdef1234 \
      --changelog-path "$tmp/changelog.md" \
      --evidence-url "https://example.test/evidence" \
      --generated-at "2026-05-06T15:30:00Z"
  )"
  second="$(
    bash scripts/release/generate-release-notes.sh \
      --tag v20260506-1530 \
      --commit abcdef1234 \
      --changelog-path "$tmp/changelog.md" \
      --evidence-url "https://example.test/evidence" \
      --generated-at "2026-05-06T15:30:00Z"
  )"

  [ "$first" = "$second" ]
}

@test "create-github-release apply without draft is rejected" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"

  run bash scripts/release/create-github-release.sh \
    --tag v20260506-1530 \
    --target abcdef1234 \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url "https://example.test/evidence" \
    --apply

  [ "$status" -ne 0 ]
  [[ "$output" == *"--apply requires --draft"* ]]
}

@test "create-github-release apply draft calls gh release create" {
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  printf '# Changelog\n\n- Item\n' > "$tmp/changelog.md"
  git -C "$tmp" init -q
  git -C "$tmp" config user.email test@example.test
  git -C "$tmp" config user.name "Release Test"
  printf 'fixture\n' > "$tmp/file.txt"
  git -C "$tmp" add file.txt
  git -C "$tmp" commit -q -m fixture
  target="$(git -C "$tmp" rev-parse HEAD)"
  git -C "$tmp" tag v20260506-1530 "$target"
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
exit 2
SH
  chmod +x "$tmp/gh"

  bash scripts/release/create-github-release.sh \
    --tag v20260506-1530 \
    --target "$target" \
    --changelog-path "$tmp/changelog.md" \
    --evidence-url https://example.test/evidence \
    --dry-run \
    > "$tmp/reviewed-notes.md"

  run env GH_RELEASE_BIN="$tmp/gh" GH_CAPTURE="$tmp/gh.args" RELEASE_NOTES_GENERATOR="$PWD/scripts/release/generate-release-notes.sh" RELEASE_NOTES_TEMPLATE="$PWD/scripts/release/release-notes.template.md" \
    bash -c 'cd "$1" && bash "$2/scripts/release/create-github-release.sh" --tag v20260506-1530 --target "$3" --changelog-path "$1/changelog.md" --evidence-url https://example.test/evidence --apply --draft --reviewed-notes-file "$1/reviewed-notes.md"' _ "$tmp" "$PWD" "$target"

  [ "$status" -eq 0 ]
  [[ "$(cat "$tmp/gh.args")" == *"--draft"* ]]
}
