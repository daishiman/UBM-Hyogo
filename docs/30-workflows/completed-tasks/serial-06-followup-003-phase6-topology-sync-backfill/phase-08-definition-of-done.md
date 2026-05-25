# Phase 8 — Definition of Done

## Issue #884 DoD 対応表

| Issue #884 DoD | 本タスクでの対応 | 検証コマンド |
|---------------|---------------|------------|
| Phase 6 spec 内の path を `apps/web/playwright/tests/...` に統一 | 既に完了済み（無作業） | `find docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding -maxdepth 1 -name 'phase-*.md' -print0 \| xargs -0 grep -n "apps/web/tests/e2e"` → hit 0 |
| Phase 6 spec §3 に SSR fetch intercept 制約 note 追記 | T1 で実施 | V1（Phase 6 §3 検証） |
| `patterns-lessons-and-pitfalls.md` に 2 entry 追加 | T3 で実施（cross-link 集約方式） | V3 |
| `verify:phase12-compliance` pass | T5 / Phase 7 で実施 | `pnpm verify:phase12-compliance` exit 0 |

## 追加 DoD（本タスク独自）

- [x] Phase 10 spec line 130/141 の `page.route()` 文言 backfill 完了（T2 / V2）
- [x] unassigned-task の `status: consumed` / `canonical_workflow:` pointer 追記完了（T4 / V4）
- [x] `outputs/artifacts.json` 生成・zod schema pass
- [x] `outputs/phase-12/phase12-task-spec-compliance-check.md` 生成・canonical 9 headings 準拠
- [x] `bash scripts/verify-pr-ready.sh` exit 0
- [x] indexes drift 0
- [x] path drift grep（`apps/web/tests/e2e`）結果を Phase 12 evidence に記録
- [x] Issue #884 は OPEN のまま保持（ユーザー指示）

## サイクル完了判定

本タスクは 1 サイクル内（= 単一 PR）で T1〜T6 すべて完了する。先送り項目なし（CONST_005）。
