# Lessons Learned: accent on accent-soft chip は accent-ink を採るとaxe contrast 4.5:1 を満たす (2026-05-27)

## 背景
`feat/dashboard-prototype-alignment` のe2e a11y (axe wcag2aa) が `chip-cadence` で fail:
- bg: `color-mix(in oklch, var(--ubm-color-accent) 12%, transparent)` → 実測 `#edded0`
- fg: `var(--ubm-color-accent)` → 実測 `#a24e10`
- contrast = **4.39:1** (期待 4.5:1, serious impact)

## L-CHIPCONTRAST-001: accent-soft 系背景に乗るテキスト/icon は accent-ink を使う
- **ルール**: 12% 程度の accent tint を background に持つ chip / pill / badge の foreground は `var(--ubm-color-accent)` ではなく `var(--ubm-color-accent-ink)` を採用する。
- **Why**: `--ubm-color-accent` は OKLch lightness ~0.52、`--ubm-color-accent-ink` は ~0.36-0.38。tint された soft bg (lightness ~0.93) との contrast は前者では 4.4 前後で 4.5:1 を切るが、後者なら 7.0+ 以上を確保できる。
- **How to apply**: chip primitive の token 採択時、accent on accent-soft の組合せが出たら自動的に `*-ink` に置換する。axe e2e で contrast violation が出た場合、まず `*-ink` 系 token の有無を確認し、無ければ追加を検討する。dot/icon など text contrast 要件外（`aria-hidden`）は accent のままで意匠を保つ。

## 適用範囲
- `legacy-public.css` / 新規 chip primitive / Timeline・Hero badge 系
- token zone variants (cool/warm/default) いずれも accent-ink が定義されているため再利用可能
- 同様パターン: pill/badge with `color-mix(in oklch, accent XX%, transparent)` background

## 関連
- [[feedback_token_conflict_axe_wins]] — token a11y は実測axeで勝つ値を採る
- [[lessons-learned-task-10-followup-002-runtime-visual-axe-2026-05]] — primitive a11y semantic tags
