#!/usr/bin/env bash
# Invariant audit runner for task-24.
# Read-only: scans task specs + apps/ + packages/ for INV-1..INV-6 compliance.
# Usage: bash audit-runner.sh [OUT_DIR]
set -u

OUT_DIR="${1:-$(cd "$(dirname "$0")" && pwd)}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TASKS_DIR="docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery"
FINAL_REPORT="$TASKS_DIR/INVARIANT-AUDIT.md"
EVIDENCE="$OUT_DIR/grep-evidence.txt"
MATRIX="$OUT_DIR/matrix.tsv"
VIOLATIONS="$OUT_DIR/violations.md"

mkdir -p "$OUT_DIR"
: > "$EVIDENCE"
: > "$MATRIX"
: > "$VIOLATIONS"

log() { printf '\n=== %s ===\n' "$*" >> "$EVIDENCE"; }
ev()  { printf '%s\n' "$*" >> "$EVIDENCE"; }

TASK_FILES=$(find "$TASKS_DIR" -maxdepth 3 -name "task-*.md" \
  | sed -E 's#^.*/(task-[0-9]+).*#\1\t&#' \
  | sort -V -k1,1 \
  | cut -f2-)

# Map task spec path -> short task ID (task-01 .. task-22)
short_id() {
  basename "$1" | sed -E 's/^(task-[0-9]+).*/\1/'
}

#-------------------------------------------------
# Repo-wide grep evidence (lane B/C: implementation scope)
#-------------------------------------------------
log "INV-2 grep: bg-[# / text-[# / border-[# in apps/web/src"
grep -rnE 'bg-\[#|text-\[#|border-\[#' apps/web/src >> "$EVIDENCE" 2>/dev/null || ev "NO_MATCH"

log "INV-2 grep: HEX color in apps/web/src (excluding tokens.css)"
grep -rnE '#[0-9a-fA-F]{6}' apps/web/src --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null \
  | grep -v 'tokens.css' >> "$EVIDENCE" || ev "NO_MATCH"

log "INV-3 primitives directory listing (apps/web/src/components/ui)"
find apps/web/src/components/ui -maxdepth 1 -type f -printf '%f\n' 2>/dev/null | sort > "$OUT_DIR/primitives-current.txt" || true
cat > "$OUT_DIR/primitives-allowed.txt" <<'EOF'
Avatar.tsx
Badge.tsx
Banner.tsx
Button.tsx
Card.tsx
Chip.tsx
Drawer.tsx
EmptyState.tsx
Field.tsx
Input.tsx
KVList.tsx
LinkPills.tsx
Modal.tsx
Search.tsx
Segmented.tsx
Select.tsx
Sidebar.tsx
Stat.tsx
Switch.tsx
Textarea.tsx
Toast.tsx
icons.ts
index.ts
EOF
sort -o "$OUT_DIR/primitives-allowed.txt" "$OUT_DIR/primitives-allowed.txt"
if [ -s "$OUT_DIR/primitives-current.txt" ]; then
  cat "$OUT_DIR/primitives-current.txt" >> "$EVIDENCE"
else
  ev "NO_DIR"
fi
comm -13 "$OUT_DIR/primitives-allowed.txt" "$OUT_DIR/primitives-current.txt" > "$OUT_DIR/primitives-unexpected.txt"
log "INV-3 unexpected primitives diff (current - allowed)"
if [ -s "$OUT_DIR/primitives-unexpected.txt" ]; then
  cat "$OUT_DIR/primitives-unexpected.txt" >> "$EVIDENCE"
else
  ev "NO_UNEXPECTED_PRIMITIVES"
fi

log "INV-4 D1 references in apps/web/src"
grep -rnE 'D1Database|env\.DB|\[\[d1_databases\]\]' apps/web/src 2>/dev/null >> "$EVIDENCE" || ev "NO_MATCH"

log "INV-4 d1_databases in apps/web/wrangler.toml"
grep -nE '\[\[d1_databases\]\]' apps/web/wrangler.toml 2>/dev/null >> "$EVIDENCE" || ev "NO_MATCH"

