# Test Matrix

| Area | Cases |
| --- | --- |
| Repository | empty ids, 0/1/N attendance rows, deleted meeting excluded, duplicate row ordering, 100+ ids chunk |
| Builder | injected attendance map is applied, missing member entry becomes `[]`, existing 02a fields unchanged |
| API | `/me/profile` or equivalent returns real attendance rows |
| Regression | 02a repository tests remain green |
| Gates | `pnpm typecheck`, `pnpm lint`, `pnpm build` |
