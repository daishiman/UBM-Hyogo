# Stage 3 — CI gate + Lighthouse + Branch Protection

| 項目 | 値 |
|------|----|
| workflow id | `e2e-quality-uplift-stage-3` |
| base branch | `dev` |
| feature branch | `feat/e2e-quality-uplift` |
| 起票日 | 2026-05-08 |
| CONST_007 | single cycle |
| 適用 tier | standard（lines >= 80%） |
| 正本 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/` |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | umbrella_archived_decomposed |
| evidence_state | runtime_pending |

---

## 目的

Stage 0-2 で整備した E2E / coverage / critical-route smoke を、**PR ブロッキング可能な hard CI gate** に昇格させるための親 umbrella 仕様。現在は 3a / 3b / 3c の子 workflow に分解済みで、実 CI evidence と branch protection mutation は各子 workflow の user-gated runtime phase で取得する。

---

## サブタスク一覧

| ID | 名称 | implementation_mode | 主成果物 |
|----|------|---------------------|----------|
| 3a | Lighthouse CI 導入 | `new` / child spec_created / runtime_pending | `.github/workflows/lighthouse.yml` / `lighthouserc.json` |
| 3b | `e2e-tests.yml` hard gate 化 | `new` / child spec_created / runtime_pending | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` reporter swap / coverage gate script |
| 3c | Branch protection contexts 更新 | user-gated mutation / child spec_created | `gh api` 適用コマンド + 検証手順（ファイル成果物なし） |

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | Stage 2 完了（coverage 80% 達成 + critical-route smoke 整備） | **完了**（Stage 2 artifacts と Phase 1-13 を確認済み） |
| depends-on | `apps/web/playwright.config.ts:15-19` の reporter 構成（現状 `html` / `json` / `list`） | 確認済み |
| depends-on | `dev` branch protection 現行 contexts: `ci` / `Validate Build` / `coverage-gate`（`gh api` 確認済み 2026-05-08） | 確認済み |
| blocks | なし（Stage 3 が本ワークフロー終端） | — |

---

## 受入基準（workflow 全体）

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-01 | `lighthouse-ci` job が `/`, `/(public)/members`, `/profile`, `/login` の 4 routes に対し perf>=80 / a11y>=90 / best-practices>=90 / seo>=80 を assertion し、しきい値割れで PR を fail させる | 3a PR runtime evidence で確認 |
| AC-02 | `e2e-tests.yml` が `pnpm e2e` を CI で実行し、line coverage < 80% で fail / critical-route smoke 失敗で fail する | 3b PR runtime evidence で確認 |
| AC-03 | `apps/web/playwright.config.ts` reporter に `monocart-reporter` が追加され、coverage artifact が生成される | 3b CI ログ + artifact 一覧で確認 |
| AC-04 | coverage artifact / 失敗時 HTML report が `actions/upload-artifact@v4` 経由で取得可能 | 3b `gh run download` で確認 |
| AC-05 | `dev` / `main` branch protection の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` が追加される | 3c user-gated `gh api` evidence で確認 |
| AC-06 | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`（CLAUDE.md governance）が drift していない | 3c post-snapshot で確認 |

---

## Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | archived parent spec | `phase-1.md` |
| 2 | 設計 | archived parent spec | `phase-2.md` |
| 3 | 設計レビュー | archived parent spec | `phase-3.md` |
| 4 | テスト作成 | archived parent spec | `phase-4.md` |
| 5 | 実装 | archived parent spec | `phase-5.md` |
| 6 | テスト拡充 | archived parent spec | `phase-6.md` |
| 7 | カバレッジ確認 | archived parent spec | `phase-7.md` |
| 8 | リファクタリング | archived parent spec | `phase-8.md` |
| 9 | 品質保証 | archived parent spec | `phase-9.md` |
| 10 | 最終レビュー | archived parent spec | `phase-10.md` |
| 11 | 手動テスト / Evidence | runtime_pending in child workflows | `phase-11.md` |
| 12 | ドキュメント更新 | decomposed into child workflows | `phase-12.md` |
| 13 | PR | user-gated in child workflows | `phase-13.md` |

---

## 不変条件（Stage 3 固有）

1. solo dev policy: `required_pull_request_reviews=null` を保持する。レビュアー必須化は導入しない。
2. `required_status_checks.strict=false`（現状）を維持する（merge queue 未導入のため）。
3. Lighthouse CI は **PR to `dev`** のみで実行（`main` への PR は `dev` 経由で既に通過済みのため重複実行しない）。
4. coverage gate のしきい値変更は `.claude/skills/task-specification-creator/references/quality-gates.md §7.5`（standard tier = 80%）の正本に従う。Stage 3 内で独自しきい値を持たない。
5. `wrangler` 直叩きを CI 内で行わない（必要時は `scripts/cf.sh` 経由）。
