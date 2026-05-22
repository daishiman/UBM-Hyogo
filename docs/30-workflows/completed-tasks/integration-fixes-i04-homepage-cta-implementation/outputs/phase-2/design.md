# Phase 2: 設計サマリ

phase-2.md の component / constants / HomePage 統合 / CSS を採用。
tokens.css の prefix は `--ubm-*` であるため、CSS 変数は実装時に以下へマッピング:
- `var(--space-8)`  → `var(--ubm-space-8)`
- `var(--space-6)`  → `var(--ubm-space-6)`
- `var(--space-10)` → `var(--ubm-space-12)`（最も近い既存 token）
- `var(--space-2)`  → `var(--ubm-space-2)`
- `var(--text-xs)`  → `var(--ubm-text-xs)`
- `var(--radius-lg)` → `var(--ubm-radius-lg)`
- `var(--ubm-color-text)`  → `var(--ubm-color-text-primary)`
- `var(--ubm-color-panel)` → `var(--ubm-color-surface-panel)`

ボタンは `.cta-button .cta-button--accent` を宣言しつつ、`[data-role="call-to-action-cta-button"]`
セレクタで dark surface 上の最低見栄え（min-height 52px / accent 背景）を保証。
