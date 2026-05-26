---
phase: 3
title: Task breakdown — 5 subtasks
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 3: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 3 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

タスク分解の責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-3-design-review.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. サブタスク一覧

| ID | サブタスク | 対象ファイル | 完了判定 |
|----|-----------|--------------|----------|
| T-01 | `AdminSectionError.tsx` に optional `onRetry` / `retryLabel` / `isRetrying` props 追加 | `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` | typecheck green / props 拡張差分のみ |
| T-02 | `AdminSectionErrorClient.tsx` 新規作成（"use client" + `useRouter().refresh()` + `useTransition()`） | `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` | typecheck green / Phase 5 §3 雛形に準拠 |
| T-03 | `_shared/index.ts` に `AdminSectionErrorClient` re-export 追加 | `apps/web/src/features/admin/components/_shared/index.ts` | typecheck green / 既存 export 非破壊 |
| T-04 | 採用 11 admin page で error JSX を `AdminSectionErrorClient` に差し替え | `apps/web/app/(admin)/admin/{requests,tags,schema,members,identity-conflicts,meetings,page,dashboard/attendance,meetings/[id]}/page.tsx` | page.tsx に `"use client"` 追加なしを grep 検証 |
| T-05 | spec 追加（既存 spec への regression assert + 新規 `AdminSectionErrorClient.spec.tsx`） | `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx` / `AdminSectionErrorClient.spec.tsx` | vitest 全 case green / axe critical 0 |

## 2. 実装順序

1. T-01（型基盤）
2. T-02（client wrapper 実装）
3. T-03（export 公開）
4. T-05（spec 追加・先に書いて T-04 の安全網にする）
5. T-04（11 page 一括差し替え）

## 3. 設計レビュー判定（Gate-A 通過条件）

| 観点 | 判定 |
|------|------|
| 既存 spec 互換維持 | ✅ optional props 追加・既存 case 非変更 |
| server compatible 維持 | ✅ `AdminSectionError` は client 化しない |
| 新規 primitive 不追加 | ✅ 既存 Button primitive 再利用 |
| D1 直接アクセス禁止維持 | ✅ retry は RSC re-fetch 経由 |
| OKLch トークン正本維持 | ✅ HEX 直書きなし |
| CONST_007 適合 | ✅ 1 サイクル完結（§Phase 0.4 の Phase 11 evidence 配置まで） |

## 4. 11 採用 page 一覧（T-04 対象）

| # | path | 確認 |
|---|------|------|
| 1 | `apps/web/app/(admin)/admin/requests/page.tsx` | 既存 `AdminSectionError` 利用箇所 |
| 2 | `apps/web/app/(admin)/admin/tags/page.tsx` | 同上 |
| 3 | `apps/web/app/(admin)/admin/schema/page.tsx` | 同上 |
| 4 | `apps/web/app/(admin)/admin/members/page.tsx` | 同上 |
| 5 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 同上 |
| 6 | `apps/web/app/(admin)/admin/meetings/page.tsx` | 同上 |
| 7 | `apps/web/app/(admin)/admin/page.tsx` | 同上 |
| 8 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 同上 |
| 9 | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | 同上 |
| 10-11 | 残 2 件（同 ripgrep 結果に依存）| Phase 5 で `rg -l 'AdminSectionError'` で確定 |

> T-04 着手時に `rg -l 'AdminSectionError' apps/web/app/(admin)` で最終的な採用 page 集合を確定する。差し替え対象が 11 件と異なる場合は Phase 5 で記録して進める。
