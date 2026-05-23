#!/usr/bin/env bats

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  export CF_ROTATE_STATE_DIR="$BATS_TEST_TMPDIR/state"
  export SCRIPT="$BATS_TEST_DIRNAME/../cf-rotate-sa-key.sh"
  export FINGERPRINT="0123456789abcdef"
  export MOCK_CF_LOG="$BATS_TEST_TMPDIR/cf.log"
  export CF_ROTATE_CF_SH="$BATS_TEST_TMPDIR/cf-mock.sh"
  cat >"$BATS_TEST_TMPDIR/cf-mock.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"${MOCK_CF_LOG:?}"
case "$*" in
  secret\ put*) cat >/dev/null; exit "${MOCK_CF_EXIT:-0}" ;;
  secret\ list*) printf '%s\n' "${MOCK_SECRET_LIST:-GOOGLE_SERVICE_ACCOUNT_JSON}"; exit 0 ;;
  tail*) sleep "${MOCK_TAIL_SLEEP:-0}"; printf 'tail ok\n'; exit 0 ;;
  *) echo "unexpected $*" >&2; exit 9 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf-mock.sh"
}

@test "enforce_history_off sets HISTFILE" {
  run bash -c "source '$SCRIPT' --source-only; enforce_history_off; printf '%s' \"\$HISTFILE\""
  [ "$status" -eq 0 ]
  [ "$output" = "/dev/null" ]
}

@test "fingerprint outputs 16 lowercase hex" {
  run bash -c "printf '%s' '{\"client_email\":\"dummy@example.com\"}' | '$SCRIPT' fingerprint"
  [ "$status" -eq 0 ]
  [[ "$output" =~ ^[a-f0-9]{16}$ ]]
}

@test "fingerprint rejects empty stdin" {
  run bash -c "printf '' | '$SCRIPT' fingerprint"
  [ "$status" -eq 3 ]
}

@test "put-staging dry-run does not call cf.sh or write state" {
  run bash -c "printf '%s' '{\"private_key\":\"TEST\"}' | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging --dry-run"
  [ "$status" -eq 0 ]
  [[ "$output" == *"[DRY-RUN]"* ]]
  [ ! -f "$MOCK_CF_LOG" ]
  [ ! -f "$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-verified" ]
}

@test "put-staging invokes cf.sh secret put through stdin" {
  run bash -c "printf '%s' '{\"placeholder\":\"dummy\"}' | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  [ "$status" -eq 0 ]
  grep -Fq "secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging" "$MOCK_CF_LOG"
}

@test "put-staging requires op ref" {
  run bash -c "printf '%s' x | '$SCRIPT' put-staging --fingerprint '$FINGERPRINT' --env staging"
  [ "$status" -eq 64 ]
}

@test "put-staging requires fingerprint" {
  run bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --env staging"
  [ "$status" -eq 64 ]
}

@test "invalid env is rejected" {
  run bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env preview"
  [ "$status" -eq 64 ]
}

@test "cf.sh failure exits 4 without leaking value" {
  export MOCK_CF_EXIT=1
  run bash -c "printf '%s' '{\"private_key\":\"NEVER_PRINT\"}' | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  [ "$status" -eq 4 ]
  [[ "$output" != *"NEVER_PRINT"* ]]
}

@test "production refuses without staging state" {
  run bash -c "printf '%s' x | '$SCRIPT' put-production --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env production"
  [ "$status" -eq 7 ]
}

@test "production accepts after staging state" {
  bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  "$SCRIPT" verify --env staging
  run bash -c "printf '%s' y | '$SCRIPT' put-production --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env production --dry-run"
  [ "$status" -eq 0 ]
  [[ "$output" == *"production"* ]]
}

@test "verify succeeds when secret name is present after real staging put" {
  bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  run "$SCRIPT" verify --env staging
  [ "$status" -eq 0 ]
  [ -f "$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-verified" ]
}

@test "verify staging refuses to unlock without real staging put" {
  run "$SCRIPT" verify --env staging
  [ "$status" -eq 7 ]
  [ ! -f "$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-verified" ]
}

@test "verify exits 5 when secret name is absent" {
  bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  export MOCK_SECRET_LIST="OTHER_SECRET"
  run "$SCRIPT" verify --env staging
  [ "$status" -eq 5 ]
}

@test "tail timeout exits 6" {
  export MOCK_TAIL_SLEEP=2
  run "$SCRIPT" tail --env staging --seconds 1
  [ "$status" -eq 6 ]
}

@test "helper rejects literal TTY input for fingerprint" {
  run bash -c "'$SCRIPT' fingerprint </dev/null"
  [ "$status" -eq 3 ]
}

@test "put-production dry-run remains locked after staging dry-run only" {
  bash -c "printf '%s' x | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging --dry-run"
  run bash -c "printf '%s' y | '$SCRIPT' put-production --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env production --dry-run"
  [ "$status" -eq 7 ]
}

@test "put-staging consumes stdin without writing value to state" {
  bash -c "printf '%s' '{\"private_key\":\"SECRET\"}' | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  "$SCRIPT" verify --env staging
  ! grep -Fq "private_key" "$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-put"
  ! grep -Fq "private_key" "$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-verified"
}

@test "put-production target must match env" {
  bash -c "printf '%s' y | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  "$SCRIPT" verify --env staging
  run bash -c "printf '%s' y | '$SCRIPT' put-production --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging --dry-run"
  [ "$status" -eq 64 ]
}

@test "put-production fingerprint must match verified staging state" {
  bash -c "printf '%s' y | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  "$SCRIPT" verify --env staging
  run bash -c "printf '%s' y | '$SCRIPT' put-production --op-ref op://Vault/Item/Field --fingerprint fedcba9876543210 --env production --dry-run"
  [ "$status" -eq 7 ]
}

@test "put-production op-ref must match verified staging state" {
  bash -c "printf '%s' y | '$SCRIPT' put-staging --op-ref op://Vault/Item/Field --fingerprint '$FINGERPRINT' --env staging"
  "$SCRIPT" verify --env staging
  run bash -c "printf '%s' y | '$SCRIPT' put-production --op-ref op://Vault/Other/Field --fingerprint '$FINGERPRINT' --env production --dry-run"
  [ "$status" -eq 7 ]
}

@test "tail rejects non-numeric seconds" {
  run "$SCRIPT" tail --env staging --seconds nope
  [ "$status" -eq 64 ]
}

@test "verify rejects invalid env" {
  run "$SCRIPT" verify --env dev
  [ "$status" -eq 64 ]
}

@test "unknown subcommand exits usage" {
  run "$SCRIPT" nope
  [ "$status" -eq 64 ]
}
