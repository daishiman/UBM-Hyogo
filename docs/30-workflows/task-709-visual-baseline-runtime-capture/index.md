[実装区分: 実装仕様書]

# task-709-visual-baseline-runtime-capture

```yaml
implementation_mode: runtime_capture_plus_workflow_edit
taskType: implementation
visualEvidence: VISUAL
workflow_state: PR_OPEN_MERGE_DIRTY
wave: W8-followup-runtime
parallel_group: standalone
issue: 709
upstream:
  - task-18-fu (full visual regression suite — infra completed, runtime_pending)
downstream:
  - dev/main branch protection required check 統合
base_branch: dev
```

> Issue: [#709](https://github.com/daishiman/UBM-Hyogo/issues/709) "[task-25-followup] Visual baseline expansion for non-baseline MVP surfaces"
> Parent (infra): `docs/30-workflows/completed-tasks/task-18-fu-full-visual-regression-suite/`
> Coverage matrix: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
> 担当: 単一実装者（solo dev）
> 判定根拠（ユーザー指定 vs 実態）: ユーザー指定は spec 作成のみだが、issue #709 の目的達成には (a) baseline PNG 51 件の commit、(b) `playwright-visual-full.yml` の PR trigger 復活、(c) `apps/web/playwright/fixtures/visual-routes.ts` の整合性確認 — の **コード/設定/バイナリ変更が必要** なため、実装仕様書として組成する（CONST_004）。

---

## 概要

issue #709 が要求する「visual gate を 4 surface から MVP recovery matrix 全 surface へ拡張」のうち、**インフラ部分は task-18-fu で完了済み**:

- `apps/web/playwright/tests/visual-full/full-visual.spec.ts` (17 routes loop)
- `apps/web/playwright/fixtures/visual-routes.ts` (EXPECTED_VISUAL_ROUTE_COUNT=17)
- `playwright.config.ts` の `visual-full-chromium-{desktop,tablet,mobile}` 3 project
- `.github/workflows/playwright-visual-full.yml` (nightly + workflow_dispatch)
- `.github/workflows/playwright-visual-baseline-update.yml` (approval gate)

未完了 gap（本タスクのスコープ）:

| # | gap | 解消方法 |
|---|-----|---------|
| G1 | baseline PNG（最大 51 件）が未取得。CI は `task-18-fu runtime_pending` で skip 中 | 完了: `playwright-visual-baseline-update` run `25960870639` + `b3fb7f4a` cherry-pick で 51 PNG 取り込み |
| G2 | `playwright-visual-full.yml` の `pull_request:` trigger が MVP-PAUSE でコメントアウト | 完了: コメントアウト解除 + path-filter 復活 |
| G3 | baseline 取得後の安定性検証（連続 2 回 PASS） | 完了: `workflow_dispatch` runs `25961476237` / `25961551972` 全 6 job PASS |
| G4 | required status check 候補化（CLAUDE.md governance）| 後続タスク `task-709-fu-branch-protection-required-check.md` へ formalize（本タスク内では evidence 整備のみ） |

本 workflow は user approval 後に runtime capture / branch push / PR 作成まで完了した。現在は PR #760 (`https://github.com/daishiman/UBM-Hyogo/pull/760`) が open で、`mergeStateStatus=DIRTY` のため merge 前に conflict 解消が必要。

---

## Phase 一覧

| Phase | 名称 | ステータス |
|-------|------|------------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成 | completed |
| 5 | 実装（baseline capture 実行 + workflow 編集） | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認（baseline 全件存在） | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト（VISUAL baseline 目視確認） | completed |
| 12 | ドキュメント更新 | completed |
| 13 | PR 作成 | completed_with_merge_dirty |

---

## 不変条件

1. **task-18-fu で構築された infra は破壊しない**。`full-visual.spec.ts` / `visual-routes.ts` / `playwright.config.ts` の `visual-full-chromium-*` project / 2 workflow は現状を尊重し、必要な最小編集のみ行う。
2. **17 URL routes が正本**。`error.tsx` / `loading.tsx` は本タスク対象外（別 follow-up）。
3. **baseline 取得は CI workflow 経由を正本**とする（ubuntu-latest 固定で OS drift を回避）。ローカル取得した PNG はリポジトリに commit しない。
4. **screenshot drift 抑止**: `animations: 'disabled'` / `caret: 'hide'` / `scale: 'css'` / `mask: [page.locator('[data-visual-mask]'), page.locator('time')]` — 既存 spec の設定を維持。
5. **maxDiffPixelRatio: 0.02** を維持。
6. **D1 直接アクセス禁止**, **既存 API surface のみ** (CLAUDE.md UI MVP 不変条件継承)。
7. CONST_007: 本タスクは user gate 付き single-cycle として扱う。agent は承認前に runtime mutation / commit / push / PR を実行せず、承認後に同一タスク内で baseline capture を再開する。G4（required check 統合）のみ後続タスクに申し送りとし、理由を Phase 12 と `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` に記録する（governance 変更は `gh api -X PUT` を伴うため別承認サイクルが必要）。

---

## 依存関係

| 種別 | タスク | 状態 |
|------|--------|------|
| upstream | task-18-fu-full-visual-regression-suite | 完了（runtime_pending を本タスクで解消） |
| downstream | required status check 統合 | 別タスクで実施 |
| 並列可 | なし |

---

## 変更対象ファイル一覧（最終）

| パス | 種別 | 役割 |
|------|------|------|
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規（最大 51 件） | 17 routes × 3 viewport の baseline PNG |
| `.github/workflows/playwright-visual-full.yml` | 編集 | `pull_request:` ブロックのコメントアウト解除 + MVP-PAUSE コメント削除 |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/baseline-list.md` | 新規 | 51 baseline 列挙 + sha256 |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-7/coverage-report.md` | 新規 | baseline coverage 件数 evidence |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-9/qa.md` | 新規 | typecheck / lint / playwright PASS 証跡 |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-12/*.md` | 新規 | Phase 12 strict 7 outputs |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/artifacts.json` / `outputs/artifacts.json` | 新規 | workflow state / phase status ledger |
| `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` | 新規 | G4 governance follow-up |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集 | 「Visual baseline 4/19 → 17/19」へ更新 + drift note 削除 |

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
