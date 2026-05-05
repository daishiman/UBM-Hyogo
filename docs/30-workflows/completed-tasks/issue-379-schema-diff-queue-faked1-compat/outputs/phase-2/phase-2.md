# Phase 2: stale/current design

## Design Decision

Do not implement the original A+B fix plan. The focused contract test is already GREEN.

## Options

| Option | Decision | Reason |
| --- | --- | --- |
| Extend `fakeD1.ts` parser | Reject | No current failing contract justifies parser complexity. |
| Edit `schemaDiffQueue.test.ts` seed | Reject | Current assertions already pass. |
| Rewrite repository SQL | Reject | Production behavior must not change for a stale local failure. |
| Reclassify workflow as verification close-out | Adopt | Minimal complexity and matches evidence. |

## Output Contract

The workflow must materialize baseline / after logs, coverage snapshot, and strict Phase 12 close-out files.
