---
phase: 8
title: Definition of Done
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. ファイル成果物 DoD

| ID | 項目 | 検証手段 |
|----|------|---------|
| DoD-01 | `apps/web/app/layout.tsx` に `<html lang="ja" data-theme="warm">` が含まれる | grep |
| DoD-02 | `apps/web/app/layout.tsx` で `tokens.css` → `globals.css` の順で import されている | grep / diff |
| DoD-03 | `apps/web/app/layout.tsx` に `metadata`（object 形式 title）と `viewport` が export されている | typecheck + grep |
| DoD-04 | `apps/web/app/error.tsx` が `"use client"` で始まり、props 型 `{ error: Error & { digest?: string }; reset: () => void }` を持つ | typecheck |
| DoD-05 | `apps/web/app/error.tsx` が Card primitive で構成されている | grep `../src/components/ui/Card` |
| DoD-06 | `apps/web/app/error.tsx` が logger.error を `event: "error.boundary.caught"` で呼ぶ | grep |
| DoD-07 | `apps/web/app/not-found.tsx` が Server Component（`"use client"` なし）で Card + EmptyState 構成 | grep |
| DoD-08 | `apps/web/app/loading.tsx` が `role="status" aria-busy="true" aria-live="polite"` を持つ | grep |
| DoD-09 | ToastProvider が `apps/web/app/` 配下で 1 か所のみ import される | grep |
| DoD-10 | 4 ファイルすべて HEX 直書きなし | `verify-design-tokens` gate |

## 2. テスト DoD

| ID | 項目 | 検証 |
|----|------|------|
| DoD-T-01 | `apps/web/app/__tests__/layout.spec.tsx` 存在 / PASS | vitest |
| DoD-T-02 | `apps/web/app/__tests__/error.spec.tsx` 存在 / PASS（reset 呼び出し / logger 記録） | vitest |
| DoD-T-03 | `apps/web/app/__tests__/not-found.spec.tsx` 存在 / PASS | vitest |
| DoD-T-04 | `apps/web/app/__tests__/loading.spec.tsx` 存在 / PASS | vitest |
| DoD-T-05 | テスト suffix は `.spec.tsx` のみ | `verify-test-suffix` gate |

## 3. 品質ゲート DoD

| ID | ゲート | 状態 |
|----|-------|------|
| DoD-Q-01 | `pnpm typecheck` | exit 0 |
| DoD-Q-02 | `pnpm lint` | exit 0 |
| DoD-Q-03 | `pnpm --filter @ubm-hyogo/web build` | success |
| DoD-Q-04 | `pnpm verify:tokens` | exit 0 |
| DoD-Q-05 | `test -z "$(find apps/web -name '*.test.*' -print -quit)"` | exit 0 |
| DoD-Q-06 | `bash scripts/verify-pr-ready.sh` | exit 0 |

## 4. プロセス DoD

| ID | 項目 |
|----|------|
| DoD-P-01 | 4 ファイル編集と 4 spec の追加が同一 commit / 連続 commit にまとめられている |
| DoD-P-02 | PR base は `dev`（CLAUDE.md 既定） |
| DoD-P-03 | PR 本文に Phase 5 実装ガイドの差分要約と Phase 11 evidence 表が含まれる |
| DoD-P-04 | 既存 `apps/web/app/*.tsx` の挙動回帰（特に error boundary 発火）が手動確認されている |

## 5. 上位 SCOPE.md DoD への寄与

本サブワークフローは workflow root `SCOPE.md` 「DoD 全体」のうち以下を満たす:

- DoD 2: `apps/web/app/layout.tsx` + 3 つの route group layout.tsx が存在 — **root layout の確定により部分達成**
- DoD 3: `pnpm typecheck` / `pnpm lint` / `pnpm build` が green — **本サブワークフロー分は達成**
- DoD 6: `verify-design-tokens` CI gate green — **本サブワークフロー分は達成**
- DoD 7: `bash scripts/verify-pr-ready.sh` exit 0 — **本サブワークフロー分は達成**

DoD 1（globals.css）/ DoD 4（Form response 描画）/ DoD 5（Playwright visual）は他サブワークフロー担当。

## 6. リリース判定

DoD-01..10 / DoD-T-01..05 / DoD-Q-01..06 / DoD-P-01..04 がすべて満たされたら、PR を `dev` に向けて作成する。

## 7. 参照

- Phase 7 品質ゲート
- workflow root `SCOPE.md`
