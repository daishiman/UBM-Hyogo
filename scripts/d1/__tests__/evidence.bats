#!/usr/bin/env bats

@test "evidence redacts bearer token" {
  run bash scripts/d1/evidence.sh --ts 20260503T000000Z --type apply --stdin <<< "Authorization: Bearer abc"
  [ "$status" -eq 0 ]
  [[ "$output" == *".evidence/d1/20260503T000000Z/apply.log"* ]]
  ! grep -q "Bearer abc" .evidence/d1/20260503T000000Z/apply.log
  rm -rf .evidence/d1/20260503T000000Z
}

@test "evidence meta records operation fields" {
  run bash scripts/d1/evidence.sh --ts 20260503T000001Z --type meta --db ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --dry-run 1 --exit-code 0 --approver reviewer
  [ "$status" -eq 0 ]
  [[ "$output" == *".evidence/d1/20260503T000001Z/meta.json"* ]]
  grep -q '"db":"ubm-hyogo-db-staging"' .evidence/d1/20260503T000001Z/meta.json
  grep -q '"dry_run":true' .evidence/d1/20260503T000001Z/meta.json
  grep -q '"migration_sha":"' .evidence/d1/20260503T000001Z/meta.json
  rm -rf .evidence/d1/20260503T000001Z
}
