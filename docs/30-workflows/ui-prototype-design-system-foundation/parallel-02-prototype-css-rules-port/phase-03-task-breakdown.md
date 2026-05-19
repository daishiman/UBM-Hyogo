---
phase: 3
title: タスク分解 — G3-1 / G3-2 / G3-3 を 3 step
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. SRP に基づく 3 step 分割

| Step | 責務 | 編集対象 | 想定 diff 行数 |
|------|------|----------|---------------|
| Step 1 (G3-1) | tag pill base + selected + hover の CSS 規則追加 | `apps/web/src/styles/globals.css` | +20 行 |
| Step 2 (G3-2) | member card base + hover + focus-visible の CSS 規則追加 | `apps/web/src/styles/globals.css` | +15 行 |
| Step 3 (G3-3) | visibility marker base + 値別 3 種 + icon ::before の CSS 規則追加 | `apps/web/src/styles/globals.css` | +30 行 |

各 step は独立して commit / push 可能。順序は G3-1 → G3-2 → G3-3 を推奨 (selector specificity の単純順)。

## 2. Step 詳細

### 2.1 Step 1 — G3-1 Tag pill

- 編集箇所: `globals.css` line 215 (`@layer components` 閉じ括弧の直前) に append
- 追加ブロック:
  - マーカーコメント `/* === parallel-02 G3-1 tag pill (start) === */`
  - base selector `[data-component="tag-pill"]`
  - hover / selected / 非選択時の差分のみ記述
  - 末尾マーカー `(end)`
- 検証: `grep "data-component=\"tag-pill\"" globals.css` で 3 件以上ヒット

### 2.2 Step 2 — G3-2 Member card hover

- 編集箇所: Step 1 の `(end)` マーカー直後に append
- 追加ブロック:
  - マーカーコメント `/* === parallel-02 G3-2 member card hover (start) === */`
  - base + hover + focus-visible
- 検証: Playwright visual snapshot で hover state が transition 中継できる

### 2.3 Step 3 — G3-3 Visibility marker

- 編集箇所: Step 2 の `(end)` マーカー直後に append
- 追加ブロック:
  - マーカーコメント `/* === parallel-02 G3-3 visibility marker (start) === */`
  - base `[data-visibility]`
  - 値別 (public / member / admin)
  - icon `::before` 3 種
- 検証: 3 つの値で left-border 色と icon が切り替わることを browser dev tool で確認

## 3. 完了判定 (per step)

| Step | 完了判定 |
|------|---------|
| Step 1 | `pnpm typecheck && pnpm lint && pnpm build` green / verify-design-tokens green |
| Step 2 | 同上 |
| Step 3 | 同上 + Phase 11 evidence (snapshot 3 種) |

## 4. 依存関係

```
serial-00-design (前提)
   ↓
Step 1 (G3-1) ── 独立
Step 2 (G3-2) ── 独立
Step 3 (G3-3) ── 独立
```

3 step は順序依存なし。単一 commit にまとめても良いが、レビュー容易性のため 3 commit に分割する方針。

## 5. parallel-01 との並列実行

parallel-01 と本サブワークフローは別 worktree で並列実行可能。両者が完了した時点で `serial-05` に進む。マージタイミングが衝突した場合は Phase 9 のリスク欄に従って解消する。

## 6. 見積もり

- 設計時間: 0 (本サブワークフローで完了)
- 実装時間: 1-2 時間 (CSS 追加のみ)
- 検証時間: 30 分 (typecheck/lint/build/playwright)

CONST_007: 1 サイクル内で完了可能。
