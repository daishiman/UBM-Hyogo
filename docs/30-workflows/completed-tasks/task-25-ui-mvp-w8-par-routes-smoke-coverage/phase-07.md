# Phase 7: カバレッジ確認（17 URL smoke + 2 component surfaces × 5 軸）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 7 / カバレッジ確認 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 7 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 7 の判断結果を `outputs/phase-07/coverage-report.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-07/coverage-report.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 7 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-07/coverage-report.md` に集約する。

## 詳細

## 1. 対象範囲

本タスクは docs-only / NON_VISUAL のため、code coverage（line / branch）は **対象外**。
代わりに **matrix coverage**（17 URL smoke + 2 component surfaces × 5 軸 = 95 セル）の埋まり具合を測る。

## 2. coverage 目標

| 軸 | 目標 | 計算 |
|----|------|------|
| status | 17/17（100%） | executable URL entries に expected status / redirect を記載。component-only surfaces は `N/A-runtime-observation` |
| DOM | 19/19（100%） | 全 route に少なくとも 1 つの landmark or testid |
| token | 19/19（100%） | 全 route に「verify-design-tokens 委譲」または runtime 観測点 |
| a11y | 17/19（runtime covered） | `error.tsx` / `loading.tsx` は deterministic trigger 不在のため `N/A + 理由` |
| interaction | 17/19（runtime covered） | component-only surfaces は interaction `N/A` 許容 |
| visual baseline | 4/19（21%） | 4 baseline + 15 routes は `—` で完全列挙 |

## 3. 不足セルの扱い

- `N/A` を入れる場合は隣接の脚注で **理由 + future task 候補** を明記
- 純粋な空欄は禁止

## 4. measurement

```bash
# 95 セル中、N/A 含む記載数を数える（手動で目視 + 簡易 awk）
# 期待: 95 / 95
```
