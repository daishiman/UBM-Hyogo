#!/usr/bin/env bats
# Runner determinism: same fixture + salt → identical output across runs

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../../.." && pwd)"
  TMP="$(mktemp -d)"
}

teardown() {
  rm -rf "$TMP"
}

@test "runner: deterministic output across two runs" {
  bash "$REPO_ROOT/scripts/audit-correlation/run.sh" \
    --github "$REPO_ROOT/scripts/audit-correlation/fixtures/github-org-update-member.json" \
    --cloudflare "$REPO_ROOT/scripts/audit-correlation/fixtures/cloudflare-login-fail.json" \
    --salt test-salt-do-not-use-in-prod \
    --out "$TMP/a.json"
  bash "$REPO_ROOT/scripts/audit-correlation/run.sh" \
    --github "$REPO_ROOT/scripts/audit-correlation/fixtures/github-org-update-member.json" \
    --cloudflare "$REPO_ROOT/scripts/audit-correlation/fixtures/cloudflare-login-fail.json" \
    --salt test-salt-do-not-use-in-prod \
    --out "$TMP/b.json"
  run diff "$TMP/a.json" "$TMP/b.json"
  [ "$status" -eq 0 ]
}

@test "runner: HIGH severity for cross-source perm change with IP shift" {
  bash "$REPO_ROOT/scripts/audit-correlation/run.sh" \
    --github "$REPO_ROOT/scripts/audit-correlation/fixtures/github-org-update-member.json" \
    --cloudflare "$REPO_ROOT/scripts/audit-correlation/fixtures/cloudflare-login-fail.json" \
    --salt test-salt-do-not-use-in-prod \
    --out "$TMP/h.json"
  run grep -q '"severity": "HIGH"' "$TMP/h.json"
  [ "$status" -eq 0 ]
}

@test "runner: empty fixtures → empty array" {
  bash "$REPO_ROOT/scripts/audit-correlation/run.sh" \
    --github "$REPO_ROOT/scripts/audit-correlation/fixtures/edge-empty.json" \
    --cloudflare "$REPO_ROOT/scripts/audit-correlation/fixtures/edge-empty.json" \
    --salt test-salt-do-not-use-in-prod \
    --out "$TMP/empty.json"
  run cat "$TMP/empty.json"
  [ "$output" = "[]" ]
}
