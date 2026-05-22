#!/usr/bin/env bash
set -euo pipefail

F="docs/00-getting-started-manual/specs/09a-prototype-map.md"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

[[ -f "$F" ]] || fail "$F is missing"

lines="$(wc -l < "$F" | tr -d ' ')"
[[ "$lines" -ge 360 ]] || fail "expected $F to have at least 360 lines, got $lines"

route_rows="$(grep -cE '^\| `(/|\(public\)|\(admin\)|app/).*` \|' "$F" || true)"
[[ "$route_rows" -eq 19 ]] || fail "expected exactly 19 route rows, got $route_rows"

ledger_rows="$(grep -cE '^\| [^|]+ \| `[^`]+\.jsx` \| L[0-9]+-L[0-9]+ \|' "$F" || true)"
[[ "$ledger_rows" -ge 25 ]] || fail "expected at least 25 ledger rows, got $ledger_rows"

derivation_sections="$(grep -cE '^### 5\.[1-8] ' "$F" || true)"
[[ "$derivation_sections" -eq 8 ]] || fail "expected derivation sections 5.1-5.8, got $derivation_sections"

rejected_count="$(grep -c '不採用' "$F" || true)"
[[ "$rejected_count" -ge 4 ]] || fail "expected at least 4 rejection markers, got $rejected_count"

grep -q '新規 primitive を生やさない' "$F" || fail "missing primitive constraint"
grep -q '09c-primitives.md' "$F" || fail "missing 09c spec mapping"
grep -q '09h-shell-and-fixtures.md' "$F" || fail "missing 09h spec mapping"

if grep -Eq '#[0-9a-fA-F]{6}|oklch\(' "$F"; then
  fail "token values leaked into $F"
fi

grep -q '09a-prototype-map.md' docs/00-getting-started-manual/specs/09-ui-ux.md \
  || fail "09-ui-ux.md does not link to 09a-prototype-map.md"

check_line() {
  local path="$1"
  local line="$2"
  [[ -f "$path" ]] || fail "prototype file missing: $path"
  sed -n "${line}p" "$path" >/dev/null
}

check_symbol() {
  local path="$1"
  local line="$2"
  local symbol="$3"
  [[ -f "$path" ]] || fail "prototype file missing: $path"
  sed -n "${line}p" "$path" | grep -q "$symbol" \
    || fail "expected $symbol at $path line $line"
}

check_line docs/00-getting-started-manual/claude-design-prototype/app.jsx 251
check_line docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 272
check_line docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 472
check_line docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx 373
check_line docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx 658
check_line docs/00-getting-started-manual/claude-design-prototype/icons.jsx 79
check_line docs/00-getting-started-manual/claude-design-prototype/data.jsx 339

check_symbol docs/00-getting-started-manual/claude-design-prototype/app.jsx 24 'App'
check_symbol docs/00-getting-started-manual/claude-design-prototype/app.jsx 119 'Sidebar'
check_symbol docs/00-getting-started-manual/claude-design-prototype/app.jsx 166 'Topbar'
check_symbol docs/00-getting-started-manual/claude-design-prototype/app.jsx 193 'MinimalBar'
check_symbol docs/00-getting-started-manual/claude-design-prototype/app.jsx 213 'TweaksPanel'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 6 'Chip'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 20 'AvatarStoreProvider'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 37 'Avatar'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 92 'Button'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 113 'Switch'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 118 'Segmented'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 129 'Field'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 150 'Search'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 158 'Drawer'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 177 'Modal'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 201 'ToastProvider'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 226 'KVList'
check_symbol docs/00-getting-started-manual/claude-design-prototype/primitives.jsx 248 'LinkPills'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 4 'LandingPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 155 'MemberCardPublic'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 208 'MemberListPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 339 'MemberDetailPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx 4 'LoginPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx 68 'MemberFormPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx 220 'MyProfilePage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx 4 'AdminDashboardPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx 162 'AdminMembersPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx 369 'AdminTagsPage'
check_symbol docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx 508 'SchemaDiffPage'

echo "OK: 09a-prototype-map.md verifier passed"
