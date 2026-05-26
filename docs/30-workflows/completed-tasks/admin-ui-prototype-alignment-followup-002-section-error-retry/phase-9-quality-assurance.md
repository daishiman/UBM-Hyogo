---
phase: 9
title: Risks & fallbacks
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 9: リスクとフォールバック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 9 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

リスクの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

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

- 本ファイル: `phase-9-quality-assurance.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. リスク表

| ID | リスク | 影響度 | 確率 | 対策 |
|----|-------|--------|------|------|
| R-01 | `router.refresh()` は route 全体の RSC を再 fetch するため、他 section の state（フィルタ・選択行）も巻き戻る可能性 | 中 | 中 | 仕様で「v1 は route 全体 refresh を許容」と明示（Phase 2 §3）。section-scoped invalidation は別タスク化 |
| R-02 | retry 完了で section が消える場合に focus が body へ落ちる | 低 | 低 | 本タスクスコープ外として記録。後続改善で `useRef` + `focus()` 戻しを検討 |
| R-03 | server component 経由で `onRetry` を誤って渡した場合に "Functions cannot be passed directly to Client Components" 等の該当項目のエラー | 中 | 低 | wrapper 内部で組成・server からは渡さない設計（Phase 2 §2）。Phase 6 §5 grep で page.tsx に `onRetry=` が追加されていないか確認 |
| R-04 | 既存 import path（`from "./AdminSectionError"` 直接 import）の破壊 | 高 | 低 | 既存 export 名を変えない・index.ts は追加のみ（Phase 5 §3.3） |
| R-05 | loading state の表現で button text を切り替えると CLS（Cumulative Layout Shift）が出る | 低 | 中 | text は同一幅の wrapper（既存 Button primitive 規約）か min-width 指定でレイアウト揺れを抑制 |
| R-06 | 11 page 差し替えで `"use client"` を誤って page.tsx 冒頭に追加してしまう | 高 | 低 | Phase 6 §5 grep を pre-commit 段階で実行・必須 |
| R-07 | `useTransition` の `isPending` が短時間に切り替わり、button の disabled 状態が flicker する | 低 | 中 | UX 上問題化したら別タスクで debounce 検討（v1 スコープ外） |
| R-08 | 既存 spec が突然 fail（regression assert 追加で他 case の testing-library query が干渉） | 中 | 低 | 追加 case は describe block を分離・既存 setup を共有しない |

## 2. フォールバック方針

- gate-A 通過後の実装段階で R-03 / R-06 が顕在化した場合、該当 page の差し替えを巻き戻し（git revert）し、wrapper の boundary 境界だけ残して再着手
- spec が flaky になった場合、`useTransition` mock を `act(async () => ...)` でラップして transition 完了を明示待機

## 3. 後続課題（本タスクスコープ外）

| 項目 | 想定タスク化 |
|------|-------------|
| section-scoped cache invalidation API 設計 | followup-003（仮） |
| retry 完了後の focus 戻し（useRef） | followup-004（仮） |
| Button primitive の loading variant 拡張 | design-system 側 task |
| section disappearance 時の focus trap | a11y followup |
