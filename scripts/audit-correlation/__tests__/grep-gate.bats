#!/usr/bin/env bats
# grep-gate bats tests (TC-RED-12, TC-RED-13, TC-RED-14)

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../../.." && pwd)"
  TMP="$(mktemp -d)"
}

teardown() {
  rm -rf "$TMP"
}

@test "grep-gate: clean output passes (HIGH dry-run)" {
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" \
    --github "$REPO_ROOT/scripts/audit-correlation/fixtures/github-org-update-member.json" \
    --cloudflare "$REPO_ROOT/scripts/audit-correlation/fixtures/cloudflare-login-fail.json" \
    --salt test-salt-do-not-use-in-prod \
    --out "$TMP/out.json"
  [ "$status" -eq 0 ]
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/out.json"
  [ "$status" -eq 0 ]
}

@test "grep-gate: TC-RED-12 detects full IPv4" {
  echo '[{"foo":"203.0.113.45"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: TC-RED-13 detects User-Agent header" {
  echo '[{"raw":"User-Agent: Mozilla/5.0 Chrome/120"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: TC-RED-14 detects GitHub PAT" {
  echo '[{"token":"ghp_abcdEFGH1234567890XYZ"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: ipPrefix /24 form is allowed" {
  echo '[{"ipPrefix":"203.0.113.0/24"}]' > "$TMP/ok.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/ok.json"
  [ "$status" -eq 0 ]
}

@test "grep-gate: detects full IPv6" {
  echo '[{"ip":"2001:db8:abcd:1234:5678::1"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: detects full email" {
  echo '[{"actor":"alice@example.com"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: detects salt literal" {
  echo '[{"salt":"test-salt-do-not-use-in-prod"}]' > "$TMP/bad.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/bad.json"
  [ "$status" -eq 1 ]
}

@test "grep-gate: IPv6 /48 prefix form is allowed" {
  echo '[{"ipPrefix":"2001:db8:abcd::/48"}]' > "$TMP/ok.json"
  run bash "$REPO_ROOT/scripts/audit-correlation/grep-gate.sh" "$TMP/ok.json"
  [ "$status" -eq 0 ]
}
