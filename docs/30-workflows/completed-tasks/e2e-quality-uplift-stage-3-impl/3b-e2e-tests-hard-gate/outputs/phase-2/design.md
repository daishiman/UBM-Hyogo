# Phase 2 — 設計 evidence

`phase-2.md` 採用。reporter 配列末尾に `monocart-reporter` を追記、`scripts/coverage-gate-e2e.sh` を新規作成、workflow を 1 job 構成（smoke → full e2e → coverage gate → artifact）に書換。`name:` と `jobs.<id>.name:` を `e2e-tests-coverage-gate` に揃え branch protection context との完全一致を確保。
