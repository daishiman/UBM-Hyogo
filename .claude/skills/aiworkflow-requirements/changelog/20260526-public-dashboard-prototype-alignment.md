# public-dashboard-prototype-alignment (2026-05-26)

Synced `docs/30-workflows/public-dashboard-prototype-alignment/` as `spec_created / implementation / VISUAL / execution_pending`.

## Changes

- Added root/output artifacts mirror and Phase 12 strict 7 outputs for the workflow root.
- Registered the workflow in quick-reference, resource-map, task-workflow-active, and artifact inventory.
- Kept implementation, local visual capture, staging refresh, commit, push, and PR user-gated.
- Clarified that Phase 11 screenshots and local test evidence are pending and not PASS.

## Boundary

This sync formalizes the public home `/` prototype alignment implementation contract. It does not apply `apps/web` code changes in this cycle.

## 2026-05-26 (post-review) — workflow_state 昇格 + lessons 追加

- workflow_state を `spec_created` → `implementation_reviewed` に昇格（root/output artifacts.json、index.md、phase-12-documentation.md、outputs/phase-12/*.md 7 ファイル）。実装と unit test レビューは完了し、Phase 11 PNG / staging deploy / commit / push / PR のみ user-gated。
- `lessons-learned/public-dashboard-prototype-alignment-2026-05.md` を新規追加（L-PDPA-001..007、7 件）。
  - L-PDPA-001 既存 variant 残し新 variant 追加
  - L-PDPA-002 空状態は section header 残し中身だけ EmptyState
  - L-PDPA-003 prototype 固定値は const 化 + 出所コメント
  - L-PDPA-004 e2e empty-state は `/__test__/<scope>` toggle endpoint + 共有 state
  - L-PDPA-005 `/__test__/reset` への state 追加忘れ防止（standalone+inline 2 経路点検）
  - L-PDPA-006 `PLAYWRIGHT_EVIDENCE_TASK` ベース evidence dir 分岐の 3 点セット
  - L-PDPA-007 `legacy-public.css` を workflow-slug ブロックの token bridge として使う条件
- `task-specification-creator` の `patterns-lessons-and-pitfalls.md` 末尾に汎化追記 2 件（P-PROTO-ALIGN-001 / P-E2E-EMPTY-TOGGLE-001）。
- Boundary 再宣言: 実装 / unit test 実装完了。Phase 11 PNG / staging deploy / commit / push / PR は引き続き user-gated。
