#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/scripts/ci/verify-workflow-doc-refs.sh"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

passed=0
failed=0

pass() {
  printf '[PASS] %s\n' "$1"
  passed=$((passed + 1))
}

fail() {
  printf '[FAIL] %s: %s\n' "$1" "$2" >&2
  failed=$((failed + 1))
}

run_case() {
  local id="$1"
  shift
  if "$@"; then
    pass "$id"
  else
    fail "$id" "assertion failed"
  fi
}

make_repo() {
  local name="$1"
  mkdir -p "$TMP_ROOT/$name/.github/workflows" "$TMP_ROOT/$name/docs"
  git -C "$TMP_ROOT/$name" init -q
}

tc_all_refs_exist() {
  make_repo ok
  mkdir -p "$TMP_ROOT/ok/docs/runbooks"
  printf '# ok\n' > "$TMP_ROOT/ok/docs/runbooks/secret-provisioning.md"
  cat > "$TMP_ROOT/ok/.github/workflows/sample.yml" <<'YAML'
name: sample
on: workflow_dispatch
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo "see docs/runbooks/secret-provisioning.md"
YAML
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/ok" 2>&1)"
  printf '%s\n' "$output" | grep -q 'verify-workflow-doc-refs: OK'
}

tc_missing_ref_detected() {
  make_repo missing
  cat > "$TMP_ROOT/missing/.github/workflows/sample.yml" <<'YAML'
name: sample
on: workflow_dispatch
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo "see docs/missing/runbook.md"
YAML
  set +e
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/missing" 2>&1)"
  status=$?
  set -e
  [ "$status" -eq 1 ] &&
    printf '%s\n' "$output" | grep -q 'verify-workflow-doc-refs: MISSING' &&
    printf '%s\n' "$output" | grep -q 'docs/missing/runbook.md'
}

tc_url_ignored() {
  make_repo url
  cat > "$TMP_ROOT/url/.github/workflows/sample.yml" <<'YAML'
name: sample
on: workflow_dispatch
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo "https://example.com/docs/not-local.md"
YAML
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/url" 2>&1)"
  printf '%s\n' "$output" | grep -q 'OK (0 references checked'
}

tc_mixed_url_and_local_missing_detected() {
  make_repo mixed
  cat > "$TMP_ROOT/mixed/.github/workflows/sample.yml" <<'YAML'
name: sample
on: workflow_dispatch
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo "https://example.com/docs/external.md then docs/local/missing.md"
YAML
  set +e
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/mixed" 2>&1)"
  status=$?
  set -e
  [ "$status" -eq 1 ] &&
    printf '%s\n' "$output" | grep -q 'docs/local/missing.md' &&
    ! printf '%s\n' "$output" | grep -q 'docs/external.md'
}

tc_anchor_stripped() {
  make_repo anchor
  printf '# ok\n' > "$TMP_ROOT/anchor/docs/foo.md"
  cat > "$TMP_ROOT/anchor/.github/workflows/sample.yml" <<'YAML'
name: sample
on: workflow_dispatch
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - run: echo "docs/foo.md#section"
YAML
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/anchor" 2>&1)"
  printf '%s\n' "$output" | grep -q 'OK (1 references checked'
}

tc_missing_dir_errors() {
  make_repo nodir
  rm -rf "$TMP_ROOT/nodir/.github/workflows"
  set +e
  output="$(bash "$SCRIPT" --root "$TMP_ROOT/nodir" 2>&1)"
  status=$?
  set -e
  [ "$status" -eq 2 ] && printf '%s\n' "$output" | grep -q 'workflows dir not found'
}

tc_repo_workflows_pass() {
  bash "$SCRIPT" --root "$REPO_ROOT" >/dev/null
}

run_case "TC-01 all refs exist" tc_all_refs_exist
run_case "TC-02 missing ref detected" tc_missing_ref_detected
run_case "TC-03 URL refs ignored" tc_url_ignored
run_case "TC-04 mixed URL and local missing detected" tc_mixed_url_and_local_missing_detected
run_case "TC-05 anchors stripped" tc_anchor_stripped
run_case "TC-06 missing workflows dir exits 2" tc_missing_dir_errors
run_case "TC-07 repository workflows pass" tc_repo_workflows_pass

printf 'SUMMARY: %d passed / %d failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ]
