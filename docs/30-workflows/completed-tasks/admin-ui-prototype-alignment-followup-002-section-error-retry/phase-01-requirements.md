---
phase: 1
title: Requirements — AdminSectionError retry CTA
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 1 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

要件定義の責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

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

- 本ファイル: `phase-01-requirements.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 機能要件（FR）

| ID | 要件 |
|----|------|
| FR-01 | `AdminSectionError` に optional `onRetry?: () => void` props を追加する |
| FR-02 | `AdminSectionError` に optional `retryLabel?: string` props を追加する（既定値「再読み込み」） |
| FR-03 | `AdminSectionError` に optional `isRetrying?: boolean` props を追加する（既定 `false`） |
| FR-04 | `onRetry` 未指定時、DOM は v1 と完全互換（retry button が存在しない） |
| FR-05 | `onRetry` 指定時、retry button が `role="button"` で描画される |
| FR-06 | `isRetrying === true` のとき button は `disabled` かつ `aria-busy="true"` |
| FR-07 | `AdminSectionErrorClient.tsx`（"use client"）を新設し、`useRouter().refresh()` + `useTransition()` で retry handler を組成する |
| FR-08 | `AdminSectionErrorClient` の props は `Omit<AdminSectionErrorProps, "onRetry" \| "isRetrying">` |
| FR-09 | `_shared/index.ts` で `AdminSectionErrorClient` を re-export する（既存 export を壊さない） |
| FR-10 | 採用 11 admin page の error JSX 部分を `AdminSectionErrorClient` 経由に差し替え、page.tsx を `"use client"` 化しない |

## 2. 非機能要件（NFR）

| ID | 要件 |
|----|------|
| NFR-01 | a11y: retry button は WCAG 2.1 AA 準拠（role / aria-label / aria-busy / disabled） |
| NFR-02 | a11y: 既存 `role="alert"` + `aria-live="polite"` は維持 |
| NFR-03 | 既存 `AdminSectionError.spec.tsx` が無修正で pass |
| NFR-04 | 新規 primitive を追加しない（既存 Button primitive を再利用） |
| NFR-05 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入しない（OKLch トークン経由） |
| NFR-06 | D1 直接アクセスなし（既存 RSC fetch 経路のみ） |
| NFR-07 | 新規 test ファイルは `*.spec.tsx` のみ |
| NFR-08 | `pnpm typecheck` / `pnpm lint` 0 error / 0 warning |

## 3. 最小 gate

| gate | 内容 |
|------|------|
| typecheck | `mise exec -- pnpm typecheck` 全 green |
| lint | `mise exec -- pnpm lint` 全 green |
| unit (existing) | `AdminSectionError.spec.tsx` pass + retry button 不在 regression assert pass |
| unit (new) | `AdminSectionErrorClient.spec.tsx` 全 case pass |
| a11y | axe critical violation 0 |
| design-tokens | `verify-design-tokens` gate green |
| pr-pre-flight | `bash scripts/verify-pr-ready.sh` 全 green |

## 4. a11y 詳細要件

- `<button type="button">` を使用（`<a>` 使用禁止）
- `aria-label` は `${sectionLabel} を再読み込み` 形式で section 文脈を含める
- retry 中の `aria-busy="true"` と `disabled` を両立
- button DOM は `role="alert"` 領域の内部に配置し、scope を明確化
- focus 戻し: `router.refresh()` 後も button DOM が残存するため React reconciliation 任せ

## 5. 受け入れ判定（Phase 8 DoD への接続）

本 Phase の FR/NFR は Phase 8 `phase-8-refactoring.md` の AC-1〜AC-12 に対応する。AC との対応関係は Phase 8 §1 の対応表で明示する。
