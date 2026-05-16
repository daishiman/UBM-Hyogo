# Phase 3: データモデル / 契約

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

本タスクは UI コンポーネント追加のため D1 schema / API contract 変更を含まないが、
component prop contract / DOM contract / 既存定数依存関係を明記する。

## Prop Contract

| Prop | 型 | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `responderUrl` | `string` | yes | — | 外部 CTA href。HomePage から `FORM_RESPONDER_URL` を渡す |
| `heading` | `string` | no | "メンバー情報の掲載をお願いします" | h2 見出し |
| `body` | `string` | no | prototype 137-145 行の本文 | 説明テキスト |
| `ctaLabel` | `string` | no | "回答フォームを開く" | CTA ラベル |

## DOM Contract（テスト assertion 対象）

- root: `<section data-component="call-to-action-cta">`
- heading: `<h2>` を 1 個含む
- CTA: `<a>` で `href={responderUrl}` / `target="_blank"` / `rel="noopener noreferrer"` を持つ
- accessible name: CTA リンクは visible text `ctaLabel` で取得可能

## 外部契約変更

- API endpoint 変更: なし
- D1 schema 変更: なし
- Google Form 変更: なし

## 依存関係

- 新規 `FORM_RESPONDER_URL` 定数 ← CLAUDE.md「フォーム固定値」セクション正本との一致
- 既存 `var(--ubm-color-text-primary)`, `var(--ubm-color-surface-panel)` design token（`apps/web/src/styles/tokens.css`）
- 既存 prototype: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` 136-149 行

## 完了条件

- Prop / DOM contract が Phase 4 テスト・Phase 5 実装で参照可能な粒度で確定
