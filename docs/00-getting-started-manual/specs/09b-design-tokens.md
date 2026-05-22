# 09b Design Tokens

> 正本範囲: UBM Hyogo web UI の color / radius / shadow / typography / spacing / motion token values
> 出典: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70
> 作成日: 2026-05-07
> 状態: spec_created / docs-only / NON_VISUAL

## 1. 位置づけ

このファイルは、UBM Hyogo の画面実装で使うデザイントークン値の正本である。
`09-ui-ux.md` は画面契約と体験原則、`09c-primitives.md` は UI primitive の使い方、`09e` 以降は画面 blueprint を扱う。
本ファイルは値と名前だけを扱い、コンポーネント実装や Tailwind 設定ファイルの実作成は task-09 / task-10 / task-18 に渡す。

値の第一出典は prototype `styles.css` L1-L70 である。
stone / warm / cool の 3 theme、OKLch status colors、shadow、radius、font family は出典値を改変しない。
出典に明示されていない text size、spacing、motion は prototype class の使用密度に合わせた MVP token としてここで固定する。

正本優先順位は次の通り。

| 優先 | 対象 | 用途 |
| --- | --- | --- |
| 1 | §9 JSON 表現 | 機械可読正本。後続 generator / verification の入力 |
| 2 | §3〜§8 の表 | 人間可読正本。レビューと手作業転記の入力 |
| 3 | §10 Tailwind template | task-09 へ渡す実装例。値の完全コピーではなく接続例 |
| 4 | prototype `styles.css` | 値の出典。task-08 完了後は本ファイルが参照正本 |

drift が起きた場合は §9 JSON を勝者とし、§3〜§8 の表を追従させる。
§10 template は導線であり、値の完全性判定には使わない。

## 2. 命名規則

CSS 変数はすべて `--ubm-*` prefix を使う。
prototype の `--bg` / `--text` / `--accent` などの短い名前は、実装時に下表の長い semantic name へ置き換える。
短縮名は互換説明としてのみ残し、新規実装の正本名にはしない。

| 種別 | 正本 pattern | 例 |
| --- | --- | --- |
| surface color | `--ubm-color-surface-*` | `--ubm-color-surface-bg` |
| text color | `--ubm-color-text-*` | `--ubm-color-text-primary` |
| border color | `--ubm-color-border-*` | `--ubm-color-border-default` |
| accent color | `--ubm-color-accent[-soft|-ink]` | `--ubm-color-accent-soft` |
| status color | `--ubm-color-{ok|warn|danger|info}[-soft]` | `--ubm-color-warn-soft` |
| zone color | `--ubm-color-zone-{a|b|c|d|e}` | `--ubm-color-zone-a` |
| radius | `--ubm-radius-*` | `--ubm-radius-md` |
| shadow | `--ubm-shadow-*` | `--ubm-shadow-md` |
| font family | `--ubm-font-*` | `--ubm-font-body` |
| text size | `--ubm-text-*` | `--ubm-text-base` |
| spacing | `--ubm-space-*` | `--ubm-space-4` |
| duration | `--ubm-dur-*` | `--ubm-dur-base` |
| easing | `--ubm-ease-*` | `--ubm-ease-standard` |

旧 primitive spec との互換 mapping は次の通り。
`09c-primitives.md` に残る短縮名は task-10 実装時にこの表で置換する。

