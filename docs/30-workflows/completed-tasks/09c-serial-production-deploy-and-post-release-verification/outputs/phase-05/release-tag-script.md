# Release Tag Script

Status: spec_created  
Runtime evidence: pending_user_approval

This file is a command template. It has not been executed.

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ -n "${1:-}" ]; then
  TAG="$1"
else
  TAG="v$(date +%Y%m%d-%H%M)"
fi

if ! [[ "$TAG" =~ ^v[0-9]{8}-[0-9]{4}$ ]]; then
  echo "ERROR: tag format must be vYYYYMMDD-HHMM (e.g., v20260426-1530)" >&2
  exit 1
fi

git fetch origin main
git checkout main
git pull origin main
COMMIT=$(git rev-parse HEAD)
echo "Tagging commit: ${COMMIT}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: tag already exists locally: ${TAG}" >&2
  exit 1
fi

if git ls-remote --tags origin | grep -q "refs/tags/${TAG}$"; then
  echo "ERROR: tag already exists on origin: ${TAG}" >&2
  exit 1
fi

git tag -a "$TAG" -m "Production release ${TAG}"
git push origin "$TAG"
git ls-remote --tags origin | grep "refs/tags/${TAG}$" >/dev/null

echo "SUCCESS: Tag ${TAG} pushed for commit ${COMMIT}"
```

## Evidence Template

| Field | Value |
| --- | --- |
| Release tag | TBD at execution |
| Main commit | TBD at execution |
| Local tag command exit code | TBD at execution |
| Remote tag verification | TBD at execution |
| GitHub release URL | TBD at execution, optional |

## Rules

- Use `vYYYYMMDD-HHMM`.
- Treat release tags as immutable.
- Do not force-push or overwrite a tag.
- For an incident replacement, create a new tag with a new HHMM and document the relationship.
