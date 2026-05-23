# Phase 8: リファクタリング（重複除去）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 8 / リファクタリング |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 8 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 8 の判断結果を `outputs/phase-08/refactor-report.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-08/refactor-report.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 8 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-08/refactor-report.md` に集約する。

## 詳細

## 1. 対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| SMOKE-COVERAGE-MATRIX.md 内の axe profile 記述 | 各行に展開 | 凡例 section で `A11Y-DEFAULT` として 1 回宣言、行は参照 | 19 surface 行に同一文字列を繰り返さない |
| token 軸の SSOT 言及 | 行ごとに 3 path | 凡例で `TOKEN-SSOT` として宣言、行は参照 | 同上 |
| visual baseline 列 | 4 routes に長文記載 | `✓ <baseline name>` の短形に統一 | 19 surface 行 horizontally compact |
| component-only surfaces の observability | 各行で詳述 | section 6 に集約、行は短縮 | 表幅縮小 |

## 2. 追加リファクタなし

code 変更なしのため、source side のリファクタリングは対象外。

## 3. 完了条件

- matrix が 1 画面内（端末 80 col 想定）で読みやすい
- 凡例の参照識別子（`A11Y-DEFAULT`, `TOKEN-SSOT` 等）が 19 surface 行内で重複なく使われる
