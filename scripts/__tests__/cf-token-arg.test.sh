#!/usr/bin/env bash
set -euo pipefail

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

repo_root="$(git rev-parse --show-toplevel)"
bin_dir="$tmp_dir/bin"
fake_repo="$tmp_dir/repo"
mkdir -p "$bin_dir" "$fake_repo/node_modules/.bin"

cat >"$bin_dir/git" <<'SH'
#!/usr/bin/env bash
if [ "$1" = "rev-parse" ] && [ "$2" = "--show-toplevel" ]; then
  printf '%s\n' "${TEST_REPO_ROOT:?}"
  exit 0
fi
exit 64
SH

cat >"$fake_repo/node_modules/.bin/wrangler" <<'SH'
#!/usr/bin/env bash
printf 'wrangler %s\n' "$*"
SH

chmod +x "$bin_dir/git" "$fake_repo/node_modules/.bin/wrangler"

output="$(
  TEST_REPO_ROOT="$fake_repo" \
  PATH="$bin_dir:$PATH" \
  CLOUDFLARE_API_TOKEN="dummy-token" \
  "$repo_root/scripts/cf.sh" whoami
)"

if [ "$output" != "wrangler whoami" ]; then
  printf 'FAIL: expected direct wrangler execution, got: %s\n' "$output" >&2
  exit 1
fi

printf 'PASS: cf.sh skips with-env when CLOUDFLARE_API_TOKEN is already set\n'
