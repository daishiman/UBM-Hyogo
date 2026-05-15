[実装区分: 実装仕様書]

# Phase 10: 最終レビュー

## 目的

Issue #696 の受入条件と本ワークフローの DoD をクロスチェックし、PR 作成可否を判定する。

---

## 入力

- 各 Phase outputs
- Issue #696 本文

---

## 1. Issue #696 受入条件チェック

| # | 条件 | 充足判定 | 証跡 |
|---|------|----------|------|
| 1 | 17 URL routes × 3 viewport = 51 screenshot baseline が生成されている | `runtime_pending` | 実装サイクルで `outputs/phase-7/coverage.md` §1〜3 に実測転記 |
| 2 | `visual-full-chromium` project が playwright.config.ts に追加されている | `completed` | `apps/web/playwright.config.ts` |
| 3 | screenshot drift 対策（ubuntu-latest / animations disabled / fonts 安定化）が実装されている | `completed` | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` |
| 4 | nightly と PR path-filter trigger が分離された workflow として実装されている | `completed` | `.github/workflows/playwright-visual-full.yml` |
| 5 | baseline update workflow が user approval gate で保護されている | `completed` | `.github/workflows/playwright-visual-baseline-update.yml` |

---

## 2. 本ワークフロー DoD クロスチェック

| Phase | DoD | 判定 |
|-------|-----|------|
| 1 | 17 routes / 3 viewport / 51 baseline 命名規約を確定 | `completed` |
| 2 | playwright config diff / spec / workflow yaml の構造確定 | `completed` |
| 3 | CI 時間試算 / flaky 対策評価 / required check 可否判定 | `completed` |
| 4 | baseline 取得手順 / mask 方針 / retry 戦略 | `completed` |
| 5 | 実装 + commit 単位 + ロールバック手順 | `completed` |
| 6 | data-testid / data-visual-mask / auth fixture 確認 | `completed` |
| 7 | 51 baseline 全件存在チェック script | `runtime_pending` |
| 8 | helper 抽出 / 行数短縮 | `completed` |
| 9 | lint / typecheck / actionlint / CI dry-run | `runtime_pending` |
| 10 | 受入条件クロスチェック | `runtime_pending` |
| 11 | VISUAL evidence（51 baseline 一覧） | `runtime_pending` |
| 12 | documentation 7 outputs | `completed` |
| 13 | PR 作成（base: dev） | blocked（ユーザー承認） |

---

## 3. 残課題 / 後続タスク

| 項目 | 後続タスク |
|------|-----------|
| required check 昇格（dev / main branch protection） | 別タスクで実施（nightly 1 週間 green 確認後） |
| baseline サイズ最適化（必要時 git LFS） | nightly 安定後に再評価 |
| viewport 追加（4K 等） | 必要時に別タスク |

---

## 4. 判定

| 項目 | 判定 |
|------|------|
| Issue #696 受入条件 5 項目 | `runtime_pending` |
| Phase 1〜10 DoD | `implemented_local_runtime_pending` |
| PR 作成可否 | **不可（実装・Phase 11 runtime evidence・Phase 12 final verification 後）** |

---

## 5. 成果物

- `outputs/phase-10/final-review.md`