| 旧 token / prototype var | 正本 token | 備考 |
| --- | --- | --- |
| `--bg` / `--ubm-bg` / `--ubm-color-bg` | `--ubm-color-surface-bg` | page background |
| `--bg-2` / `--ubm-bg-2` / `--ubm-color-surface-2` | `--ubm-color-surface-bg-2` | alternate surface |
| `--panel` / `--ubm-panel` / `--ubm-color-panel` | `--ubm-color-surface-panel` | card panel |
| `--panel-2` | `--ubm-color-surface-panel-2` | raised panel |
| `--border` / `--ubm-border` / `--ubm-color-border` | `--ubm-color-border-default` | standard border |
| `--border-2` / `--ubm-border-2` | `--ubm-color-border-strong` | stronger border |
| `--text` / `--ubm-text` / `--ubm-color-ink` | `--ubm-color-text-primary` | primary text |
| `--text-2` / `--ubm-text-2` / `--ubm-color-muted` | `--ubm-color-text-secondary` | secondary text |
| `--text-3` / `--ubm-text-3` / `--ubm-color-fg-muted` | `--ubm-color-text-muted` | tertiary text |
| `--accent` / `--ubm-accent` | `--ubm-color-accent` | area accent |
| `--accent-soft` / `--ubm-accent-soft` | `--ubm-color-accent-soft` | soft accent surface |
| `--accent-ink` / `--ubm-accent-ink` | `--ubm-color-accent-ink` | readable accent text |
| `--ok` / `--success` / `--ubm-color-success` | `--ubm-color-ok` | success / ok |
| `--warn` / `--warning` / `--ubm-color-warning` | `--ubm-color-warn` | warning |
| `--danger` / `--ubm-color-danger` | `--ubm-color-danger` | danger |
| `--info` / `--ubm-color-info` | `--ubm-color-info` | info |
| `--r-sm` | `--ubm-radius-sm` | radius |
| `--r-md` | `--ubm-radius-md` | radius |
| `--r-lg` | `--ubm-radius-lg` | radius |
| `--font` | `--ubm-font-body` | body font stack |

## 3. Color Tokens

Color token は surface / text / border / accent / status / zone に分ける。
accent と status の base token は背景、badge、border、focus ring などの面積要素に使う。
本文テキストに直接使う場合は `-ink` variant または text token を使う。

### 3.1 Surface / Text / Border

| token | stone value | source | role |
| --- | --- | --- | --- |
| `--ubm-color-surface-bg` | `#f5f4f1` | `--bg` L3 | page background |
| `--ubm-color-surface-bg-2` | `#ebe9e3` | `--bg-2` L4 | alternate background |
| `--ubm-color-surface-panel` | `#ffffff` | `--panel` L5 | card panel |
| `--ubm-color-surface-panel-2` | `#fafaf8` | `--panel-2` L6 | subtle raised panel |
| `--ubm-color-border-default` | `#e7e5df` | `--border` L7 | default border |
| `--ubm-color-border-strong` | `#d6d3cc` | `--border-2` L8 | emphasized border |
| `--ubm-color-text-primary` | `#1a1917` | `--text` L9 | primary text |
| `--ubm-color-text-secondary` | `#57554e` | `--text-2` L10 | secondary text |
| `--ubm-color-text-muted` | `#8a877e` | `--text-3` L11 | muted text |

### 3.2 Accent / Status

| token | stone value | source | role |
| --- | --- | --- | --- |
| `--ubm-color-accent` | `oklch(0.52 0.10 55)` | `--accent` L12 | brand emphasis |
| `--ubm-color-accent-soft` | `oklch(0.95 0.03 65)` | `--accent-soft` L13 | accent background |
| `--ubm-color-accent-ink` | `oklch(0.38 0.10 55)` | `--accent-ink` L14 | readable accent text |
| `--ubm-color-ok` | `oklch(0.55 0.10 155)` | `--ok` L15 | success / ok |
| `--ubm-color-ok-soft` | `oklch(0.95 0.04 155)` | `--ok-soft` L16 | success surface |
| `--ubm-color-warn` | `oklch(0.62 0.12 75)` | `--warn` L17 | warning |
| `--ubm-color-warn-soft` | `oklch(0.96 0.05 80)` | `--warn-soft` L18 | warning surface |
| `--ubm-color-danger` | `oklch(0.55 0.15 25)` | `--danger` L19 | destructive / error |
| `--ubm-color-danger-soft` | `oklch(0.95 0.04 30)` | `--danger-soft` L20 | error surface |
| `--ubm-color-info` | `oklch(0.55 0.09 230)` | `--info` L21 | info |
| `--ubm-color-info-soft` | `oklch(0.96 0.025 230)` | `--info-soft` L22 | info surface |

