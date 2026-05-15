#!/usr/bin/env bash
# scripts/lib/ci-shell-prelude.sh
# CI / local shell の共通 prelude。source 専用（直接実行禁止）。
#
# 使い方（呼び出し側 1 行目 shebang 直後）:
#   #!/usr/bin/env bash
#   # shellcheck source=lib/ci-shell-prelude.sh
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/ci-shell-prelude.sh"

# --- guard against direct execution -----------------------------------------
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "ci-shell-prelude.sh must be sourced, not executed" >&2
  exit 2
fi

# --- shell hardening --------------------------------------------------------
set -euo pipefail
umask 077

# --- GitHub Actions annotation helpers --------------------------------------
gh_notice()  { printf '::notice::%s\n'  "$*"; }
gh_warning() { printf '::warning::%s\n' "$*" >&2; }
gh_error()   { printf '::error::%s\n'   "$*" >&2; }

# --- assertion helpers ------------------------------------------------------
# assert_jq <file> <jq_expr>
#   jq -er で expr を評価し、失敗時 gh_error + exit 1。
assert_jq() {
  local file="$1"
  local expr="$2"
  if ! jq -er "$expr" "$file" >/dev/null; then
    gh_error "assert_jq failed: file=$file expr=$expr"
    exit 1
  fi
}

# awk_compare_ge <a> <b>
#   a >= b を awk で評価。0 = true / 1 = false。
awk_compare_ge() {
  awk -v a="$1" -v b="$2" 'BEGIN { exit !(a + 0 >= b + 0) }'
}
