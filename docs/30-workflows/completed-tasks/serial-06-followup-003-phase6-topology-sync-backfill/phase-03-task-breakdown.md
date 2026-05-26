# Phase 3 — Task Breakdown

| # | Task | 対象ファイル | 変更種別 | 依存 |
|---|------|------------|---------|------|
| T1 | Phase 6 spec §3 末尾に SSR fetch intercept 制約 note を 1 ブロック追加 | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md` | edit (insert) | なし |
| T2 | Phase 10 spec line 130/141 の `page.route()` 表現を「mockApi fixture（戦略B）」に backfill | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md` | edit (replace) | なし |
| T3 | `patterns-lessons-and-pitfalls.md` に SSR fetch + page.route / Playwright testDir の 2 cross-link entry を追加（本文は SSOT reference へ誘導） | `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | edit (append) | なし |
| T4 | unassigned-task を consumed 化（frontmatter に `status: consumed` / `canonical_workflow:` 追記） | `docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md` | edit (frontmatter) | T1-T3 完了後 |
| T5 | Phase 12 strict 7 / compliance check / artifacts.json 生成 | 本 workflow root 配下 | new file | T1-T4 完了後 |
| T6 | drift grep 検証 / `verify:phase12-compliance` / `gate-metadata:validate` 実行 | — | verify | T5 完了後 |

実行順序: **T1, T2, T3 は並列可** → T4 → T5（生成） → T6（検証） → Phase 13。
全タスクは同 1 PR / 1 サイクル内で完了する（CONST_005）。
