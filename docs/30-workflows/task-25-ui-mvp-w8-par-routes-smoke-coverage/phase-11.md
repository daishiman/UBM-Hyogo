# Phase 11: 手動テスト（NON_VISUAL）

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
| MR-01 | matrix の 19 行が task-18 §1.1 と完全一致 | 完全一致 | `diff <(matrix の path 抽出) <(task-18 §1.1 抽出)` |
| MR-02 | 4 visual baseline が `playwright/tests/visual/*.spec.ts` の 4 ファイルと一致 | `login / public-top / admin-dashboard / profile` | `ls apps/web/playwright/tests/visual/*.spec.ts` |
| MR-03 | CI gate job 名 3 本が `.github/workflows/playwright-smoke.yml` に存在 | 一致 | `grep -E 'smoke \(chromium\)\|visual \(chromium, 4 screens\)' .github/workflows/playwright-smoke.yml` |
| MR-04 | 共通 3 routes が source path で明示される | error/not-found/loading.tsx | matrix 目視 |
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
