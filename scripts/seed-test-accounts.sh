#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/seed-test-accounts.sh --env local|staging --action apply|cleanup

Production is intentionally unsupported.
USAGE
}

ENVIRONMENT=""
ACTION="apply"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="${2:-}"
      shift 2
      ;;
    --action)
      ACTION="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 64
      ;;
  esac
done

if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "staging" ]]; then
  echo "Refusing to seed test accounts outside local/staging: ${ENVIRONMENT:-<unset>}" >&2
  exit 2
fi

if [[ "$ACTION" != "apply" && "$ACTION" != "cleanup" ]]; then
  echo "Unsupported action: $ACTION" >&2
  exit 64
fi

SQL_FILE="apps/api/migrations/seed/test-accounts-seed.sql"
if [[ "$ACTION" == "cleanup" ]]; then
  SQL_FILE="apps/api/migrations/seed/test-accounts-cleanup.sql"
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [[ "$ENVIRONMENT" == "local" ]]; then
  pnpm --filter @ubm-hyogo/api exec wrangler d1 execute DB --local --file "$SQL_FILE"
else
  # staging の実 D1 へ投入する。
  # - 認証は scripts/cf.sh が op run 経由で CLOUDFLARE_API_TOKEN を動的注入する（wrangler 直呼び禁止）
  # - cf.sh は repo root で wrangler を起動するため --config を明示する
  # - --remote を付けないと miniflare のローカル DB に流れるため必須
  # - production は冒頭ガードで到達不可（staging 限定）
  bash "$REPO_ROOT/scripts/cf.sh" d1 execute DB \
    --env staging \
    --remote \
    --config "$REPO_ROOT/apps/api/wrangler.toml" \
    --file "$SQL_FILE" \
    --yes
fi
