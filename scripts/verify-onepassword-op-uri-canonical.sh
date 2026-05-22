#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/verify-onepassword-op-uri-canonical.sh [--target <path> ...]

Checks operational surfaces for legacy Cloudflare deploy-token op:// paths.
The default target set excludes workflow docs because they may intentionally
retain legacy strings as inventory or migration examples.
USAGE
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

targets=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || { echo "::error:: --target requires a path" >&2; exit 2; }
      targets+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "::error:: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ${#targets[@]} -eq 0 ]]; then
  targets=(
    ".env.example"
    "docs/runbooks/cloudflare-waf-operations.md"
    ".claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md"
    "scripts/cf.sh"
    "apps/web/.dev.vars.example"
  )
fi

deny_re='op://(Cloudflare/API Token/credential|Vault/Cloudflare/api_token|UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN|Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN)'

existing_targets=()
for target in "${targets[@]}"; do
  [[ -e "$target" ]] && existing_targets+=("$target")
done

if [[ ${#existing_targets[@]} -eq 0 ]]; then
  echo "::error:: no target files exist" >&2
  exit 2
fi

hits="$(grep -nE "$deny_re" "${existing_targets[@]}" || true)"
if [[ -n "$hits" ]]; then
  echo "::error:: legacy Cloudflare deploy-token op:// path remains:" >&2
  echo "$hits" >&2
  exit 1
fi

echo "OK: no legacy Cloudflare deploy-token op:// paths remain in operational surfaces"
