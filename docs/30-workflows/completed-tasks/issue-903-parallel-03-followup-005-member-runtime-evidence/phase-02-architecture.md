---
phase: 2
title: Architecture
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 2 — Architecture

[実装区分: 実装仕様書]

## 2.1 構成図

```
apps/web/app/
  (member)/                       ← member route group（既存 layout.tsx + 移動後の profile/）
    layout.tsx                    （既存・data-* 契約保持）
    layout.spec.tsx               （既存）
    profile/                      ← 本タスクで profile/ を移動
      page.tsx
      error.tsx
      loading.tsx
      not-found.tsx
      _components/
      _lib/
      __tests__/
  profile/                        ← 移動後に削除
```

```
apps/web/playwright/tests/
  parallel-03-admin-shell-scrape.spec.ts   （既存・複製ベース）
  parallel-03-member-shell-scrape.spec.ts  ← 本タスクで新規
```

```
docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/
  outputs/phase-11/
    dom-scrape-admin.txt          （既存）
    dom-scrape-member.txt         ← 本タスクで新規
    screenshots/
      member-shell.png            ← 本タスクで新規
  phase-11-evidence-inventory.md  ← EV-13 / EV-16 を present 昇格
```

## 2.2 設計判断

| 判断 | 採用 | 理由 |
|------|------|------|
| serial-05 完了待ちか先行解消か | **先行解消** | serial-05 着手見込み未定。`/profile` が既存し移動だけで EV-13 対象成立 |
| `/profile` の扱い | **`(member)/profile/` へ移動** | route group は URL に影響しない。member layout の data-* 契約が自然適用される |
| scrape spec の構造 | followup-002 admin spec の複製 | パターン確立済み。差分は target route + grep target のみ |
| EV-16 screenshot | **本タスクで取得** | serial-07 委譲は既に R-07 で破綻。本タスクで 1 枚 baseline を確定 |

## 2.3 委譲先との関係

- **serial-07-regression-evidence**: full chrome multi-viewport baseline は引き続き serial-07 / UT-DSF-07 (#829) の責務。本タスクの member-shell.png は 1280x800 1 枚の baseline で、serial-07 が将来追加する full chrome set とは別レイヤ
- **serial-05-page-routes-blueprint-binding**: 本タスクで `/profile` を `(member)` 配下に land させることで、serial-05 の member route 整備の **先行サンプル**を提供する。serial-05 完了後の追加 child route は本 spec の構造を継承可能
