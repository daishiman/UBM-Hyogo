---
workflow_id: parallel-i06-root-error-focus
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-18
owner: daishiman
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: existing-component-hardening
source_spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md
---

# parallel-i06-root-error-focus — root error.tsx の h1 自動 focus 追加

[実装区分: 実装仕様書] — コード変更を伴う。

## 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`（以下 *source spec*）の DoD「root `error.tsx` で error 受領時に h1 へ自動 focus を移譲し screen reader 読み上げを促進する」を Phase 1-13 仕様書として展開する。

source spec は in-place fix で完結予定とされていたが、本 workflow root はユーザー指示に基づき Phase 1-13 のフル仕様書として再構成したものである。実装範囲・差分量は source spec と完全に等価（4 行の編集 + 1 test ファイル新規作成）。

## スコープ

### 含む
- `apps/web/app/error.tsx` の h1 要素に `ref` と `tabIndex={-1}` を付与
- `useEffect` 内で `headingRef.current?.focus({ preventScroll: true })` を呼び出す
- `apps/web/app/error.spec.tsx` を新規作成し、focus 移譲 + digest 表示の 2 ケースを検証
- `pnpm typecheck` / `pnpm lint` / `pnpm -F "@ubm-hyogo/web" test` を local で PASS

### 含まない
- `error.tsx` の文言・スタイル・logger 呼び出しの変更
- `/login/error.tsx` 等、別 boundary の修正（i05 で別途実施）
- 新規 API endpoint 追加、D1 schema 変更
- Visual regression evidence（NON_VISUAL タスク）

## 不変条件

1. CLAUDE.md UI prototype alignment 不変条件 1-4 を継承（既存 API のみ / OKLch トークン / プロトタイプ正本順位 / D1 直接禁止）。
2. 既存 spec のうち `parallel-07` spec section 4.3 を Acceptance Criteria の正本とする。
3. テスト suffix は `*.spec.{ts,tsx}` のみ（`*.test.tsx` 禁止）。
4. 副作用順序は同一 useEffect 内で `logger.error → focus` を固定する。

## サブワークフロー構成

本タスクは単一責務（focus 管理の追加）かつ差分が 4 行 + 1 test ファイルに収まるため、サブワークフロー分割は行わず Phase 1-13 のフラット構成とする。

| ディレクトリ | 種別 | 責務 |
|-------------|------|------|
| 本 workflow root 直下 | 直列 | Phase 1〜13 を順次実行 |

## 正本順位（衝突時の優先度）

1. 本 workflow root の `index.md`（本ファイル）と Phase 1〜13
2. source spec（`ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`）
3. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
4. `docs/00-getting-started-manual/specs/09a..09h-*.md`
5. プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/`

## CONST_007 適合宣言

全 Phase 1-13 は後続実装プロンプトの 1 サイクルで完了可能なスコープに収めている。先送り対象（バックログ・別 PR）は **0 件**。差分量 4 行 + 1 test ファイルは単一 PR で完結する。

## Phase 一覧

| Phase | ファイル | 目的 |
|-------|---------|------|
| 1 | `phase-01-requirements.md` | 要件定義（FR/NFR + ステークホルダー観点） |
| 2 | `phase-02-architecture.md` | アーキテクチャ（React focus 管理パターン選定） |
| 3 | `phase-03-task-breakdown.md` | タスク分解（4 行差分の責務分割と依存） |
| 4 | `phase-04-data-contract.md` | データ契約（Props / ref / focus event 契約） |
| 5 | `phase-05-implementation-guide.md` | 実装ガイド（Before/After 完全コード） |
| 6 | `phase-06-test-plan.md` | テスト計画（spec ケース定義 + coverage） |
| 7 | `phase-07-quality-gates.md` | 品質ゲート（lint / typecheck / test gate） |
| 8 | `phase-08-dod.md` | DoD（受け入れ条件チェックリスト） |
| 9 | `phase-09-risks.md` | リスク（focus outline / 順序紛糾 / a11y 副作用） |
| 10 | `phase-10-local-verification.md` | local 検証コマンドと期待出力 |
| 11 | `phase-11-evidence-inventory.md` | evidence 一覧（typecheck/lint/test ログ） |
| 12 | `phase-12-compliance-check.md` | Phase 12 compliance（spec 整合 + skill feedback） |
| 13 | `phase-13-commit-pr.md` | commit / PR 手順（ユーザー承認後のみ実行） |
