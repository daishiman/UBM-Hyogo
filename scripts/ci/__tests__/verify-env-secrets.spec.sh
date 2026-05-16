#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
script="$repo_root/scripts/ci/verify-env-secrets.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/workflows" "$tmp/env-secrets" "$tmp/out"

cat > "$tmp/bin/gh" <<'GH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *"actions/secrets"*) cat "$FIXTURE_DIR/repo-secrets.txt" ;;
  *"environments/staging/secrets"*) cat "$FIXTURE_DIR/env-secrets/staging.txt" ;;
  *"environments/staging-runtime-smoke/secrets"*) cat "$FIXTURE_DIR/env-secrets/staging-runtime-smoke.txt" ;;
  *"environments/production/secrets"*) cat "$FIXTURE_DIR/env-secrets/production.txt" ;;
  *"environments/object-env/secrets"*) cat "$FIXTURE_DIR/env-secrets/object-env.txt" ;;
  *"environments/missing-env/secrets"*) echo "gh: Not Found (HTTP 404)" >&2; exit 1 ;;
  *) echo "unexpected gh args: $*" >&2; exit 99 ;;
esac
GH
chmod +x "$tmp/bin/gh"

export PATH="$tmp/bin:$PATH"
export FIXTURE_DIR="$tmp"
export GH_TOKEN="fixture-token"

write_common_fixtures() {
  : > "$tmp/repo-secrets.txt"
  : > "$tmp/env-secrets/staging.txt"
  : > "$tmp/env-secrets/staging-runtime-smoke.txt"
  : > "$tmp/env-secrets/production.txt"
  : > "$tmp/env-secrets/object-env.txt"
  : > "$tmp/allowlist"
  rm -f "$tmp/workflows"/*.yml
}

run_gate() {
  set +e
  "$script" --workflows-dir "$tmp/workflows" --allow-list "$tmp/allowlist" --owner daishiman --repo UBM-Hyogo "$@" > "$tmp/out/stdout" 2> "$tmp/out/stderr"
  rc=$?
  set -e
  return "$rc"
}

assert_rc() {
  local actual="$1"
  local expected="$2"
  if [ "$actual" -ne "$expected" ]; then
    echo "expected rc $expected, got $actual" >&2
    cat "$tmp/out/stdout" >&2 || true
    cat "$tmp/out/stderr" >&2 || true
    exit 1
  fi
}

write_common_fixtures
cat > "$tmp/workflows/staging-runtime-smoke.yml" <<'YAML'
name: staging-runtime-smoke
jobs:
  smoke:
    environment: staging-runtime-smoke
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
        env:
          STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
          STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
YAML
printf '%s\n' STAGING_API_BASE STAGING_ADMIN_BEARER > "$tmp/env-secrets/staging-runtime-smoke.txt"
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 0
test ! -s "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/staging-runtime-smoke.yml" <<'YAML'
name: staging-runtime-smoke
jobs:
  smoke:
    environment: staging-runtime-smoke
    runs-on: ubuntu-latest
    steps:
      - run: echo fail
        env:
          A: ${{ secrets.STAGING_API_BASE }}
          B: ${{ secrets.STAGING_ADMIN_BEARER }}
          C: ${{ secrets.STAGING_MEMBER_ID }}
          D: ${{ secrets.STAGING_ME_BEARER }}
YAML
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 1
test "$(wc -l < "$tmp/out/stdout" | tr -d ' ')" = "4"
grep -q 'secret=STAGING_API_BASE;reason=missing-in-env-and-repo' "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/repo-fallback.yml" <<'YAML'
name: repo-fallback
jobs:
  verify:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
        env:
          TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
YAML
printf '%s\n' CLOUDFLARE_API_TOKEN > "$tmp/repo-secrets.txt"
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 0

write_common_fixtures
cat > "$tmp/workflows/allowlist.yml" <<'YAML'
name: allowlist
jobs:
  verify:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: echo pending
        env:
          A: ${{ secrets.A_SECRET }}
          B: ${{ secrets.B_SECRET }}
YAML
printf '%s\n' 'name=A_SECRET;reason=test suppression' > "$tmp/allowlist"
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 1
grep -q 'secret=B_SECRET' "$tmp/out/stdout"
! grep -q 'secret=A_SECRET' "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/builtin.yml" <<'YAML'
name: builtin
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
YAML
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 0

write_common_fixtures
cat > "$tmp/workflows/disabled.yml" <<'YAML'
name: disabled
jobs:
  verify:
    if: false
    runs-on: ubuntu-latest
    steps:
      - run: echo disabled
        env:
          TOKEN: ${{ secrets.MISSING_SECRET }}
YAML
if run_gate --json; then rc=0; else rc=$?; fi
assert_rc "$rc" 0
grep -qx '\[\]' "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/missing-env.yml" <<'YAML'
name: missing-env
jobs:
  verify:
    environment: missing-env
    runs-on: ubuntu-latest
    steps:
      - run: echo missing
        env:
          TOKEN: ${{ secrets.MISSING_ENV_SECRET }}
YAML
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 1
grep -q 'env=missing-env;secret=MISSING_ENV_SECRET;reason=missing-environment-and-repo-secret' "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/object-env.yml" <<'YAML'
name: object-env
jobs:
  verify:
    environment:
      name: object-env
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        run: echo ok
        env:
          TOKEN: ${{ secrets.OBJECT_ENV_SECRET }}
YAML
printf '%s\n' OBJECT_ENV_SECRET > "$tmp/env-secrets/object-env.txt"
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 0

write_common_fixtures
cat > "$tmp/workflows/manual-only.yml" <<'YAML'
name: manual-only
on:
  workflow_dispatch:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo manual
        env:
          TOKEN: ${{ secrets.MANUAL_ONLY_SECRET }}
YAML
if run_gate --event-name pull_request; then rc=0; else rc=$?; fi
assert_rc "$rc" 0
if run_gate --event-name workflow_dispatch; then rc=0; else rc=$?; fi
assert_rc "$rc" 1
grep -q 'secret=MANUAL_ONLY_SECRET' "$tmp/out/stdout"

write_common_fixtures
cat > "$tmp/workflows/callee.yml" <<'YAML'
name: callee
on:
  workflow_call:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo callee
        env:
          TOKEN: ${{ secrets.INHERITED_SECRET }}
YAML
if run_gate --event-name workflow_call; then rc=0; else rc=$?; fi
assert_rc "$rc" 0

write_common_fixtures
cat > "$tmp/workflows/step-name-no-env.yml" <<'YAML'
name: step-name-no-env
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Not an environment
        run: echo ok
        env:
          TOKEN: ${{ secrets.REPO_ONLY_SECRET }}
YAML
printf '%s\n' REPO_ONLY_SECRET > "$tmp/repo-secrets.txt"
if run_gate; then rc=0; else rc=$?; fi
assert_rc "$rc" 0

echo "verify-env-secrets.spec.sh: OK"