log "INV-5 consent keys in apps/web/src + apps/api/src (non-test, non-function)"
grep -rnoE '\b[a-z][a-zA-Z]*Consent\b' apps/web/src apps/api/src 2>/dev/null \
  | grep -vE '__tests__|\.spec\.|\.test\.' \
  | sort -u >> "$EVIDENCE" || ev "NO_MATCH"

log "INV-6 gas-prototype references under apps/ + packages/"
grep -rn 'gas-prototype' apps/ packages/ 2>/dev/null >> "$EVIDENCE" || ev "NO_MATCH"

#-------------------------------------------------
# Aggregate booleans (whole-repo invariants)
#-------------------------------------------------
inv2_hex_hits=$(grep -rnE 'bg-\[#|text-\[#|border-\[#' apps/web/src 2>/dev/null | wc -l | tr -d ' ')
inv2_hex_hits2=$(grep -rnE '#[0-9a-fA-F]{6}' apps/web/src --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null | grep -cv 'tokens.css' || true)
inv4_d1_hits=$(grep -rnE 'D1Database|env\.DB' apps/web/src 2>/dev/null | grep -cv '__tests__/boundary.spec.ts' || true)
if [ -f apps/web/wrangler.toml ]; then
  inv4_wrangler_hits=$(grep -cE '\[\[d1_databases\]\]' apps/web/wrangler.toml || true)
else
  inv4_wrangler_hits=0
fi
inv4_wrangler_hits=${inv4_wrangler_hits:-0}
inv3_unexpected_hits=$(wc -l < "$OUT_DIR/primitives-unexpected.txt" | tr -d ' ')
inv5_consent_other=$(grep -rhoE '\b[a-z][a-zA-Z]*Consent\b' apps/web/src apps/api/src \
    --include='*.ts' --include='*.tsx' 2>/dev/null \
  | sort -u \
  | grep -vE '^(publicConsent|rulesConsent)$' \
  | grep -vE '^(set|get|require|extract|normalize|parse|validate|create|update|delete|fetch|load|build|render|use|is|has|to|map|ensure|check|with|on)[A-Z]' \
  | wc -l | tr -d ' ')
# Exclude test files entirely (test fixtures intentionally use legacy keys for normalization tests).
FUNC_NAME_RE='^(set|get|require|extract|normalize|parse|validate|create|update|delete|fetch|load|build|render|use|is|has|to|map|ensure|check|with|on)[A-Z]'
inv5_consent_other=$(grep -rEn '\b[a-z][a-zA-Z]*Consent\b' apps/web/src apps/api/src \
    --include='*.ts' --include='*.tsx' 2>/dev/null \
  | grep -vE '__tests__|\.spec\.|\.test\.' \
  | grep -vE ':[[:space:]]*(//|\*)' \
  | grep -oE '\b[a-z][a-zA-Z]*Consent\b' \
  | sort -u \
  | grep -vE '^(publicConsent|rulesConsent)$' \
  | grep -vE "$FUNC_NAME_RE" \
  | wc -l | tr -d ' ')
inv6_gas_hits=$(grep -rn 'gas-prototype' apps/ packages/ 2>/dev/null | wc -l | tr -d ' ')

repo_status() {
  case "$1" in
    INV-2) [ "$inv2_hex_hits" = "0" ] && [ "$inv2_hex_hits2" = "0" ] && echo COMPLIANT || echo VIOLATION ;;
    INV-3) [ "$inv3_unexpected_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ;;
    INV-4) [ "$inv4_d1_hits" = "0" ] && [ "$inv4_wrangler_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ;;
    INV-5) [ "$inv5_consent_other" = "0" ] && echo COMPLIANT || echo VIOLATION ;;
    INV-6) [ "$inv6_gas_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ;;
  esac
}

