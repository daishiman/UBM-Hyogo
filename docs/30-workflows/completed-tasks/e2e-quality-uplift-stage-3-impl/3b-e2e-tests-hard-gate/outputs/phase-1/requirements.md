# Phase 1 — 要件定義 evidence

`phase-1.md` 記載の要件をそのまま採用。`e2e-tests.yml` を `pull_request: { branches: [dev, main] }` トリガの hard gate に昇格させ、line coverage 80% / `@critical-route` smoke fail-fast / artifact upload を 1 job (`e2e-tests-coverage-gate`) に集約する。3a / 3c はスコープ外。