### 3.3 Zone Alias

MVP の zone token は status / accent token の alias である。
zone に独自 hue が必要になった場合でも、下表の `--ubm-color-zone-*` だけを書き換えれば下流画面は追従する。

| zone token | alias | 用途 |
| --- | --- | --- |
| `--ubm-color-zone-a` | `var(--ubm-color-info)` | 0 to 1 |
| `--ubm-color-zone-b` | `var(--ubm-color-accent)` | 1 to 10 |
| `--ubm-color-zone-c` | `var(--ubm-color-ok)` | 10 to 100 |
| `--ubm-color-zone-d` | `var(--ubm-color-warn)` | growth / caution |
| `--ubm-color-zone-e` | `var(--ubm-color-danger)` | exception / risk |

### 3.4.1 Stone Theme

Stone is the default `:root` theme.
Warm and cool override only surface / text / border / accent values.
`ok` / `warn` / `danger` / `info` remain shared across all three themes unless a future design task changes them.

| source var | token | value |
| --- | --- | --- |
| `--bg` | `--ubm-color-surface-bg` | `#f5f4f1` |
| `--bg-2` | `--ubm-color-surface-bg-2` | `#ebe9e3` |
| `--panel` | `--ubm-color-surface-panel` | `#ffffff` |
| `--panel-2` | `--ubm-color-surface-panel-2` | `#fafaf8` |
| `--border` | `--ubm-color-border-default` | `#e7e5df` |
| `--border-2` | `--ubm-color-border-strong` | `#d6d3cc` |
| `--text` | `--ubm-color-text-primary` | `#1a1917` |
| `--text-2` | `--ubm-color-text-secondary` | `#57554e` |
| `--text-3` | `--ubm-color-text-muted` | `#8a877e` |
| `--accent` | `--ubm-color-accent` | `oklch(0.52 0.10 55)` |
| `--accent-soft` | `--ubm-color-accent-soft` | `oklch(0.95 0.03 65)` |
| `--accent-ink` | `--ubm-color-accent-ink` | `oklch(0.38 0.10 55)` |
| `--ok` | `--ubm-color-ok` | `oklch(0.55 0.10 155)` |
| `--ok-soft` | `--ubm-color-ok-soft` | `oklch(0.95 0.04 155)` |
| `--warn` | `--ubm-color-warn` | `oklch(0.62 0.12 75)` |
| `--warn-soft` | `--ubm-color-warn-soft` | `oklch(0.96 0.05 80)` |
| `--danger` | `--ubm-color-danger` | `oklch(0.55 0.15 25)` |
| `--danger-soft` | `--ubm-color-danger-soft` | `oklch(0.95 0.04 30)` |
| `--info` | `--ubm-color-info` | `oklch(0.55 0.09 230)` |
| `--info-soft` | `--ubm-color-info-soft` | `oklch(0.96 0.025 230)` |

### 3.4.2 Warm Theme

| source var | token | value |
| --- | --- | --- |
| `--bg` | `--ubm-color-surface-bg` | `#f7f2ea` |
| `--bg-2` | `--ubm-color-surface-bg-2` | `#eee5d5` |
| `--panel` | `--ubm-color-surface-panel` | `#fffcf6` |
| `--panel-2` | `--ubm-color-surface-panel-2` | `#fbf6ec` |
| `--border` | `--ubm-color-border-default` | `#ece2d1` |
| `--border-2` | `--ubm-color-border-strong` | `#d8c9b0` |
| `--text` | `--ubm-color-text-primary` | `#22180a` |
| `--text-2` | `--ubm-color-text-secondary` | `#6b5a42` |
| `--text-3` | `--ubm-color-text-muted` | `#9a8a6e` |
| `--accent` | `--ubm-color-accent` | `oklch(0.52 0.13 50)` |
| `--accent-soft` | `--ubm-color-accent-soft` | `oklch(0.94 0.05 60)` |
| `--accent-ink` | `--ubm-color-accent-ink` | `oklch(0.36 0.12 50)` |

