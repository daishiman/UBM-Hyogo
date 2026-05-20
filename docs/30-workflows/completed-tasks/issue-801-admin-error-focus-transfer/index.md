# Issue #801 — `(admin)/admin/error.tsx` h1 自動 focus 移譲 横展開ワークフロー

**[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）

## メタ情報

```yaml
workflow_id: issue-801-admin-error-focus-transfer
title: (admin)/admin/error.tsx への root 同等 a11y hardening (focus / aria-live / digest / logger / tokens) 横展開
category: A11y Integration Fix (followup)
github_issue: 801
github_issue_state: open
status: runtime_pending
parent_workflow: docs/30-workflows/ui-prototype-alignment-mvp-recovery/
parent_spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md
reference_implementation: apps/web/app/error.tsx
predecessor_workflow: docs/30-workflows/completed-tasks/issue-769-root-error-focus/
predecessor_evidence: docs/30-workflows/completed-tasks/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-19
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
workflow_state: implemented_local_evidence_captured
implementation_status: implementation_complete_pending_pr
scope: single-cycle
```

## 背景・現状調査

Issue #801 は issue-769 (root `error.tsx` h1 focus 実装) の Phase 12 unassigned-task-detection で followup candidate として記録された a11y hardening 横展開タスク。本仕様書作成時点の調査結果:

| 確認項目 | 結果 |
|---|---|
| issue 状態 | open（GitHub API: `state="open"`） |
| 別タスクで解決済か | **No**。git log で `apps/web/app/(admin)/admin/error.tsx` への変更は 06c 初期コミット 1 件のみ |
| 現状の admin/error.tsx | 10 行スタブ。`useRef`/`tabIndex`/`focus`/`aria-live`/`digest`/`logger`/OKLch トークンすべて未実装 |
| 関連 PR | なし（gh pr list で確認） |

→ **本タスクの実行は必要**。

### root error.tsx (reference) と現状 admin/error.tsx の差分

| spec 4.3 要件 | root (`apps/web/app/error.tsx`) | admin (`apps/web/app/(admin)/admin/error.tsx`) |
|---|---|---|
| `role="alert"` | ✅ | ✅ |
| `aria-live="assertive"` | ✅ | ❌ |
| `useRef<HTMLHeadingElement>` + `tabIndex={-1}` | ✅ | ❌ |
| `useEffect` 内 `logger.error → focus({preventScroll:true})` | ✅ | ❌ |
| `error.digest` 表示 | ✅ | ❌ |
| `isDev` 分岐の stack 表示 | ✅ | ❌ |
| OKLch トークン className (`text-danger` 等) | ✅ | ❌（unstyled） |
| 「トップへ戻る」リンク | ✅ (`/`) | ❌ |

## スコープ（CONST_007 単一サイクル）

差分規模: `(admin)/admin/error.tsx` 全面書き換え 約 50 行 + 新規テスト 1 ファイル約 80 行。**今回サイクル内で完結する単一スコープ**。共通 hook 抽出 (`useAutoFocusOnMount`) は issue-769-followup-001 として別途扱い、本タスクでは inline 実装で root と揃える。

## 変更対象ファイル

| Path | 種別 | 概要 |
|---|---|---|
| `apps/web/app/(admin)/admin/error.tsx` | rewrite | root error.tsx をテンプレートに admin 文脈調整（h1 文言 / リンク先 `/`） |
| `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` | new | focus / digest / reset / logger / token / isDev 検証 |

## Phase 一覧

| Phase | 種別 | ファイル |
|---|---|---|
| 1 | requirements | `phase-1-requirements.md` |
| 2 | design | `phase-2-design.md` |
| 3 | design-review | `phase-3-design-review.md` |
| 4 | test-plan | `phase-4-test-plan.md` |
| 5 | implementation | `phase-5-implementation.md` |
| 6 | test-additions | `phase-6-test-additions.md` |
| 7 | coverage | `phase-7-coverage.md` |
| 8 | refactor | `phase-8-refactor.md` |
| 9 | qa | `phase-9-qa.md` |
| 10 | final-review | `phase-10-final-review.md` |
| 11 | manual-test | `phase-11-manual-test.md` |
| 12 | documentation | `phase-12-documentation.md` |
| 13 | pr | `phase-13-pr.md` |

## DoD (AC-1〜AC-16)

詳細は `phase-1-requirements.md` 受入条件を参照。要約:

- AC-1〜AC-3: `admin/error.tsx` に `useRef<HTMLHeadingElement>` + h1 `ref` + `tabIndex={-1}` + `useEffect` で `logger.error → focus({preventScroll:true})`
- AC-4: `role="alert"` + `aria-live="assertive"`
- AC-5〜AC-6: `error.digest` 表示 + `isDev` 分岐の stack 抑制
- AC-7: 「トップへ戻る」リンク先 `/`（auth 切れ時の loop 回避）
- AC-8: OKLch トークン className のみ（`verify-design-tokens` 通過）
- AC-9〜AC-10: 新規 vitest 5 観点（focus/tabIndex/preventScroll/digest/reset/logger）PASS
- AC-11〜AC-13: `pnpm typecheck` / `pnpm lint` / 該当 vitest 0 error
- AC-14: 親 spec section 4.3 admin segment 適用達成
- AC-15: admin auth gate のロジック・redirect 経路に変更なし
- AC-16: D1 schema / admin API endpoint surface 不変

## 不変条件継承

CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 を継承:

1. 既存 API のみ接続（本タスクは UI 単独修正、API 接続変更なし）
2. OKLch トークン正本化（HEX 直書き禁止）
3. プロトタイプ正本順位（既存 primitive 群で構成、新規 primitive を生やさない）
4. D1 直接アクセス禁止（apps/web 単独修正）
