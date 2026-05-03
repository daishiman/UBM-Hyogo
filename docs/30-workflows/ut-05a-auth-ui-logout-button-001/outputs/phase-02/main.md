# Phase 2 output

Status: completed in current improvement cycle.

- `SignOutButton` is the single client component that calls Auth.js `signOut`.
- `MemberHeader` is reused by `(member)` layout and `/profile`.
- `AdminSidebar` keeps existing navigation and adds a footer sign-out control.
- `/profile` is a protected URL outside the `(member)` route group; it is handled explicitly rather than by route movement.