### 3.4.3 Cool Theme

| source var | token | value |
| --- | --- | --- |
| `--bg` | `--ubm-color-surface-bg` | `#f1f3f5` |
| `--bg-2` | `--ubm-color-surface-bg-2` | `#e4e8ec` |
| `--panel` | `--ubm-color-surface-panel` | `#ffffff` |
| `--panel-2` | `--ubm-color-surface-panel-2` | `#f8fafc` |
| `--border` | `--ubm-color-border-default` | `#e2e5ea` |
| `--border-2` | `--ubm-color-border-strong` | `#cfd5dc` |
| `--text` | `--ubm-color-text-primary` | `#0f1720` |
| `--text-2` | `--ubm-color-text-secondary` | `#4a5563` |
| `--text-3` | `--ubm-color-text-muted` | `#7c8693` |
| `--accent` | `--ubm-color-accent` | `oklch(0.52 0.11 240)` |
| `--accent-soft` | `--ubm-color-accent-soft` | `oklch(0.95 0.03 235)` |
| `--accent-ink` | `--ubm-color-accent-ink` | `oklch(0.36 0.12 240)` |

### 3.5 sRGB Fallback

OKLch 非対応ブラウザでは `@supports not (color: oklch(0% 0 0))` を使う。
fallback は実装時に task-09 で gamut-mapped 近似値へ再計算してよいが、対応する OKLch token 名は変えない。

```css
@supports not (color: oklch(0% 0 0)) {
  :root {
    --ubm-color-accent: #b08049;
    --ubm-color-accent-soft: #f3ece1;
    --ubm-color-accent-ink: #6f4f25;
    --ubm-color-ok: #5e8a5d;
    --ubm-color-ok-soft: #edf7ee;
    --ubm-color-warn: #c08540;
    --ubm-color-warn-soft: #fbf2df;
    --ubm-color-danger: #b34a3b;
    --ubm-color-danger-soft: #faece8;
    --ubm-color-info: #4d7da6;
    --ubm-color-info-soft: #ecf3fb;
  }
}
```

## 4. Radius Tokens

Radius token は prototype `--r-*` を `--ubm-radius-*` へ rename する。
Card は `md` または `lg`、modal / drawer は `xl`、large hero surface は `2xl` を使う。

| token | value | source |
| --- | --- | --- |
| `--ubm-radius-sm` | `8px` | `--r-sm` |
| `--ubm-radius-md` | `12px` | `--r-md` |
| `--ubm-radius-lg` | `16px` | `--r-lg` |
| `--ubm-radius-xl` | `20px` | `--r-xl` |
| `--ubm-radius-2xl` | `28px` | `--r-2xl` |

## 5. Shadow Tokens

Shadow token は prototype の rgba 値を改変しない。
色味は stone theme の ink に寄せた neutral shadow で、theme ごとの上書きはしない。

| token | value | use |
| --- | --- | --- |
| `--ubm-shadow-xs` | `0 1px 2px rgba(24, 23, 20, 0.04)` | hairline lift |
| `--ubm-shadow-sm` | `0 1px 2px rgba(24, 23, 20, 0.05), 0 2px 6px rgba(24, 23, 20, 0.04)` | small card |
| `--ubm-shadow-md` | `0 4px 16px rgba(24, 23, 20, 0.06), 0 1px 2px rgba(24, 23, 20, 0.04)` | main card / popover |
| `--ubm-shadow-lg` | `0 20px 48px rgba(24, 23, 20, 0.10), 0 2px 6px rgba(24, 23, 20, 0.04)` | modal / drawer |

