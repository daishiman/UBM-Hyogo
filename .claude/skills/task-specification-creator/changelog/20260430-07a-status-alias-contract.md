---
timestamp: 2026-04-30T00:00:00Z
branch: task-20260430-090915-wt-3
author: codex
type: changelog
---

# task-specification-creator changelog (2026-04-30)

07a tag assignment queue resolve の Phase 12 skill-feedback-report を反映。

## Changed

- `references/phase-template-core.md` の Phase 2 ポイントに、既存 DB / API / shared schema の enum や status を拡張・alias する場合のガードを追加。
- 仕様語と実装語の対応表、backend route / web client / shared zod / type / docs の追従対象を Phase 2 で明示する運用にした。

## Reason

- 07a では仕様語 `candidate/confirmed/rejected` と既存実装語 `queued/reviewing/resolved` が混在し、admin web client の body 契約や shared schema 追従漏れが起きやすかった。
- 実装前の Phase 2 で対応表と追従対象を固定すると、同種の drift を短く解消できる。
