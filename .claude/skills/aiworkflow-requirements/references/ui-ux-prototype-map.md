# UI/UX prototype map

## Status

| item | value |
|------|-------|
| canonical workflow | `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/` |
| canonical artifact | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| state | `spec_created / docs-only / NON_VISUAL` |
| verification | `scripts/verify-09a-prototype-line-ranges.sh` |

## Contract

`09a-prototype-map.md` maps the frozen design prototype sources to production implementation targets.
It covers UI primitives, all 19 routes, shell/chrome, 09c-09h follow-on spec files, rejection rules, and a line range ledger.

## Boundaries

- Prototype JSX files remain frozen and are not modified by task-07.
- Token values stay in task-08 / `09b-design-tokens.md`.
- Props and runtime state stay in `09-ui-ux.md` and API specs.
- New primitives are not introduced for prototype-missing screens.
- EDITMODE-only elements (`TweaksPanel`, `AvatarStoreProvider`, `data-theme="warm"`, `data-theme="cool"`) are rejected.

## Downstream Consumers

| consumer | lookup |
|----------|--------|
| task-10 | §2 primitives and §6 line ledger |
| task-11..17 | §3 routes and §5 derivation rules |
| task-19..22 | §4.2 prototype source to 09c-09h spec mapping |

## Validation

Run:

```bash
bash scripts/verify-09a-prototype-line-ranges.sh
```

Expected result:

```text
OK: 09a-prototype-map.md verifier passed
```