## 6. Typography Tokens

Font family は prototype `styles.css` の `--font-*` を正本とする。
Font size は UI density を固定するための semantic scale であり、画面単位で viewport 幅に連動させない。
Letter spacing は原則 0 とし、prototype の `.en` 例外は implementation utility の責務に残す。

| token | value | role |
| --- | --- | --- |
| `--ubm-font-jp` | `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif` | Japanese |
| `--ubm-font-en` | `"Geist", "SF Pro Text", system-ui, sans-serif` | Latin / UI |
| `--ubm-font-serif` | `"Noto Serif JP", serif` | editorial |
| `--ubm-font-body` | `var(--ubm-font-en), var(--ubm-font-jp)` | body |
| `--ubm-font-mono` | `"SF Mono", "Menlo", ui-monospace, monospace` | code / ids |
| `--ubm-text-xs` | `11px` | fine print |
| `--ubm-text-sm` | `12.5px` | dense label |
| `--ubm-text-base` | `13.5px` | compact body |
| `--ubm-text-md` | `14px` | body |
| `--ubm-text-lg` | `16px` | section heading |
| `--ubm-text-xl` | `20px` | page heading |
| `--ubm-text-2xl` | `24px` | hero subheading |
| `--ubm-text-3xl` | `32px` | hero heading |

## 7. Spacing Tokens

Spacing is based on a 4px grid.
Use fixed token steps for toolbars, grids, cards, and forms so dynamic labels do not shift layout unexpectedly.
Avoid one-off margins in screen code unless a primitive explicitly allows it.

| token | value | px |
| --- | --- | --- |
| `--ubm-space-0` | `0` | 0 |
| `--ubm-space-1` | `4px` | 4 |
| `--ubm-space-2` | `8px` | 8 |
| `--ubm-space-3` | `12px` | 12 |
| `--ubm-space-4` | `16px` | 16 |
| `--ubm-space-6` | `24px` | 24 |
| `--ubm-space-8` | `32px` | 32 |
| `--ubm-space-12` | `48px` | 48 |
| `--ubm-space-16` | `64px` | 64 |
| `--ubm-space-24` | `96px` | 96 |

## 8. Motion Tokens

Motion token は短く抑え、業務系 UI の反復操作を妨げない。
Transition は opacity / transform / background / border に限定し、layout を動かす animation は使わない。

