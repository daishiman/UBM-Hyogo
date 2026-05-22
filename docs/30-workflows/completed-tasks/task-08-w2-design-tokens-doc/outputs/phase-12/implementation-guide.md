# Implementation Guide

## Part 1: 中学生レベル

Web ページの色や余白を毎回ばらばらに書くと、あとで直す時に探し回ることになる。学校で使う持ち物リストのように、「この色はこの名前」「この余白はこの名前」と決めた辞書を作ると、全員が同じ名前で同じものを使える。`--ubm-*` は UBM 専用の名前札で、他の道具と混ざらないようにするための印。OKLch は人の目で見た時の差が分かりやすい色の書き方で、`@theme inline` はその名前札を Tailwind の道具箱へつなぐための入口。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| token | 色や余白に付ける名前札 |
| prefix | 名前の先頭に付ける目印 |
| OKLch | 見た目の差を扱いやすい色の書き方 |
| Tailwind | 画面を作るための道具箱 |
| fallback | うまく使えない時の代わり |

## Part 2: 技術者レベル

Flow:

```text
styles.css L1-L70
  -> docs/00-getting-started-manual/specs/09b-design-tokens.md
  -> apps/web/src/styles/tokens.css (task-09)
  -> apps/web/src/styles/globals.css @theme inline (task-09)
  -> primitives (task-10)
  -> verify-design-tokens (task-18)
```

Current canonical facts:

- token SSOT: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- machine-readable canonical section: §9 JSON
- human-readable values: §3〜§8
- old short token mapping: §2 compatibility table
- dark mode: placeholder only, not a PASS contrast claim
- sRGB fallback: `@supports not (color: oklch(0% 0 0))`

Interface contract:

```ts
type DesignTokenLeaf = {
  value: string;
  css: `--ubm-${string}`;
};

type DesignTokenDocument = Record<string, unknown>;
```

Validation commands are recorded in Phase 11 evidence. Downstream implementation must not invent token values outside 09b.
