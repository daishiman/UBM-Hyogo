# Visual verification skip

This task is `implementation / NON_VISUAL`.

The local implementation changes one GitHub Actions workflow line and adds documentation/spec
evidence. It does not change UI routes, components, styles, screenshots, or browser behavior.

Required alternative evidence:

- YAML diff showing only `environment: production` removal.
- User-gated repository secret and variable mirroring record.
- `workflow_dispatch` dry-run success after approval and push.
- Six consecutive scheduled run successes after approval and merge.

Runtime evidence is pending because push, PR, secret mutation, and workflow execution are
explicitly user-gated.
