# Phase 2 Design

The matrix is a single markdown artifact with CI gate references, a legend, a 19-row coverage table, axis totals, drift notes, and future candidates.

The design separates URL routes from component-only surfaces so the task does not claim runtime evidence for `error.tsx` or `loading.tsx` before deterministic fixtures exist.
