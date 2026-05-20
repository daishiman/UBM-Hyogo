---
phase: 2
title: アーキテクチャ — selector specificity / cascade / parallel-01 merge 戦略
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. layer / cascade 構造

`apps/web/src/styles/globals.css` は次の 3 layer を持つ:

```
@layer base       — reset + body 既定
@layer components — primitive 共通規則 (本サブワークフローが追加対象)
@layer utilities  — Tailwind utility 群
```

`@layer components` 内では宣言順序が specificity と同等の役割を持つため、本サブワークフローは **既存規則の末尾に追加**する方針を取る。

## 2. selector specificity 設計

| 規則 | selector | specificity (a,b,c) | cascade 上の位置 |
|------|----------|-------------------|------------------|
| G3-1 base | `[data-component="tag-pill"]` | 0,1,0 | components 末尾 |
| G3-1 selected | `[data-component="tag-pill"][aria-selected="true"]` | 0,2,0 | base の直後 |
| G3-1 hover | `[data-component="tag-pill"]:hover` | 0,2,0 | selected の直後 |
| G3-2 base | `[data-component="member-card"]` | 0,1,0 | tag pill 群の後 |
| G3-2 hover | `[data-component="member-card"]:hover` | 0,2,0 | base 直後 |
| G3-2 focus | `[data-component="member-card"]:focus-within` | 0,2,0 | hover 直後 |
| G3-3 base | `[data-visibility]` | 0,1,0 | member card の後 |
| G3-3 値別 | `[data-visibility="public"]` etc. | 0,2,0 | base 直後 |
| G3-3 icon | `[data-visibility="public"]::before` etc. | 0,2,1 | 値別の直後 |

Tailwind utility (utilities layer) は単一 class selector (0,1,0) のため、`@layer components` の 0,2,0 規則は utility に上書きされない (layer 順序で勝つ)。

## 3. parallel-01 との merge 戦略

### 3.1 共有編集ファイル

`apps/web/src/styles/globals.css` を parallel-01 (page rhythm) と本サブワークフロー (selector 規則) が同時に編集する。

### 3.2 責務分離

| サブワークフロー | 追加 selector カテゴリ | 配置ブロック |
|-----------------|----------------------|--------------|
| parallel-01 | `body`, `[data-route]`, `[data-section]`, `[data-card]`, `[data-shell]`, `[data-text]` (構造系) | `@layer components` の前半 |
| parallel-02 (本件) | `[data-component="tag-pill"]`, `[data-component="member-card"]`, `[data-visibility]` (インタラクション系) | `@layer components` の後半 |

### 3.3 マーカーコメント

各サブワークフローの担当範囲を merge 時に判別できるよう、追加ブロックの先頭・末尾に次のマーカーコメントを必ず置く:

```css
/* === parallel-02 G3-1 tag pill selected (start) === */
...
/* === parallel-02 G3-1 tag pill selected (end) === */
```

parallel-01 側も同様 (`/* === parallel-01 rhythm ... === */`) のため、git の auto-merge が成功しやすい。

### 3.4 衝突回避ルール

- 両サブワークフローで同一 selector を書かない (本件は `[data-component]` / `[data-visibility]` のみを担当)
- 既存 parallel-09 G9-1..G9-7 ブロックは触らない (末尾に追加)
- `pnpm sync:resolve` 経路があるため、`@layer components` 内での衝突は基本的に並列 append で回避される

## 4. 既存規則との重複検査

実装着手前に次の grep を実行し、重複がないことを確認する:

```bash
grep -nE 'data-component="(tag-pill|member-card)"|data-visibility=' apps/web/src/styles/globals.css
```

期待値: 0 件 (既存 parallel-09 ブロックには含まれていない)

## 5. transition / reduced motion との整合

- transition は `var(--ubm-dur-fast)` / `var(--ubm-ease-standard)` を使用 (tokens.css に定義済)
- `@media (prefers-reduced-motion: reduce)` ブロックは既存 `@layer components` 末尾 (line 205) にあるため、本件の規則も自動的に対象になる (重複定義しない)

## 6. AppShell layout との接続

本サブワークフローが追加する selector は markup の `data-*` / `aria-*` 属性に依存する。markup 側付与は次サブワークフローで実施される:

| 属性 | 付与責任 |
|------|---------|
| `data-component="tag-pill"` + `aria-selected` | serial-05 (`MemberFilters.client.tsx`) |
| `data-component="member-card"` | 既存 `MemberCard.tsx` で付与済 (parallel-03 spec で確認済) |
| `data-visibility` | serial-05 / serial-06 (`MemberDetailSections.tsx`) |

本サブワークフローは CSS のみ提供し、markup 側変更は依存サブワークフローに委譲する。

## 7. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|----------|
| Tailwind plugin で `tag-pill-selected` utility を生やす | utility 層が肥大化。selector 規則の方が markup と意味が一致 |
| 各 component の module.css で個別実装 | プロトタイプの「全画面で機械的に効く selector」設計を再現できない |
| inline style で hover を実装 | hover/focus-within が記述不能 |
| parallel-01 と同一ブロックに混在 | merge 衝突リスク増大。責務分離マーカーで分ける方が安全 |
