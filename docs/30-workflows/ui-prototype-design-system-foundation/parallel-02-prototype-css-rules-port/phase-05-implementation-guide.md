---
phase: 5
title: 実装ガイド — globals.css 追加 CSS の具体例
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 1. 編集対象

`apps/web/src/styles/globals.css`

## 2. 挿入位置

`globals.css` は他サブワークフローと同じ `@layer components` を共有するため、固定行番号ではなく marker / layer 構造で挿入位置を判定する。

本サブワークフローの追加は、既存 parallel-09 ブロックを壊さず、`@layer components` 内の selector hook 領域に G3-1 / G3-2 / G3-3 の 3 marker block として配置する。既に `ui-prototype-design-system-foundation selector hooks` などの暫定ブロックが存在する場合は、重複追加ではなく本ガイドの marker block へ正規化する。

```css
  /* === parallel-09 G9-7 focus-visible / reduced motion === */
  :focus-visible { ... }
  @media (prefers-reduced-motion: reduce) { ... }

  /* ← ここから parallel-02 のブロックを挿入または正規化する */
  /* ↓↓↓ 本ガイドの §3 / §4 / §5 を順に append ↓↓↓ */

}  /* ← @layer components の閉じ括弧 */
```

> 注: parallel-01 が同時に編集中の場合、parallel-01 のブロックも同じ位置に append される。マーカーコメントで責務範囲を明示し、git auto-merge を期待する (Phase 9 で詳細)。

## 3. Step 1 — G3-1 Tag pill (追加 CSS)

```css
  /* === parallel-02 G3-1 tag pill (start) === */
  [data-component="tag-pill"] {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: var(--ubm-color-surface-bg);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-sm);
    color: var(--ubm-color-text-secondary);
    font-size: var(--ubm-text-xs);
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease),
      color var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease),
      border-color var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease);
  }
  [data-component="tag-pill"]:hover {
    border-color: var(--ubm-color-border-strong);
  }
  [data-component="tag-pill"][aria-selected="true"] {
    background: var(--ubm-color-text-primary);
    color: var(--ubm-color-surface-panel);
    border-color: var(--ubm-color-text-primary);
  }
  /* === parallel-02 G3-1 tag pill (end) === */
```

## 4. Step 2 — G3-2 Member card hover (追加 CSS)

```css
  /* === parallel-02 G3-2 member card hover (start) === */
  [data-component="member-card"] {
    transition:
      border-color var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease),
      box-shadow var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease);
  }
  [data-component="member-card"]:hover {
    border-color: var(--ubm-color-border-strong);
    box-shadow: var(--ubm-shadow-sm);
  }
  [data-component="member-card"]:focus-within {
    outline: 2px solid var(--ubm-color-accent);
    outline-offset: 2px;
  }
  /* === parallel-02 G3-2 member card hover (end) === */
```

## 5. Step 3 — G3-3 Visibility marker (追加 CSS)

```css
  /* === parallel-02 G3-3 visibility marker (start) === */
  [data-visibility] {
    position: relative;
    padding-inline-start: 12px;
    border-left: 3px solid var(--ubm-color-border-default);
  }
  [data-visibility="public"] {
    border-left-color: var(--ubm-color-ok);
  }
  [data-visibility="member"] {
    border-left-color: var(--ubm-color-zone-b);
  }
  [data-visibility="admin"] {
    border-left-color: var(--ubm-color-danger);
  }
  [data-visibility]::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-inline-end: 6px;
    border-radius: 999px;
    background: var(--ubm-color-border-default);
    vertical-align: middle;
  }
  [data-visibility="public"]::before {
    background: var(--ubm-color-ok);
  }
  [data-visibility="member"]::before {
    background: var(--ubm-color-zone-b);
  }
  [data-visibility="admin"]::before {
    background: var(--ubm-color-danger);
  }
  /* === parallel-02 G3-3 visibility marker (end) === */
```

## 6. 重複なし確認手順

実装着手前および完了後に次のコマンドを実行し、既存規則と衝突がないことを確認する:

```bash
# 既存規則に同一 selector が存在する場合は、parallel-02 marker block 内に正規化する
grep -nE 'data-component="(tag-pill|member-card)"' apps/web/src/styles/globals.css
grep -nE 'data-visibility=' apps/web/src/styles/globals.css

# 期待値:
# - 新規着手前: 0 件
# - 暫定実装済み: marker なしの selector が見つかるため、本ガイドの 3 block へ置換する
# - 完了後: 各 selector が parallel-02 マーカー内のみに出現する
```

## 7. token 参照表 (使用する `--ubm-*`)

| token | 用途 |
|-------|------|
| `--ubm-color-surface-bg` | tag pill base background |
| `--ubm-color-surface-panel` | tag pill selected text color |
| `--ubm-color-text-primary` | tag pill selected background |
| `--ubm-color-text-secondary` | tag pill text |
| `--ubm-color-border-default` | tag pill / visibility default border |
| `--ubm-color-border-strong` | hover border |
| `--ubm-color-accent` | focus-within outline |
| `--ubm-color-ok` | visibility=public border |
| `--ubm-color-zone-b` | visibility=member border |
| `--ubm-color-danger` | visibility=admin border |
| `--ubm-radius-sm` | tag pill radius |
| `--ubm-shadow-sm` | member card hover shadow |
| `--ubm-text-xs` | tag pill font-size |
| `--ubm-dur-fast` | transition duration (fallback `.15s`) |
| `--ubm-ease-standard` | transition easing (fallback `ease`) |

すべて `apps/web/src/styles/tokens.css` で既定義済。未定義 token があれば本サブワークフローでは追加せず、parallel-01 / serial-00 側で対処する。

## 8. ロールバック手順

すべての追加は `/* === parallel-02 ... (start/end) === */` マーカーで囲まれているため、`sed` で安全に除去可能:

```bash
# マーカー間を削除 (確認後に実行)
sed -i.bak -e '/parallel-02 G3-[123].*(start)/,/parallel-02 G3-[123].*(end)/d' apps/web/src/styles/globals.css
```
