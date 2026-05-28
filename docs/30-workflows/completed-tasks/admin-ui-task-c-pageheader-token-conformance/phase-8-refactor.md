---
spec_classification: implementation_spec
state: spec_created
phase: 8
phase_name: リファクタ
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 8: リファクタ

## 8.1 同サイクル内のリファクタ範囲

| 項目 | 内容 | 範囲 |
|------|------|------|
| eyebrow tracking 値 | `tracking-[0.12em]` の直値を `--ubm-eyebrow-tracking` トークン化 | tokens.css 1 行追加 + AdminPageHeader 1 箇所 |
| `EmptyState` → `AdminEmptyState` | identity-conflicts/page.tsx の page 層 EmptyState を `_shared/AdminEmptyState` 経由に統一 | identity-conflicts 1 箇所のみ。panel 内部の EmptyState は touched しない (I-C2) |
| Tailwind palette token 化 | identity-conflicts/page.tsx の `text-zinc-*` / `border-zinc-*` / `divide-zinc-*` / `text-blue-*` を `var(--ubm-color-*)` 経由に置換 | page.tsx のみ (panel 内部は touched しない) |
| 独自 `<main>` 撤去 | identity-conflicts/page.tsx | 1 箇所 |

## 8.2 同サイクル外（やらないこと）

- panel 内部 (`TagQueuePanel` 等) の palette 違反 → 検出された場合は `verify-design-tokens` が gate 化しているため、本タスクで panel 内も同サイクル修正する。ただし panel の API / contract は維持する。
- 新 component 抽出（I-C1）
- AdminPageHeader 配下の primitive 分解

## 8.3 完了条件

- AdminPageHeader 内に直値 `tracking-[0.12em]` が残らない
- page.tsx 層に `EmptyState` の直 import が残らない (`AdminEmptyState` 経由のみ)
- `verify-design-tokens` green