#-------------------------------------------------
# Per-task spec checks (lane A: spec text)
#-------------------------------------------------
NEG_RE='(禁止|不可|しない|しません|せず|伴わず|なし|一切|超え.*禁止|追加なし|変更なし|生やさない|生成しない|無し)'
FORBIDDEN_SECTION_RE='(禁止事項|やらない|やらないこと|非ゴール|対象外|Out of [Ss]cope|スコープ外|非対象|スコープ ?外|変更しない|追加しない|アンチパターン|Non[- ][Gg]oals?)'

# spec_match_awk PATTERN FILE
# Emit "LN:LINE" only for matches NOT inside a forbidden section and NOT containing negation phrases.
spec_match_awk() {
  local pat="$1" f="$2"
  awk -v pat="$pat" -v neg="$NEG_RE" -v fbsec="$FORBIDDEN_SECTION_RE" '
    /^#{1,6}[[:space:]]/ {
      section_text = $0
      section_forbidden = (section_text ~ fbsec) ? 1 : 0
    }
    {
      if (tolower($0) ~ tolower(pat) || $0 ~ pat) {
        if (section_forbidden) next
        if ($0 ~ neg) next
        printf "%d:%s\n", NR, $0
      }
    }
  ' "$f"
}

spec_inv1() {
  local f="$1"
  local hits
  hits=$(spec_match_awk '(新規? ?(API ?)?endpoint|D1 ?schema|D1 ?migration|新規 ?D1)' "$f")
  if [ -z "$hits" ]; then echo COMPLIANT; else echo "VIOLATION|$hits"; fi
}

spec_inv3() {
  local f="$1"
  local hits
  hits=$(spec_match_awk '(新規 ?primitive|新しい ?primitive|新 primitive)' "$f")
  if [ -z "$hits" ]; then echo COMPLIANT; else echo "VIOLATION|$hits"; fi
}

inv_applies() {
  # Which invariants are relevant per task category.
  local id="$1" inv="$2"
  case "$inv" in
    INV-1) return 0 ;;          # API/schema concern - applies to all
    INV-2) case "$id" in task-08|task-09|task-10|task-11|task-12|task-13|task-14|task-15|task-16|task-17|task-18|task-19|task-20|task-21|task-22) return 0 ;; *) return 1 ;; esac ;;
    INV-3) case "$id" in task-10|task-19|task-11|task-12|task-13|task-14|task-15|task-16|task-17|task-20|task-21|task-22) return 0 ;; *) return 1 ;; esac ;;
    INV-4) return 0 ;;          # data access concern - applies to all
    INV-5) case "$id" in task-12|task-14) return 0 ;; *) return 1 ;; esac ;;  # register / profile flows
    INV-6) return 0 ;;
  esac
}

printf 'task\tINV-1\tINV-2\tINV-3\tINV-4\tINV-5\tINV-6\n' > "$MATRIX"

declare -a VIO_LINES=()

for f in $TASK_FILES; do
  id=$(short_id "$f")
  row="$id"
  for inv in INV-1 INV-2 INV-3 INV-4 INV-5 INV-6; do
    if ! inv_applies "$id" "$inv"; then
      row="$row\tN/A"; continue
    fi
    case "$inv" in
      INV-1)
        res=$(spec_inv1 "$f")
        ;;
      INV-3)
        res=$(spec_inv3 "$f")
        if [ "${res%%|*}" = "COMPLIANT" ] && [ "$(repo_status INV-3)" = "VIOLATION" ]; then
          res="VIOLATION|unexpected primitives listed in outputs/phase-5/primitives-unexpected.txt"
        fi
        ;;
      INV-2|INV-4|INV-5|INV-6)
        res=$(repo_status "$inv")
        ;;
    esac
    cell="${res%%|*}"
    detail="${res#*|}"
    row="$row\t$cell"
    if [ "$cell" = "VIOLATION" ]; then
      if [ "$detail" != "$res" ]; then
        VIO_LINES+=("- **$id / $inv**: $detail")
      else
        VIO_LINES+=("- **$id / $inv**: see grep-evidence.txt")
      fi
    fi
  done
  printf '%b\n' "$row" >> "$MATRIX"
done

