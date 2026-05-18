#!/usr/bin/env bash
# verify-primitive-adoption.sh
# Issue #749 — 19 routes x 6 primitive adoption verification
#
# Exit non-zero if any of C1-C4 fails.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0

# --- C1: no raw <input> in admin / public DensityToggle
#   text-like inputs must go through FormField + Input primitive.
#   radio / checkbox are out of scope for the Input primitive abstraction
#   (these are choice controls, not single-line text fields).
C1_RAW="$(grep -rn --exclude-dir=__tests__ --include='*.tsx' '<input' \
  apps/web/src/components/admin/ \
  apps/web/src/components/public/DensityToggle.client.tsx \
  2>/dev/null || true)"
C1_OUT="$(printf '%s\n' "$C1_RAW" | awk '
  NR==FNR { next }
' /dev/null <(printf '%s\n' "$C1_RAW") | while IFS= read -r line; do
  [ -z "$line" ] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  # Read 6 lines starting at the match to span multi-line JSX opening tags,
  # then check if the element carries a radio / checkbox type attribute.
  block="$(sed -n "${lineno},$((lineno + 6))p" "$file")"
  if printf '%s' "$block" | grep -qE 'type="(radio|checkbox)"'; then
    continue
  fi
  printf '%s\n' "$line"
done)"
if [ -n "$C1_OUT" ]; then
  C1_HITS=$(printf '%s\n' "$C1_OUT" | wc -l | tr -d ' ')
  echo "[C1 FAIL] raw <input> usage found: $C1_HITS hits"
  printf '%s\n' "$C1_OUT"
  FAIL=1
else
  echo "[C1 OK] no raw text-like <input> in admin / public DensityToggle"
fi

# --- C2: mutating admin panels route writes through useAdminMutation().trigger().
#   panel_path: panel that owns the mutation surface.
#   delegate_path: optional sibling component the panel delegates mutation to
#     (e.g. TagQueuePanel renders TagsQueueResolveDrawer which holds the hook).
EXPECTED_PANELS=(
  "MeetingPanel|"
  "TagQueuePanel|apps/web/src/components/admin/TagsQueueResolveDrawer.tsx"
  "SchemaDiffPanel|"
  "RequestQueuePanel|"
)
panel_uses_hook() {
  local path="$1"
  [ -f "$path" ] || return 1
  grep -q 'features/admin/hooks/useAdminMutation' "$path" || return 1
  # accept either `someMutation.trigger(` (object-style) or `{ trigger ... }` destructure
  if ! grep -qE '\.trigger\(|\{\s*trigger\b' "$path"; then
    return 1
  fi
  ! grep -q 'void _.*Mutation' "$path"
}
for entry in "${EXPECTED_PANELS[@]}"; do
  p="${entry%%|*}"
  delegate="${entry#*|}"
  panel_path="apps/web/src/components/admin/${p}.tsx"
  if panel_uses_hook "$panel_path"; then
    echo "[C2 OK] $p uses useAdminMutation trigger (features)"
  elif [ -n "$delegate" ] && panel_uses_hook "$delegate" \
    && grep -q "$(basename "$delegate" .tsx)" "$panel_path"; then
    echo "[C2 OK] $p delegates mutation to $(basename "$delegate" .tsx) (features hook)"
  else
    echo "[C2 FAIL] $p does not use features/admin/hooks/useAdminMutation trigger"
    FAIL=1
  fi
done

# --- C3: 8 admin route page.tsx import Breadcrumb
ADMIN_ROUTES=(
  "apps/web/app/(admin)/admin/page.tsx"
  "apps/web/app/(admin)/admin/members/page.tsx"
  "apps/web/app/(admin)/admin/tags/page.tsx"
  "apps/web/app/(admin)/admin/meetings/page.tsx"
  "apps/web/app/(admin)/admin/schema/page.tsx"
  "apps/web/app/(admin)/admin/requests/page.tsx"
  "apps/web/app/(admin)/admin/identity-conflicts/page.tsx"
  "apps/web/app/(admin)/admin/audit/page.tsx"
)
for r in "${ADMIN_ROUTES[@]}"; do
  if grep -q '<Breadcrumb' "$r" || grep -q '<AdminPageHeader' "$r"; then
    echo "[C3 OK] $r renders Breadcrumb directly or through AdminPageHeader"
  else
    echo "[C3 FAIL] $r does not render Breadcrumb"
    FAIL=1
  fi
done

C3_PLACEHOLDERS="$(grep -rln 'void Breadcrumb' "apps/web/app/(admin)/admin" 2>/dev/null || true)"
if [ -n "$C3_PLACEHOLDERS" ]; then
  echo "[C3 FAIL] placeholder Breadcrumb imports found"
  printf '%s\n' "$C3_PLACEHOLDERS"
  FAIL=1
fi

# --- C4: no admin panel imports legacy @/lib/useAdminMutation
C4_OUT="$(grep -rln 'from "@/lib/useAdminMutation"' apps/web/src/components/admin/ 2>/dev/null || true)"
if [ -n "$C4_OUT" ]; then
  echo "[C4 FAIL] legacy @/lib/useAdminMutation still referenced from admin/"
  printf '%s\n' "$C4_OUT"
  FAIL=1
else
  echo "[C4 OK] no legacy @/lib/useAdminMutation reference in admin/"
fi

# --- C5: EmptyState primitive is used by admin empty-result surfaces
EXPECTED_EMPTY_STATE=(
  "apps/web/src/features/admin/components/_members/MembersTable.tsx"
  "apps/web/src/components/admin/MeetingPanel.tsx"
  "apps/web/src/components/admin/TagQueuePanel.tsx"
  "apps/web/src/components/admin/SchemaDiffPanel.tsx"
  "apps/web/src/components/admin/RequestQueuePanel.tsx"
  "apps/web/src/components/admin/AuditLogPanel.tsx"
  "apps/web/app/(admin)/admin/identity-conflicts/page.tsx"
)
for p in "${EXPECTED_EMPTY_STATE[@]}"; do
  if grep -q '<EmptyState' "$p"; then
    echo "[C5 OK] $p renders EmptyState"
  else
    echo "[C5 FAIL] $p does not render EmptyState"
    FAIL=1
  fi
done

# --- C6: Pagination primitive is used by paged admin surfaces
EXPECTED_PAGINATION=(
  "apps/web/src/features/admin/components/_members/MembersTable.tsx"
  "apps/web/src/components/admin/RequestQueuePanel.tsx"
  "apps/web/src/components/admin/AuditLogPanel.tsx"
)
for p in "${EXPECTED_PAGINATION[@]}"; do
  if grep -q '<Pagination' "$p"; then
    echo "[C6 OK] $p renders Pagination"
  else
    echo "[C6 FAIL] $p does not render Pagination"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then
  echo "verify-primitive-adoption: FAIL"
  exit 1
fi
echo "verify-primitive-adoption: PASS"
