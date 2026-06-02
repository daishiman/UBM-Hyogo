# Lessons Learned: issue-1024 sidebar collapse cookie persistence

## L-I1024-001: First-paint UI state needs a server-readable seed

For UI preferences that change SSR-visible layout, client-only storage causes a first-paint mismatch or flash. A first-party cookie lets `SidebarShell.server.tsx` read the preference with `next/headers` and pass `initialCollapsed` into the client state owner.

## L-I1024-002: Split-token lint bypasses are not an acceptable boundary pattern

`"local" + "Storage"` avoided a substring-based boundary rule while preserving the forbidden mechanism. The elegant fix is to remove the mechanism and use a boundary-compliant persistence path.

## L-I1024-003: Seed the existing state owner instead of adding a second store

`useSidebarState(initialCollapsed)` preserves the hook return shape and keeps drawer/collapse state in one place. Server code owns the initial seed; client code owns user interaction and cookie writes.

