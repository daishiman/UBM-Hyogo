# Issue #769 — root `error.tsx` h1 自動 focus 実装ワークフロー

**[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）

## メタ情報

```yaml
workflow_id: issue-769-root-error-focus
title: root apps/web/app/error.tsx の h1 自動 focus 実装
category: A11y Integration Fix
github_issue: 769
status: runtime_pending
parent_workflow: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/
parent_spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md
created_date: 2026-05-17
taskType: implementation
visualEvidence: NON_VISUAL
workflow_state: implemented_local_evidence_captured
implementation_status: implementation_complete_pending_pr
scope: single-cycle
```

## 背景

`parallel-07`（auth/shared error & loading UI alignment）spec section 4.3 で要求された **root `apps/web/app/error.tsx` の h1 自動 focus 移譲** が未実装だったため、本 workflow で実装する。発見時点では以下の 3 要素のうち 1 が抜けていた:

| spec 4.3 要件 | 現状 |
|---|---|
| `role="alert"` + `aria-live="assertive"` | ✅ 実装済（line 24） |
| `error.digest` 表示 | ✅ 実装済（line 31-35） |
| h1 への自動 focus 移譲 | ✅ 本 workflow で実装 |

実コード `apps/web/app/error.tsx` には `useRef` / `tabIndex={-1}` / `headingRef.current?.focus({ preventScroll: true })` を追加済み。

## スコープ（CONST_007 単一サイクル）

差分規模は約 4 行 + 既存テスト 1 ファイルへの追記。**今回サイクル内で完結する単一スコープ**として処理する。横展開（`useAutoFocusOnMount(ref)` 共通 hook 抽出）は i05 と本タスクが merge された後に必要性を再評価する候補として `outputs/phase-12/unassigned-task-detection.md` に記録し、現時点では未タスク化しない。

## 変更対象ファイル

| Path | 種別 | 概要 |
|---|---|---|
| `apps/web/app/error.tsx` | modify | `useRef` import + `headingRef` 生成 + useEffect で focus 呼び出し + h1 に `ref` + `tabIndex={-1}` |
| `apps/web/app/__tests__/error.component.spec.tsx` | modify | 既存 TC-U-01〜TC-U-08 に TC-U-09（focus 移譲）追記 |

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

## DoD（親 spec section 4.3 + AC-1〜AC-10 統合）

- AC-1〜AC-3: `error.tsx` で `useRef<HTMLHeadingElement>` + h1 に `ref` + `tabIndex={-1}` + useEffect で `headingRef.current?.focus({ preventScroll: true })`（順序: `logger.error → focus`）
- AC-4: `__tests__/error.component.spec.tsx` に TC-U-09（focus 検証）追加
- AC-5: digest 検証は既存 TC-U-03 / TC-U-04 で達成済（変更不要）
- AC-6: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` 0 error
- AC-7: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component` PASS
- AC-8: parallel-07 spec 4.3 DoD 達成
- AC-9: 親 workflow index.md の i06 行ステータス更新（local implementation complete、commit / push / PR は user-gated）
- AC-10: i05（`/login/error.tsx`）と編集ファイル非重複

## 不変条件継承

CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 を継承:

1. 既存 API のみ接続（本タスクは UI 単独修正、API 接続変更なし）
2. OKLch トークン正本化（CSS / 色は変更しない）
3. プロトタイプ正本順位（既存 primitive を増やさない、h1 構造を保つ）
4. D1 直接アクセス禁止（apps/web のクライアント側変更のみ）
