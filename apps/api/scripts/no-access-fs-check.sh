#!/usr/bin/env bash
# 05b AC-7: 不変条件 #9 fs-check
# - apps/web 配下に /no-access ルートが存在しないこと
# - apps/web から D1 (process.env.DB / .env() の DB binding) を直接参照していないこと
# - apps/api 経由 fetch のみが使われていること

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
WEB_DIR="${ROOT_DIR}/apps/web"

fail=0

# 1. /no-access route が存在しない
if find "${WEB_DIR}/app" -type d -name "no-access" 2>/dev/null | grep -q .; then
  echo "FAIL: apps/web/app 配下に no-access ディレクトリが存在します (不変条件 #9)" >&2
  fail=1
fi

# 2. /no-access への redirect / Link が存在しない
if grep -RIn --include='*.ts' --include='*.tsx' -E '"/no-access"|`/no-access`' "${WEB_DIR}/app" "${WEB_DIR}/src" 2>/dev/null; then
  echo "FAIL: /no-access への参照が apps/web に存在します (不変条件 #9)" >&2
  fail=1
fi

# 3. apps/web から D1 binding を直接読まない (env.DB / context.env.DB / DB as D1Database)
if grep -RIn --include='*.ts' --include='*.tsx' --exclude-dir='__tests__' --exclude='*.test.ts' --exclude='*.test.tsx' -E 'env\.DB|env\["DB"\]|D1Database' "${WEB_DIR}/app" "${WEB_DIR}/src" 2>/dev/null; then
  echo "FAIL: apps/web で D1 binding を直接参照しています (不変条件 #5)" >&2
  fail=1
fi

if [ $fail -eq 0 ]; then
  echo "OK: AC-7 fs-check passed (no /no-access route, no D1 direct access)"
fi
exit $fail
