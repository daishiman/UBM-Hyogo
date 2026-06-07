#!/usr/bin/env bash
set -euo pipefail

MODE="all"
ROOT="${VERIFY_NO_LOCALHOST_ROOT:-.}"

usage() {
  cat <<'USAGE'
usage: bash scripts/verify-no-localhost-bake.sh [--src-only|--bundle-only] [--self-test] [--root <path>]

Fails when apps/web source or built client bundles contain localhost / 127.0.0.1
API endpoints. Local-only fallback is allowed only when the matching line or the
previous line contains: localhost-allow:local-fallback
USAGE
}

run_self_test() {
  local tmp dirty clean allow
  tmp="$(mktemp -d)"
  trap "rm -rf '$tmp'" EXIT
  dirty="$tmp/dirty"
  clean="$tmp/clean"
  allow="$tmp/allow"
  mkdir -p "$dirty/apps/web/src/lib" "$clean/apps/web/src/lib" "$allow/apps/web/src/lib"
  printf '%s\n' 'export const u = "http://127.0.0.1:8787/me";' > "$dirty/apps/web/src/lib/bad.ts"
  printf '%s\n' 'export const u = "https://api.example.workers.dev/me";' > "$clean/apps/web/src/lib/ok.ts"
  printf '%s\n%s\n' '// localhost-allow:local-fallback' 'export const u = "http://localhost:8787";' > "$allow/apps/web/src/lib/ok.ts"
  if bash "$0" --src-only --root "$dirty" >/dev/null 2>&1; then
    echo "verify-no-localhost-bake: self-test dirty fixture was not detected" >&2
    exit 1
  fi
  bash "$0" --src-only --root "$clean" >/dev/null
  bash "$0" --src-only --root "$allow" >/dev/null
  echo "verify-no-localhost-bake: self-test passed"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --src-only) MODE="src"; shift ;;
    --bundle-only) MODE="bundle"; shift ;;
    --self-test) run_self_test; exit 0 ;;
    --root) ROOT="${2:?--root requires a path}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "verify-no-localhost-bake: unknown argument: $1" >&2; usage >&2; exit 64 ;;
  esac
done

PATTERN='(https?://)?(localhost|127\.0\.0\.1):(8787|8888)'
STATUS=0

scan_file() {
  local file="$1"
  local line_no line prev current
  while IFS=: read -r line_no line; do
    current="$line"
    prev=""
    if [[ "$line_no" =~ ^[0-9]+$ ]] && (( line_no > 1 )); then
      prev="$(sed -n "$((line_no - 1))p" "$file")"
    fi
    if [[ "$current" == *"localhost-allow:local-fallback"* || "$prev" == *"localhost-allow:local-fallback"* ]]; then
      continue
    fi
    printf 'localhost bake detected: %s:%s\n' "$file" "$line_no" >&2
    STATUS=1
  done < <(grep -nE "$PATTERN" "$file" || true)
}

scan_tree() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  while IFS= read -r -d '' file; do
    scan_file "$file"
  done < <(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \) \
    ! -path '*/__tests__/*' ! -name '*.spec.ts' ! -name '*.spec.tsx' -print0)
}

if [[ "$MODE" == "all" || "$MODE" == "src" ]]; then
  scan_tree "$ROOT/apps/web/src"
  scan_tree "$ROOT/apps/web/app"
fi

if [[ "$MODE" == "all" || "$MODE" == "bundle" ]]; then
  # spec task-c §2.3: 対象はブラウザへ配信される client bundle のみ
  # (.open-next/assets と .next/static)。server-functions / handler.mjs は
  # サーバー側で local fallback 定数 (transport.ts LOCAL_API_FALLBACK_BASE_URL)
  # を正当に含み、圧縮後は allowlist コメントが失われるため対象外とする。
  scan_tree "$ROOT/apps/web/.open-next/assets"
  scan_tree "$ROOT/apps/web/.next/static"
fi

exit "$STATUS"
