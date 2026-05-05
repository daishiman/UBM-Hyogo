# Phase 7 Main

Status: `COMPLETED`

Phase 4 wave-2 backlog inventory と Phase 6 gap mapping を統合し、`non-visual-backlog.md` に integration / e2e / polish 委譲分を集約、`gap-mapping-resolved.md` で最終 gap 分類を確定。

## 統合方針

- gap-class が `integration-required` / `e2e-required` のものは NON_VISUAL backlog 行に昇格。
- gap-class `mock-coverage-only` は polish-only（または除外）として記録。
- `branch-only-gap` / `under-tested-unit` は wave-3-unit 候補として gap-mapping-resolved に残す。
- wave-2 phase-12 抽出由来の項目は `source-task` を保持して traceability を維持。
