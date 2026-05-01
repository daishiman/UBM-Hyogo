# Release Tag Evidence

Status: spec_created  
Runtime evidence: pending_user_approval

## Tag

| Field | Value |
| --- | --- |
| `RELEASE_TAG` | TBD at execution |
| Expected format | `vYYYYMMDD-HHMM` |
| Main commit hash | TBD at execution |
| Tag message | TBD at execution |
| Remote verification | TBD at execution |
| GitHub release URL | TBD at execution, optional |

## Command Log Template

```bash
git rev-parse HEAD
# <commit_hash> -- TBD at execution

git log --oneline -1
# <commit_hash> <message> -- TBD at execution

git tag -a "$RELEASE_TAG" -m "Production release $RELEASE_TAG"
git push origin "$RELEASE_TAG"
git ls-remote --tags origin | grep "$RELEASE_TAG"
```

## Judgment

Runtime judgment: TBD at execution. Do not mark PASS until the remote tag has been verified.
