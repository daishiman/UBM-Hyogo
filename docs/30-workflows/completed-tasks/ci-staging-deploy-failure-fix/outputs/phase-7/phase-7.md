# Phase 7: Coverage and risk check

The new focused test covers staging public env parse, production public env parse, and staging full required env parse.

| Risk | Mitigation |
| --- | --- |
| workflow env drifts from `apps/web/wrangler.toml` | values are documented in task-01 spec and validated by focused test |
| task-02 external mutation is mistaken as completed | Phase 11/13 mark it as user-gated runtime pending |
| CI build passes but deploy fails | deploy success remains final runtime gate after token recovery |

