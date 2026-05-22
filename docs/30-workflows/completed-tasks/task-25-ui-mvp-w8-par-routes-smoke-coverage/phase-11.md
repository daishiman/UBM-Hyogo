# Phase 11: 手動テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 11 / 手動テスト |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 11 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 11 の判断結果を `outputs/phase-11/manual-test-result.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-11/manual-test-result.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 11 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-11/manual-test-result.md` に集約する。

## 詳細

## NON_VISUAL 宣言

| 項目 | 値 |
|------|----|
| タスク種別 | docs-only |
| 非視覚的理由 | matrix 文書の作成のみで UI / レンダリング変更ゼロ |
| 代替証跡 | `outputs/phase-11/manual-test-result.md`（文書整合チェックリスト） |
| Phase 11 スクリーンショット | **N/A**（NON_VISUAL のため `screenshots/.gitkeep` 削除） |

## 1. 証跡主ソース

- 自動テスト名: なし（新規 spec なし）
- 既存テスト件数: 影響なし（既存 `full-smoke.spec.ts` / `visual/*.spec.ts` は本タスクで変更しない）
- 文書整合チェック: Phase 4 T1〜T7 + Phase 6 T8〜T11

## 2. 手動 review checklist

| ID | 観点 | 期待 | 実行コマンド |
|----|------|------|--------------|
| MR-01 | matrix の 19 surface 行が task-18 §1.1 と完全一致 | 完全一致 | `diff <(matrix の path 抽出) <(task-18 §1.1 抽出)` |
| MR-02 | 4 visual baseline が `playwright/tests/visual/*.spec.ts` の 4 ファイルと一致 | `login / public-top / admin-dashboard / profile` | `ls apps/web/playwright/tests/visual/*.spec.ts` |
| MR-03 | CI gate job 名 3 本が `.github/workflows/playwright-smoke.yml` に存在 | 一致 | `grep -E 'smoke \(chromium\)\|visual \(chromium, 4 screens\)' .github/workflows/playwright-smoke.yml` |
| MR-04 | not-found URL smoke と component-only surfaces が source path で明示される | not-found / error.tsx / loading.tsx | matrix 目視 |
| MR-05 | future task 候補（U1〜U3）が matrix section 8 に列挙 | 3 件 | matrix 目視 |

## 3. 実施情報

| 項目 | 値 |
|------|----|
| 実施者 | （Phase 11 実施時に記入） |
| 実施日 | （Phase 11 実施時に記入） |
| ブランチ | `feat/ui-mvp-task-25-routes-smoke-coverage` |
| commit hash | （Phase 11 実施時に記入） |

## 4. 仕様判断根拠

| SD-NNN | 判断 | 根拠 |
|--------|------|------|
| SD-001 | スクリーンショット不採取 | docs-only タスクで UI 変更ゼロ |
| SD-002 | 自動テスト追加なし | matrix は documentation で、CI gate は task-18 が担う |
| SD-003 | visual baseline 拡張は本タスク外 | task-18 §2.2 で MVP 後タスクと明記済み（U1 として未タスク化） |
| SD-004 | error / loading observability の standardize は本タスク外 | observability 戦略確立は別タスク（U2 / U3） |