| token | value | use |
| --- | --- | --- |
| `--ubm-dur-fast` | `120ms` | hover / focus |
| `--ubm-dur-base` | `180ms` | panel / dropdown |
| `--ubm-dur-slow` | `260ms` | modal / drawer |
| `--ubm-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default |
| `--ubm-ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | entry emphasis |
| `--ubm-ease-decelerate` | `cubic-bezier(0, 0, 0, 1)` | enter |
| `--ubm-ease-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | exit |

## 9. JSON 表現

The JSON block below is the machine-readable canonical representation.
Every leaf uses `{ "value": "...", "css": "--ubm-..." }`; no plain string leaves are allowed.
This keeps Style Dictionary, custom verifiers, and human review on the same schema.

```json
{
  "color": {
    "surface": {
      "bg": { "value": "#f5f4f1", "css": "--ubm-color-surface-bg" },
      "bg-2": { "value": "#ebe9e3", "css": "--ubm-color-surface-bg-2" },
      "panel": { "value": "#ffffff", "css": "--ubm-color-surface-panel" },
      "panel-2": { "value": "#fafaf8", "css": "--ubm-color-surface-panel-2" }
    },
    "text": {
      "primary": { "value": "#1a1917", "css": "--ubm-color-text-primary" },
      "secondary": { "value": "#57554e", "css": "--ubm-color-text-secondary" },
      "muted": { "value": "#8a877e", "css": "--ubm-color-text-muted" }
    },
    "border": {
      "default": { "value": "#e7e5df", "css": "--ubm-color-border-default" },
      "strong": { "value": "#d6d3cc", "css": "--ubm-color-border-strong" }
    },
    "accent": {
      "base": { "value": "oklch(0.52 0.10 55)", "css": "--ubm-color-accent" },
      "soft": { "value": "oklch(0.95 0.03 65)", "css": "--ubm-color-accent-soft" },
      "ink": { "value": "oklch(0.38 0.10 55)", "css": "--ubm-color-accent-ink" }
    },
    "status": {
      "ok": { "value": "oklch(0.55 0.10 155)", "css": "--ubm-color-ok" },
      "ok-soft": { "value": "oklch(0.95 0.04 155)", "css": "--ubm-color-ok-soft" },
      "warn": { "value": "oklch(0.62 0.12 75)", "css": "--ubm-color-warn" },
      "warn-soft": { "value": "oklch(0.96 0.05 80)", "css": "--ubm-color-warn-soft" },
      "danger": { "value": "oklch(0.55 0.15 25)", "css": "--ubm-color-danger" },
      "danger-soft": { "value": "oklch(0.95 0.04 30)", "css": "--ubm-color-danger-soft" },
      "info": { "value": "oklch(0.55 0.09 230)", "css": "--ubm-color-info" },
      "info-soft": { "value": "oklch(0.96 0.025 230)", "css": "--ubm-color-info-soft" }
    },
    "zone": {
      "a": { "value": "{color.status.info}", "css": "--ubm-color-zone-a" },
      "b": { "value": "{color.accent.base}", "css": "--ubm-color-zone-b" },
      "c": { "value": "{color.status.ok}", "css": "--ubm-color-zone-c" },
      "d": { "value": "{color.status.warn}", "css": "--ubm-color-zone-d" },
      "e": { "value": "{color.status.danger}", "css": "--ubm-color-zone-e" }
    },
    "theme": {
      "warm": {
        "surface-bg": { "value": "#f7f2ea", "css": "--ubm-color-surface-bg" },
        "surface-bg-2": { "value": "#eee5d5", "css": "--ubm-color-surface-bg-2" },
        "surface-panel": { "value": "#fffcf6", "css": "--ubm-color-surface-panel" },
        "surface-panel-2": { "value": "#fbf6ec", "css": "--ubm-color-surface-panel-2" },
        "border-default": { "value": "#ece2d1", "css": "--ubm-color-border-default" },
        "border-strong": { "value": "#d8c9b0", "css": "--ubm-color-border-strong" },
        "text-primary": { "value": "#22180a", "css": "--ubm-color-text-primary" },
        "text-secondary": { "value": "#6b5a42", "css": "--ubm-color-text-secondary" },
        "text-muted": { "value": "#9a8a6e", "css": "--ubm-color-text-muted" },
        "accent": { "value": "oklch(0.52 0.13 50)", "css": "--ubm-color-accent" },
        "accent-soft": { "value": "oklch(0.94 0.05 60)", "css": "--ubm-color-accent-soft" },
        "accent-ink": { "value": "oklch(0.36 0.12 50)", "css": "--ubm-color-accent-ink" }
      },
      "cool": {
        "surface-bg": { "value": "#f1f3f5", "css": "--ubm-color-surface-bg" },
        "surface-bg-2": { "value": "#e4e8ec", "css": "--ubm-color-surface-bg-2" },
        "surface-panel": { "value": "#ffffff", "css": "--ubm-color-surface-panel" },
        "surface-panel-2": { "value": "#f8fafc", "css": "--ubm-color-surface-panel-2" },
        "border-default": { "value": "#e2e5ea", "css": "--ubm-color-border-default" },
        "border-strong": { "value": "#cfd5dc", "css": "--ubm-color-border-strong" },
        "text-primary": { "value": "#0f1720", "css": "--ubm-color-text-primary" },
        "text-secondary": { "value": "#4a5563", "css": "--ubm-color-text-secondary" },
        "text-muted": { "value": "#7c8693", "css": "--ubm-color-text-muted" },
        "accent": { "value": "oklch(0.52 0.11 240)", "css": "--ubm-color-accent" },
        "accent-soft": { "value": "oklch(0.95 0.03 235)", "css": "--ubm-color-accent-soft" },
        "accent-ink": { "value": "oklch(0.36 0.12 240)", "css": "--ubm-color-accent-ink" }
      }
    }
  },
  "radius": {
    "sm": { "value": "8px", "css": "--ubm-radius-sm" },
    "md": { "value": "12px", "css": "--ubm-radius-md" },
    "lg": { "value": "16px", "css": "--ubm-radius-lg" },
    "xl": { "value": "20px", "css": "--ubm-radius-xl" },
    "2xl": { "value": "28px", "css": "--ubm-radius-2xl" }
  },
  "shadow": {
    "xs": { "value": "0 1px 2px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-xs" },
    "sm": { "value": "0 1px 2px rgba(24, 23, 20, 0.05), 0 2px 6px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-sm" },
    "md": { "value": "0 4px 16px rgba(24, 23, 20, 0.06), 0 1px 2px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-md" },
    "lg": { "value": "0 20px 48px rgba(24, 23, 20, 0.10), 0 2px 6px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-lg" }
  },
  "font": {
    "jp": { "value": "\"Noto Sans JP\", \"Hiragino Sans\", \"Yu Gothic\", sans-serif", "css": "--ubm-font-jp" },
    "en": { "value": "\"Geist\", \"SF Pro Text\", system-ui, sans-serif", "css": "--ubm-font-en" },
    "serif": { "value": "\"Noto Serif JP\", serif", "css": "--ubm-font-serif" },
    "body": { "value": "var(--ubm-font-en), var(--ubm-font-jp)", "css": "--ubm-font-body" },
    "mono": { "value": "\"SF Mono\", \"Menlo\", ui-monospace, monospace", "css": "--ubm-font-mono" }
  },
  "text": {
    "xs": { "value": "11px", "css": "--ubm-text-xs" },
    "sm": { "value": "12.5px", "css": "--ubm-text-sm" },
    "base": { "value": "13.5px", "css": "--ubm-text-base" },
    "md": { "value": "14px", "css": "--ubm-text-md" },
    "lg": { "value": "16px", "css": "--ubm-text-lg" },
    "xl": { "value": "20px", "css": "--ubm-text-xl" },
    "2xl": { "value": "24px", "css": "--ubm-text-2xl" },
    "3xl": { "value": "32px", "css": "--ubm-text-3xl" }
  },
  "spacing": {
    "0": { "value": "0", "css": "--ubm-space-0" },
    "1": { "value": "4px", "css": "--ubm-space-1" },
    "2": { "value": "8px", "css": "--ubm-space-2" },
    "3": { "value": "12px", "css": "--ubm-space-3" },
    "4": { "value": "16px", "css": "--ubm-space-4" },
    "6": { "value": "24px", "css": "--ubm-space-6" },
    "8": { "value": "32px", "css": "--ubm-space-8" },
    "12": { "value": "48px", "css": "--ubm-space-12" },
    "16": { "value": "64px", "css": "--ubm-space-16" },
    "24": { "value": "96px", "css": "--ubm-space-24" }
  },
  "duration": {
    "fast": { "value": "120ms", "css": "--ubm-dur-fast" },
    "base": { "value": "180ms", "css": "--ubm-dur-base" },
    "slow": { "value": "260ms", "css": "--ubm-dur-slow" }
  },
  "easing": {
    "standard": { "value": "cubic-bezier(0.2, 0, 0, 1)", "css": "--ubm-ease-standard" },
    "emphasized": { "value": "cubic-bezier(0.3, 0, 0, 1)", "css": "--ubm-ease-emphasized" },
    "decelerate": { "value": "cubic-bezier(0, 0, 0, 1)", "css": "--ubm-ease-decelerate" },
    "accelerate": { "value": "cubic-bezier(0.3, 0, 1, 1)", "css": "--ubm-ease-accelerate" }
  }
}
```

## 10. Tailwind v4 @theme Inline Guide

task-09 は本ファイルの §9 JSON と §3〜§8 表を参照し、`apps/web/src/styles/tokens.css` と `globals.css` を作成する。
`@theme inline` を使い、Tailwind utility が CSS variable を固定値へ畳み込まないようにする。
これにより `[data-theme="warm"]` / `[data-theme="cool"]` の cascade が utility 経由でも効く。

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-surface: var(--ubm-color-surface-bg);
  --color-surface-2: var(--ubm-color-surface-bg-2);
  --color-panel: var(--ubm-color-surface-panel);
  --color-text: var(--ubm-color-text-primary);
  --color-text-2: var(--ubm-color-text-secondary);
  --color-text-3: var(--ubm-color-text-muted);
  --color-border: var(--ubm-color-border-default);
  --color-accent: var(--ubm-color-accent);
  --color-accent-soft: var(--ubm-color-accent-soft);
  --color-accent-ink: var(--ubm-color-accent-ink);
  --color-ok: var(--ubm-color-ok);
  --color-warn: var(--ubm-color-warn);
  --color-danger: var(--ubm-color-danger);
  --color-info: var(--ubm-color-info);
  --radius-sm: var(--ubm-radius-sm);
  --radius-md: var(--ubm-radius-md);
  --radius-lg: var(--ubm-radius-lg);
  --shadow-xs: var(--ubm-shadow-xs);
  --shadow-sm: var(--ubm-shadow-sm);
  --shadow-md: var(--ubm-shadow-md);
  --shadow-lg: var(--ubm-shadow-lg);
  --font-sans: var(--ubm-font-body);
  --font-mono: var(--ubm-font-mono);
  --spacing: 4px;
}
```

