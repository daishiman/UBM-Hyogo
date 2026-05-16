# Phase 11: 視覚検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | completed |
| タスク種別 | VISUAL |

## 目的

UI 変更を伴うため、視覚検証を実施する。

## 検証項目

| # | 項目 | 状態 |
| --- | --- | --- |
| V1 | 初期表示で default 50 件が render され、レイアウト崩れがない | PASS |
| V2 | 「もっと見る」ボタンが `var(--ubm-color-accent)` token 色で表示 | PASS |
| V3 | loading 中の disabled スタイル `disabled:opacity-50` | PASS |
| V4 | error message が `var(--ubm-color-danger)` token 色で表示 | PASS |
| V5 | empty message が `var(--ubm-color-text-muted)` token 色で表示 | PASS |
| V6 | local Playwright で profile attendance paging screenshot を取得 | PASS |

## 視覚検証手段

- focused unit test による DOM 状態確認
- design token grep gate と `verify-design-tokens`
- local Playwright screenshot capture による `/profile` 参加履歴 paging UI 確認

## スクリーンショット

本サイクルで local mock API + member session による profile screenshot を取得済み。

- `outputs/phase-11/screenshots/profile-attendance-paging-desktop.png`
- `outputs/phase-11/evidence/playwright-report/results.json`
- `outputs/phase-11/evidence/monocart/index.json`

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/visual-verification.md | 視覚検証記録 |
| スクリーンショット | outputs/phase-11/screenshots/profile-attendance-paging-desktop.png | 参加履歴 paging UI |

## 完了条件

- [x] V1-V6 全件 PASS

## 次 Phase

- 次: 12 (正本同期)
