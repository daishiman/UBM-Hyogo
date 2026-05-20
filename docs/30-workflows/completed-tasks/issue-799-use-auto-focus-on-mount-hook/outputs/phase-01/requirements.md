# Phase 01 Requirements

Issue #799 is a closed follow-up for extracting `useAutoFocusOnMount` from the root error boundary and applying the same focus transfer pattern across root, login, profile, and admin error boundaries.

The source unassigned spec expected i05/i06 duplication and an optional `FocusOptions` API. Current code showed only root had focus transfer while login/profile/admin were missing it, so this workflow narrows the hook API and broadens the rollout to four real boundaries.

Acceptance requires no API/D1/UI text changes, `focus({ preventScroll: true })`, h1 `tabIndex={-1}`, component coverage for all four boundaries, and same-wave requirements/index sync.