task-09 の `tokens.css` は `:root` に stone values を置き、`[data-theme="warm"]` と `[data-theme="cool"]` に 12 個ずつ override を置く。
`ok` / `warn` / `danger` / `info` は 3 theme 共通であり、warm / cool block に重複して書かない。
task-18 の verifier は `tokens.css` と本ファイル §9 の CSS names を比較し、欠落 0 を gate にする。
また `apps/web/src/styles/globals.css` の `@theme inline` bridge も検査対象に含め、`--ubm-*` 正本 token から Tailwind utility token への接続漏れを CI で検出する。
設計値の変更は本仕様書を先に更新する別 workflow とし、task-18 では転記漏れ・bridge 欠落の同期補正だけを許可する。

## 11. Dark Mode Placeholder

Dark mode は MVP 非対応であり、本タスクでは値を決めない。
ただし task-09 が theme cascade の構造を実装できるよう、placeholder selector だけを正本化する。
この selector を実装しても dark theme をユーザーへ公開してはならない。

```css
[data-theme="dark"] {
  /* Intentionally empty. Final dark values require a separate workflow. */
}
```

Dark mode task が着手されたら、§9 JSON の `color.theme.dark` を追加し、§3 の表にも dark override を追記する。
それまでは placeholder を検証対象に含めるが、contrast PASS とは扱わない。

## 12. 改訂履歴

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.07-initial | 2026-05-07 | 初版。prototype `styles.css` L1-L70 の stone / warm / cool 値、radius、shadow、font、spacing、motion を `--ubm-*` 正本名で固定。旧 `09c-primitives.md` 短縮 token 互換 mapping、Style Dictionary 互換 JSON、Tailwind v4 `@theme inline` guide、sRGB fallback、dark mode placeholder を追加。 |
