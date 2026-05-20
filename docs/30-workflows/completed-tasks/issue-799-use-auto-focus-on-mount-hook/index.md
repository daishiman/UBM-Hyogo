# issue-799-use-auto-focus-on-mount-hook — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` (a11y hook 抽出 + 3 boundary への横展開。UI 文言・layout 変更なし) |
| implementation_mode | `extract-and-fan-out` |
| 前提 | issue-769 (root error focus) merge 済み (`apps/web/app/error.tsx`) |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/799 (`CLOSED`, PR 文脈は `Refs #799`) |
| PR base | `dev` |

## 実装区分

**[実装区分: 実装仕様書]** — コード変更を伴う。CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト / 実行コマンド / DoD）を Phase 02・05・07・09 で確定する。

## 概要

issue-769 で `apps/web/app/error.tsx` (root) に導入された `useRef + useEffect + focus({ preventScroll: true })` の自動 focus パターンを `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` として共通 hook 抽出し、未対応の 3 boundary (`/login/error.tsx` / `/profile/error.tsx` / `/(admin)/admin/error.tsx`) にも適用する。

## Issue 前提の現状補正

Issue #799 本文は「i05 (`login/error.tsx`) と i06 (`error.tsx`) で同一パターンが二重化」と記述しているが、コードベース調査の結果、focus パターンが実装されているのは i06 (root) のみ。i05 / profile / admin の 3 boundary は `useEffect` で `console.error` を出すだけで a11y focus 管理が欠落している。本 workflow では Issue を **「単一実装の hook 抽出 + 未対応 3 boundary への a11y 横展開」** として再定義し、未割当タスク仕様書 `docs/30-workflows/unassigned-task/issue-769-followup-001-use-auto-focus-on-mount-hook.md` を本 workflow の起点 spec として consume する。

## スコープ

### 含む

- 新規: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`（hook 本体）
- 新規: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`（hook 単体テスト）
- 編集: `apps/web/app/error.tsx`（hook 経由に置換、regression なし）
- 編集: `apps/web/app/login/error.tsx`（h1 ref + hook 適用、a11y 追加）
- 編集: `apps/web/app/profile/error.tsx`（h1 ref + hook 適用、a11y 追加）
- 編集: `apps/web/app/(admin)/admin/error.tsx`（h1 ref + hook 適用、a11y 追加）
- 編集: `apps/web/app/__tests__/error.component.spec.tsx`（既存 root error.tsx 用テストの hook 経由 assertion 維持）
- 新規: `apps/web/app/login/__tests__/error.component.spec.tsx` 等、3 boundary の focus 動作 component spec
- ドキュメント: `docs/00-getting-started-manual/specs/09-ui-ux.md` への error boundary focus ガイドライン追記

### 含まない

- error.tsx 以外の component (modal、Toast、Dialog 等) の focus 管理改修
- error boundary の UI 文言・layout 変更
- D1 schema / API endpoint 変更
- visual regression baseline 追加（layout 不変のため不要）

## 13 Phase 成果物リンク表

| Phase | 区分 | 成果物 | パス |
| --- | --- | --- | --- |
| 01 | 要件整理 | requirements | `phase-01-requirements.md` / `outputs/phase-01/requirements.md` |
| 02 | 設計 | design | `phase-02-design.md` / `outputs/phase-02/design.md` |
| 03 | 設計レビュー | design-review | `phase-03-design-review.md` / `outputs/phase-03/design-review.md` |
| 04 | タスク分解 | task-breakdown | `phase-04-test-creation.md` / `outputs/phase-04/task-breakdown.md` |
| 05 | 実装計画 | implementation-plan | `phase-05-implementation.md` / `outputs/phase-05/implementation-plan.md` |
| 06 | 実装手順 | implementation-steps | `phase-06-test-expansion.md` / `outputs/phase-06/implementation-steps.md` |
| 07 | テスト方針 | test-plan | `phase-07-coverage-check.md` / `outputs/phase-07/test-plan.md` |
| 08 | ドキュメント更新 | docs-updates | `phase-08-refactoring.md` / `outputs/phase-08/docs-updates.md` |
| 09 | 受け入れ基準 | acceptance | `phase-09-quality-assurance.md` / `outputs/phase-09/acceptance.md` |
| 10 | リファクタ要点 | refactor-summary | `phase-10-final-review.md` / `outputs/phase-10/refactor-summary.md` |
| 11 | エビデンス計画 | evidence | `phase-11-manual-test.md` / `outputs/phase-11/evidence/{typecheck,lint,web-vitest,verify-pr-ready}.txt` |
| 12 | 実装ガイド | documentation | `phase-12-documentation.md` / `outputs/phase-12/implementation-guide.md` |
| 13 | PR ドラフト | pr-summary | `phase-13-pr-creation.md` / `outputs/phase-13/pr-summary.md` |

## 実装結果サマリ

- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` を追加し、mount 時 `focus({ preventScroll: true })` を hook に集約した。
- root / login / profile / admin の 4 error boundary が h1 `ref` + `tabIndex={-1}` + `useAutoFocusOnMount` に統一された。
- profile / admin の既存 followup は focus 部分だけでなく digest 表示・構造化 logger・dev stack 表示まで同一 wave で消化した。
- `pnpm --filter @ubm-hyogo/web test -- ...` は package script の構造上 web 全体実行となり、98 files / 690 tests が pass、1 skipped。
- Issue #799 は closed issue のため PR body は `Refs #799` を使う。

## 不変条件

1. 既存 API endpoint surface 変更禁止
2. OKLch トークンのみ使用（HEX 直書き禁止）
3. 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止 — lefthook `block-test-suffix` で reject）
4. D1 直接アクセスは `apps/api` に閉じる（本タスクは frontend only）
5. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（本タスクは env 非依存）
