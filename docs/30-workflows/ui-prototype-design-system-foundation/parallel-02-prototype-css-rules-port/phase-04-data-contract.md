---
phase: 4
title: HTML 属性契約 — data-component / aria-selected / data-visibility
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 4 — HTML 属性契約

[実装区分: 実装仕様書]

## 1. 概要

本サブワークフローの CSS 規則は markup 側の `data-*` / `aria-*` 属性を契約として依存する。属性の値域・意味・付与責任を明示する。

## 2. `data-component` (本件で使用する値)

| 値 | semantics | 付与対象要素 | 付与責任 |
|----|-----------|------------|---------|
| `tag-pill` | カタログ / フィルタの tag 選択ボタン | `<button>` | serial-05 (`MemberFilters.client.tsx`) |
| `member-card` | 会員カード (一覧グリッド単位) | `<article>` または `<a>` ラッパー | 既存 `MemberCard.tsx` で付与済 |

値の追加は本サブワークフローのスコープ外。Tailwind / Module CSS で扱わない (selector 規則経由のみ)。

## 3. `aria-selected`

| 値 | semantics | 付与対象 |
|----|-----------|---------|
| `"true"` | 選択中 | tag pill button |
| `"false"` | 非選択 (省略可) | tag pill button |
| 省略 | 非選択 と同義 | — |

a11y の観点で screen reader に伝搬する正規属性として運用。`role="tab"` / `role="option"` などの role は本件で要求しない (button のままで OK)。

## 4. `data-visibility`

| 値 | semantics | 付与対象 | 既定値 |
|----|-----------|---------|-------|
| `"public"` | 公開範囲: 一般公開 | `<section>` (MemberDetailSections) | `"public"` |
| `"member"` | 公開範囲: 会員限定 | 同上 | — |
| `"admin"` | 公開範囲: 管理者のみ | 同上 | — |

MVP 期間中は API に `visibility` field が無いため、すべての section に `data-visibility="public"` 固定で出力する (parallel-03 spec §4.3 を継承)。

## 5. 契約違反時の挙動

| 違反 | CSS 側の挙動 |
|------|-------------|
| `[data-component="tag-pill"]` 付与なし | 選択時 fill が適用されない (Tailwind default のみ) |
| `aria-selected` 未付与 | 非選択 styling のまま |
| `[data-visibility]` 未付与 | left-border + icon が描画されない (default の section styling) |
| `[data-visibility]` に未定義値 (例: `"private"`) | base 規則のみ適用、左 border / icon は描画されない (fail-safe) |

CSS は markup 不整合に対して **silent ignore** で振る舞う (例外 throw 不要)。markup 側のテストで属性付与を担保する。

## 6. ARIA / a11y 観点

| 規則 | 期待される a11y 影響 |
|------|--------------------|
| `aria-selected="true"` | screen reader が「選択中」と読み上げる |
| visibility marker (`::before` dot) | 装飾扱い、a11y tree に意味を持たせない。意味は本文ラベル側で担保する |
| focus-within outline | card 内 link へキーボード focus した時に card 全体の focus を可視化 |

## 7. JSON Schema 風の契約 (markup 期待 shape)

```ts
// tag pill button
{
  tag: "button",
  attrs: {
    type: "button",
    "data-component": "tag-pill",
    "aria-selected": "true" | "false",
  }
}

// member card
{
  tag: "article" | "a",
  attrs: {
    "data-component": "member-card",
  }
}

// visibility section
{
  tag: "section",
  attrs: {
    "data-section": string,
    "data-visibility": "public" | "member" | "admin",
  }
}
```

## 8. 将来拡張余地

- `data-visibility` に値追加 (例: `"officer"`) する場合は本ファイル §4 を更新し、`globals.css` に対応 selector を追加する
- `data-component` 値の追加は本サブワークフローのスコープ外 (新規 primitive 追加に該当)
