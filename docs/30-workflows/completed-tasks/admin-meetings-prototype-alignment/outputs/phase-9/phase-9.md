# Phase 9: Quality Assurance

## 9.1 目的

prototype alignment の品質 gate を、見た目・アクセシビリティ・token・API 不変の 4 軸で固定する。
staging visual evidence は user-gated なので、現サイクルでは取得計画と失敗時の扱いを明確化する。

## 9.2 実行タスク

1. OKLch token grep gate を Task A/B 両方に適用する。
2. `AdminPageHeader` / `AdminSectionCard` / `AdminTable` / `AdminEmptyState` 採用を grep と focused spec で検証する。
3. `/admin/meetings` と `/admin/meetings/[id]` の screenshot plan を Phase 11 に固定する。

## 9.3 参照資料

- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/admin-ui-prototype-alignment/`

## 9.4 成果物

| Gate | Command / Evidence |
| --- | --- |
| token gate | `grep -rnE '#[0-9a-fA-F]{3,6}' ...` |
| primitive adoption | grep + focused Vitest |
| visual states | `outputs/phase-11/screenshot-plan.json` |
| API/DB invariant | `git diff dev -- apps/api/src/routes/admin/meetings.ts` empty |

## 9.5 統合テスト連携

実装後は `mise exec -- pnpm typecheck`, `mise exec -- pnpm lint`, `mise exec -- pnpm --filter @ubm-hyogo/web build` を実行する。
現サイクルでの QA は仕様 package の整合確認までとする。

## 9.6 完了条件

- [x] quality gate が実装後に再現可能な command として記録されている。
- [x] visual runtime pending と spec completeness を分離している。
- [x] API / DB 不変の検査が明記されている。
