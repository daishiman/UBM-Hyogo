#!/usr/bin/env bats

GUIDELINE_PATH="docs/30-workflows/runbooks/d1-migration-test-guideline.md"

@test "guideline file exists" {
  [ -f "$GUIDELINE_PATH" ]
}

@test "guideline contains minimum-standard heading" {
  grep -F "## 最低基準" "$GUIDELINE_PATH"
}

@test "guideline contains 02b-suite-responsibility heading" {
  grep -F "## 02b suite 責任範囲" "$GUIDELINE_PATH"
}

@test "guideline contains application-flow heading" {
  grep -F "## 適用フロー" "$GUIDELINE_PATH"
}

@test "guideline contains minimum standard keywords" {
  grep -F "forward apply green" "$GUIDELINE_PATH"
  grep -F "contract test pass" "$GUIDELINE_PATH"
  grep -F "repository or use-case test" "$GUIDELINE_PATH"
}
