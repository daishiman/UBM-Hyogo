# Phase 02 Design

`apps/web/src/lib/a11y/useAutoFocusOnMount.ts` owns one behavior: after mount, call `ref.current?.focus({ preventScroll: true })` once. The hook has no options parameter because the task is specifically about error boundary h1 announcement, where scroll prevention is the stable invariant.

Each boundary keeps its own logging/UI responsibility. Callers create `useRef<HTMLHeadingElement>(null)`, call `useAutoFocusOnMount(headingRef)`, and attach `ref={headingRef}` with `tabIndex={-1}` to h1.

The design intentionally avoids focus trap, return focus, modal behavior, API changes, and styling changes.