#-------------------------------------------------
# violations.md
#-------------------------------------------------
{
  echo "# Invariant Audit — Violations"
  echo ""
  if [ "${#VIO_LINES[@]}" -eq 0 ]; then
    echo "_No violations detected._"
  else
    for line in "${VIO_LINES[@]}"; do echo "$line"; done
  fi
} > "$VIOLATIONS"

#-------------------------------------------------
# INVARIANT-AUDIT.md  (final report)
#-------------------------------------------------
{
  echo "# INVARIANT-AUDIT — UI prototype alignment / MVP recovery"
  echo ""
  echo "_Generated by \`task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/audit-runner.sh\`._"
  echo ""
  echo "## Scope"
  echo ""
  echo "- Tasks audited: task-01 … task-22 (22 specs)"
  echo "- Invariants: INV-1 … INV-6 (see CLAUDE.md / SCOPE.md)"
  echo "- Mode: read-only (no changes to apps/ or packages/)."
  echo ""
  echo "## Invariants"
  echo ""
  echo "| ID | Invariant |"
  echo "|----|-----------|"
  echo "| INV-1 | Existing API endpoints only (no new endpoint / D1 schema change) |"
  echo "| INV-2 | OKLch tokens are canonical (no HEX / bg-[# / text-[# / border-[# in apps/web/src) |"
  echo "| INV-3 | Prototype primitives are canonical (no new primitive beyond claude-design-prototype) |"
  echo "| INV-4 | No direct D1 access from apps/web (binding lives in apps/api) |"
  echo "| INV-5 | Consent keys unified as \`publicConsent\` / \`rulesConsent\` |"
  echo "| INV-6 | GAS prototype is never promoted to production code |"
  echo ""
  echo "## Result matrix (22 × 6)"
  echo ""
  echo "| Task | INV-1 | INV-2 | INV-3 | INV-4 | INV-5 | INV-6 |"
  echo "|------|-------|-------|-------|-------|-------|-------|"
  tail -n +2 "$MATRIX" | while IFS=$'\t' read -r t a b c d e g; do
    echo "| $t | $a | $b | $c | $d | $e | $g |"
  done
  echo ""
  echo "## Aggregated repo-wide checks"
  echo ""
  echo "| Check | Hits | Status |"
  echo "|-------|------|--------|"
  echo "| INV-2 \`bg-[# / text-[# / border-[#\` in apps/web/src | $inv2_hex_hits | $( [ "$inv2_hex_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-2 raw HEX in apps/web/src (excl. tokens.css) | $inv2_hex_hits2 | $( [ "$inv2_hex_hits2" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-3 unexpected primitive files in apps/web/src/components/ui | $inv3_unexpected_hits | $( [ "$inv3_unexpected_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-4 \`D1Database\`/\`env.DB\` in apps/web/src (excl. boundary.spec.ts) | $inv4_d1_hits | $( [ "$inv4_d1_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-4 \`[[d1_databases]]\` in apps/web/wrangler.toml | $inv4_wrangler_hits | $( [ "$inv4_wrangler_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-5 non-canonical \`consent*\` keys | $inv5_consent_other | $( [ "$inv5_consent_other" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo "| INV-6 \`gas-prototype\` under apps/ + packages/ | $inv6_gas_hits | $( [ "$inv6_gas_hits" = "0" ] && echo COMPLIANT || echo VIOLATION ) |"
  echo ""
  echo "## Violations"
  echo ""
  if [ "${#VIO_LINES[@]}" -eq 0 ]; then
    echo "_No violations detected._"
  else
    for line in "${VIO_LINES[@]}"; do echo "$line"; done
  fi
  echo ""
  echo "## Evidence"
  echo ""
  echo "- Raw grep output: \`docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/grep-evidence.txt\`"
  echo "- TSV matrix: \`docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/matrix.tsv\`"
  echo "- Violations detail: \`docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/violations.md\`"
  echo "- Primitive allowlist diff: \`docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/primitives-unexpected.txt\`"
} > "$FINAL_REPORT"

echo "audit-runner: done. report=$FINAL_REPORT"
