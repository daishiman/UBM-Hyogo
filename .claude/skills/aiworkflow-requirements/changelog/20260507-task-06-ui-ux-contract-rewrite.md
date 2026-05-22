# 2026-05-07 task-06 UI/UX contract rewrite

`docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/` を `implemented-local / implementation / NON_VISUAL` として同期した。

- `docs/00-getting-started-manual/specs/09-ui-ux.md` を契約のみへ全面書き換え。
- 19+1 route entries、13 primitives、feature components、login 5 状態、server-pending、dialog / drawer / form / live region a11y、token prefix を正本化。
- 視覚詳細値、prototype 行範囲、token 値は 09a..09h と Storybook VRT へ委譲。
- task-06 の diff scope は `09-ui-ux.md` M と workflow package A のみに固定し、attendance 系 workflow の純削除混入は参照破壊として復元した。
