# PR Title

feat(observability): Cloudflare Audit Logs cold storage / R2 export (Refs #514)

# PR Body

## Summary

- Add Issue #514 cold storage / R2 export implementation contract.
- Daily export cadence: `0 2 * * *`, window `[now - 29d, now - 26d)`, completed partition skip.
- Runtime approval order: G1 R2/bucket/secret -> G2 D1 migration -> G3-prod first export + restore drill -> G4 PR.

## Refs

Refs #514

## Test plan

- [ ] Phase 12 strict 7 outputs present.
- [ ] G2: D1 migration apply evidence captured.
- [ ] G3-prod: first daily export and restore drill evidence captured.
- [ ] secret hygiene grep match 0.
