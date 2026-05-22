#!/usr/bin/env bash
set -euo pipefail

F="docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

test -f "$F" || fail "$F not found"

lines=$(wc -l < "$F" | tr -d ' ')
sections=$(grep -cE '^## ([1-9]|99)\. ' "$F" || true)
sidebar=$(grep -c '^## 1\. AdminSidebar' "$F" || true)
mermaid=$(grep -c '^```mermaid$' "$F" || true)
derived=$(grep -c '^> 派生元: phase-3' "$F" || true)
visual=$(grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F" || true)

echo "09g verification"
echo "lines=$lines"
echo "sections=$sections"
echo "sidebar=$sidebar"
echo "mermaid=$mermaid"
echo "derived=$derived"

(( lines >= 700 && lines <= 1200 )) || fail "line count must be 700..1200"
(( sections == 10 )) || fail "section count must be 10 (§1..§9 + §99)"
(( sidebar == 1 )) || fail "AdminSidebar section must be single"
(( mermaid == 8 )) || fail "mermaid block count must be 8"
(( derived == 4 )) || fail "derived marker count must be 4"
[[ -z "$visual" ]] || fail "visual literal found: $visual"

for route in Dashboard Members Tags Meetings Schema Requests Identity Audit; do
  grep -q "$route" "$F" || fail "route label missing: $route"
done

for endpoint in \
  "/admin/dashboard" \
  "/admin/members" \
  "/admin/tags/queue" \
  "/admin/meetings" \
  "/admin/schema/diff" \
  "/admin/schema/aliases" \
  "/admin/requests" \
  "/admin/identity-conflicts" \
  "/admin/audit"; do
  grep -q "$endpoint" "$F" || fail "endpoint missing: $endpoint"
done

for stale in "/admin/kpi" "/admin/tags/:id/{approve,reject}" "/admin/schema/apply" "/admin/identity-conflicts/:id/resolve"; do
  if grep -q "$stale" "$F"; then
    fail "stale endpoint remains: $stale"
  fi
done

echo "PASS"
