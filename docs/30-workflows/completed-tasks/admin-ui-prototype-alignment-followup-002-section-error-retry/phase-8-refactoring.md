---
phase: 8
title: Definition of Done
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 8: Definition of Done（AC-1〜AC-12）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 8 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

Definition of Doneの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

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

- 本ファイル: `phase-8-refactoring.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 受け入れ条件（既存 unassigned-task spec §6 を踏襲）

| AC | 内容 | 検証 |
|----|------|------|
| AC-1 | `AdminSectionError.tsx` に optional `onRetry` / `retryLabel` / `isRetrying` props が追加され、未指定時の DOM が v1 と完全互換 | Phase 6 AS-1 / typecheck |
| AC-2 | `AdminSectionErrorClient.tsx` が新規追加され、`"use client"` boundary 内で `router.refresh()` + `useTransition()` を組成 | Phase 5 §3.2 / Phase 6 AC-2/AC-3 |
| AC-3 | 採用 admin page で page.tsx に `"use client"` を追加せず、error 表示部分のみ client 化されている | Phase 6 §5 grep |
| AC-4 | 既存 `AdminSectionError.spec.tsx` が無修正で pass（既存 case 部分の非変更を git diff で確認） | vitest + `git diff` |
| AC-5 | `AdminSectionErrorClient.spec.tsx` が新規追加され、retry click / loading / a11y を検証 | Phase 6 AC-1..AC-8 |
| AC-6 | retry button の a11y（role / aria-label / aria-busy / disabled）が WCAG 準拠 | axe critical 0 |
| AC-7 | `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning | Phase 7 gate 1-2 |
| AC-8 | axe critical violation 0 を維持 | Phase 7 gate 5 |
| AC-9 | 新規 primitive を導入していない（既存 Button primitive を再利用、不変条件3 遵守） | `git diff --stat apps/web/src/components/ui/` |
| AC-10 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（OKLch トークン正本） | Phase 6 §5 grep + `verify:tokens` |
| AC-11 | D1 直接アクセスなし（retry 経路は既存 API endpoint 経由の RSC re-fetch） | git diff（D1 binding 変更なし）+ Phase 2 §3 |
| AC-12 | 新規 test ファイルが `*.spec.tsx` 命名（CLAUDE.md #8 遵守） | lefthook `block-test-suffix` |

## 2. Phase 1 FR/NFR との対応

| AC | Phase 1 FR/NFR |
|----|----------------|
| AC-1 | FR-01..FR-04 |
| AC-2 | FR-07 |
| AC-3 | FR-10 / NFR-06 暗黙 |
| AC-4 | NFR-03 |
| AC-5 | FR-07 / NFR-01 |
| AC-6 | NFR-01 / NFR-02 |
| AC-7 | NFR-08 |
| AC-8 | NFR-01 |
| AC-9 | NFR-04 |
| AC-10 | NFR-05 |
| AC-11 | NFR-06 |
| AC-12 | NFR-07 |

## 3. DoD 確認の最終手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx
mise exec -- pnpm verify:tokens
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

全 green を確認後、Phase 13 の PR draft で base=`dev` に PR 作成（user 明示承認後）。
