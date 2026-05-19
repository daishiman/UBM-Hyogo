# UI Sanity Visual Review

The local implementation uses existing design token utilities (`bg-surface-2`, `bg-panel`, `border-border`, `text-danger`, `text-text-3`, `bg-accent`) rather than new custom CSS.

Focus is moved to the error heading with `tabIndex={-1}` and `preventScroll: true`. The heading keeps a visible focus outline (`focus:outline-*`) so keyboard and visual QA can inspect the programmatic focus target.

Runtime screenshots remain pending. Any 1x1 placeholder PNG is not counted as visual evidence.
