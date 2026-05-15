[実装区分: 実装仕様書]

# task-18-fu-full-visual-regression-suite

```yaml
implementation_mode: new_code_addition
taskType: implementation
visualEvidence: VISUAL
wave: W8-followup
parallel_group: standalone
issue: 696
upstream:
  - task-18 (W7 visual smoke 4 baseline)
downstream:
  - required check 候補（dev/main branch protection 統合）
base_branch: dev
```

> ワークフロー: `task-18-fu-full-visual-regression-suite`
> Issue: [#696](https://github.com/daishiman/UBM-Hyogo/issues/696) "task-18-FU: full visual regression suite (17 routes × 3 viewport)"
> 担当: 単一実装者（solo dev）
> task classification: implementation task（playwright config + spec + workflow 追加）
> visual classification: VISUAL（51 screenshot baseline を成果物として含む）

---

## 概要

task-18 (W7) で導入された 4 screen baseline（profile / login / admin-dashboard / public-top）を拡張し、`17 URL routes × 3 viewport (desktop/tablet/mobile)` = **51 screenshot baseline** の full visual regression suite を導入する。

### 拡張ポイント

| 項目 | W7（現状） | W8-fu（本タスク） |
|------|-----------|------------------|
| baseline 数 | 4 | 51 |
| viewport | desktop のみ | desktop / tablet / mobile |
| playwright project | `visual-chromium` | `visual-full-chromium`（追加） |
| trigger | PR + main | PR path-filter + nightly + manual approval baseline update |
| spec ファイル | `playwright/tests/visual/*.spec.ts` (4 ファイル) | `playwright/tests/visual-full/full-visual.spec.ts` (1 ファイル + routes loop) |

---

## Phase 一覧

| Phase | 名称 | ステータス |
|-------|------|------------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成 | completed |
| 5 | 実装（playwright config + spec + workflow） | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認（51 baseline 全件存在） | runtime_pending |
| 8 | リファクタリング（routes / viewport 共通化） | completed |
| 9 | 品質保証 | runtime_pending |
| 10 | 最終レビュー | runtime_pending |
| 11 | 手動テスト（VISUAL 51 baseline） | runtime_pending |
| 12 | ドキュメント更新 | completed |
| 13 | PR 作成 | blocked（ユーザー承認待ち） |

---

## 不変条件

1. **既存 W7 visual suite を破壊しない**: `visual-chromium` project と `playwright/tests/visual/` 配下 4 ファイルは現状維持。`visual-full-chromium` を新規追加するのみ。
2. **screenshot drift 抑止**: ubuntu-latest 固定 / `animations: 'disabled'` / fonts/CSS 安定化 / `await page.waitForLoadState('networkidle')` を必須とする。
3. **baseline update は user approval gate を必須**: `workflow_dispatch` + `environment: visual-baseline-approval` で人手承認なしには baseline が更新されない構造とする。
4. **CI 時間配分**: PR では path-filter（visual に関わる変更のみ）で発火、nightly では全件実行。両者を別 workflow に分離する。
5. **17 routes の確定根拠を Phase 1 で文書化**: CLAUDE.md "UI prototype alignment / MVP recovery" 19 routes から共通テンプレ 3 件除外 + 状態違いケース 1 件で 17 routes。
6. **3 viewport 寸法を固定**: desktop=1280x800 / tablet=768x1024 / mobile=390x844。`apps/web/playwright/fixtures/viewports.ts` で定数化。
7. **maxDiffPixelRatio: 0.02 を維持**（W7 と同値）。動的要素は `mask` で対応する。
8. **D1 直接アクセス禁止 / 既存 API のみ接続**（CLAUDE.md UI MVP scope 不変条件 1, 4 を継承）。

---

## 依存関係

| 種別 | タスク | 状態 |
|------|--------|------|
| upstream | task-18 (W7 visual smoke 4 baseline) | 完了済み |
| upstream | task-09 (OKLch tokens) / task-18 (verify-design-tokens gate) | 完了済み |
| downstream | dev/main branch protection への required check 統合 | Phase 13 PR マージ後に別タスクで実施 |
| 並列可 | なし（W8-fu 単独） |

---

## 主要成果物

| パス | 役割 |
|------|------|
| `outputs/phase-1/requirements.md` | 17 routes / 3 viewport / 51 baseline 命名規約 |
| `outputs/phase-2/design.md` | playwright.config diff / spec 構造 / workflow yaml 構造 |
| `outputs/phase-3/design-review.md` | flaky 試算 / CI 時間試算 / required check 可否 |
| `outputs/phase-4/test-plan.md` | baseline 取得手順 / retry 戦略 / mask 方針 |
| `outputs/phase-5/implementation-notes.md` | playwright.config / spec / workflow / baseline 生成手順 |
| `outputs/phase-6/test-additions.md` | data-testid 安定性 / auth helper fixture |
| `outputs/phase-7/coverage.md` | 51 baseline 全件存在チェック script 結果 |
| `outputs/phase-8/refactor.md` | routes 配列 / viewport 定数の抽出記録 |
| `outputs/phase-9/qa.md` | lint / typecheck / playwright PASS 証跡 |
| `outputs/phase-10/final-review.md` | issue #696 受入条件 5 項目チェック |
| `outputs/phase-11/evidence/baseline/` | 51 screenshot baseline 一覧（VISUAL 証跡） |
| `outputs/phase-12/main.md` | Phase 12 root |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル） + Part 2（技術者向け） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_005 root evidence |
| `outputs/phase-12/system-spec-update-summary.md` | 仕様同期サマリー |
| `outputs/phase-12/skill-feedback-report.md` | skill 改善点記録 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 |
| `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 の判定記録 |

---

## 変更対象ファイル一覧（最終）

| パス | 種別 | 役割 |
|------|------|------|
| `apps/web/playwright.config.ts` | 編集 | `visual-full-chromium` project (desktop/tablet/mobile 3 件) を `projects` 配列に追加 |
| `apps/web/playwright/fixtures/viewports.ts` | 新規 | viewport 定数（desktop/tablet/mobile） |
| `apps/web/playwright/fixtures/visual-routes.ts` | 新規 | 17 routes 配列 + 認証要否 flag |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 新規 | 17 routes × project loop の screenshot spec |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規 | 51 baseline 画像 |
| `.github/workflows/playwright-visual-full.yml` | 新規 | nightly + PR path-filter trigger |
| `.github/workflows/playwright-visual-baseline-update.yml` | 新規 | workflow_dispatch + approval gate |
| `apps/web/package.json` | 編集 | `test:visual-full` / `test:visual-full:update` scripts 追加 |

---

## Phase 仕様書

- [phase-1-requirements.md](./phase-1-requirements.md)
- [phase-2-design.md](./phase-2-design.md)
- [phase-3-design-review.md](./phase-3-design-review.md)
- [phase-4-test-plan.md](./phase-4-test-plan.md)
- [phase-5-implementation.md](./phase-5-implementation.md)
- [phase-6-test-additions.md](./phase-6-test-additions.md)
- [phase-7-coverage.md](./phase-7-coverage.md)
- [phase-8-refactor.md](./phase-8-refactor.md)
- [phase-9-qa.md](./phase-9-qa.md)
- [phase-10-final-review.md](./phase-10-final-review.md)
- [phase-11-manual-test.md](./phase-11-manual-test.md)
- [phase-12-documentation.md](./phase-12-documentation.md)
- [phase-13-pr.md](./phase-13-pr.md)
