# Implementation Guide

## Part 1: 中学生にも分かる説明

この作業は、画面の部品に同じ見た目のルールを貼るためのもの。タグを選んだら色が変わる、カードにマウスを乗せたら少し目立つ、公開範囲ごとに印がつく、という3つの約束をまとめている。

たとえば学校で「赤いシールは先生だけ、青いシールはクラス全員、緑のシールは全校向け」と決めると、誰が見ても意味が分かる。Web画面でも同じように、部品に決まった印を付けて、同じルールで見た目を変える。

気をつけることは、同じ `globals.css` を別の作業でも触る点。だから、どこからどこまでが parallel-02 の担当か分かるように、G3-1 / G3-2 / G3-3 の marker を必ず残す。

### 専門用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| selector | どの部品にルールを当てるか決める目印 |
| marker | 作業範囲が分かる名札 |
| tag pill | タグを選ぶ小さなボタン |
| member card | 会員を紹介するカード |
| visibility | 誰に見せる情報かを示す区分 |

## Part 2: 技術者向け実装手順

1. `apps/web/src/styles/globals.css` の `@layer components` 内に G3-1 / G3-2 / G3-3 の marker block を置く。
2. 既存の暫定 hook がある場合は重複追加せず、marker block へ正規化する。
3. 色、影、motion は `--ubm-*` token を使い、HEX / Tailwind arbitrary color を追加しない。
4. `MemberFilters.client.tsx` の active tag button に `data-component="tag-pill"` と `aria-selected="true"` を付け、G3-1 selected/hover が実DOMで成立するようにする。
5. `grep -c 'parallel-02.*(start)'` と `grep -c 'parallel-02.*(end)'` はどちらも 3 を期待値にする。

### TypeScript / DOM Contract

```ts
type Parallel02Component = "tag-pill" | "member-card";
type Visibility = "public" | "member" | "admin";

type TagPillAttrs = {
  "data-component": "tag-pill";
  "aria-selected"?: "true" | "false";
};

type MemberCardAttrs = {
  "data-component": "member-card";
};

type VisibilityAttrs = {
  "data-visibility": Visibility;
};
```

### API Signature / Usage

新規 API endpoint は追加しない。runtime usage は DOM 属性契約で、CSS selector が次の形を取る。

```css
[data-component="tag-pill"][aria-selected="true"] { ... }
[data-component="member-card"]:focus-within { ... }
[data-visibility="public"]::before { ... }
```

### Error Handling / Edge Cases

- `aria-selected` がない tag pill は非選択状態として扱う。
- `member-card` 自体は `article` で focusable ではないため、内側 link focus を `:focus-within` で拾う。
- `data-visibility` が未知値の場合は base border のみ適用し、値別 marker は出さない。
- visibility marker は絵文字ではなく CSS dot にし、OS / font 差分による screenshot drift を避ける。

### Configurable Parameters / Constants

| parameter | value |
| --- | --- |
| transition duration | `--ubm-dur-fast` fallback `0.15s` |
| easing | `--ubm-ease-standard` fallback `ease` |
| tag spacing | `gap: 6px`, `padding: 5px 10px` |
| visibility border | `3px solid` |
| visibility marker | `8px` dot with `margin-inline-end: 6px` |

## Verification Commands

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web build
pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/MemberFilters.client.spec.tsx
pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/parallel-02-css-rules.spec.ts --project=visual-chromium
grep -c 'parallel-02.*(start)' apps/web/src/styles/globals.css
grep -c 'parallel-02.*(end)' apps/web/src/styles/globals.css
grep -rEn 'bg-\[#|text-\[#|border-\[#' apps/web/src
```
