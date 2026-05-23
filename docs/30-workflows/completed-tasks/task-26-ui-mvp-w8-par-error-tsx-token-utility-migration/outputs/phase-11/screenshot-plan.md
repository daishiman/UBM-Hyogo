# Phase 11 Screenshot Plan

## Targets

| Target | URL / Method | Output |
| --- | --- | --- |
| Not found page | `http://127.0.0.1:3130/nonexistent-task26-screenshot` | `screenshots/not-found-desktop.png` |
| Route error boundary | component render test | `apps/web/app/__tests__/error.component.spec.tsx` |
| Loading state | component render test | `apps/web/app/__tests__/error.component.spec.tsx` |

## Boundary

The local runtime screenshot captures the reachable App Router `not-found` surface. `error.tsx` and `loading.tsx` are validated by deterministic DOM render assertions because forcing stable route error/loading states would require task-local test routes that are outside the consumer migration scope.
