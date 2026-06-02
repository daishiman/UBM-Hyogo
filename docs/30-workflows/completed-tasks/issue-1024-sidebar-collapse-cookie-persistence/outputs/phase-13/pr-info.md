# PR Info — issue-1024

PR not created.

Reason: Phase 13 external operations are user-gated by task policy. This file is a required placeholder documenting the boundary.

Suggested PR title:

`Refs #1024 sidebar collapse cookie persistence`

Suggested PR body bullets:

- Persist unified sidebar collapsed state in a first-party cookie.
- Seed SSR shell state from `next/headers` cookies to avoid first-paint flicker.
- Remove the `localStorage` boundary-lint workaround from shell state management.
- Add focused Vitest coverage for cookie parsing/writing, hook behavior, and server propagation.

