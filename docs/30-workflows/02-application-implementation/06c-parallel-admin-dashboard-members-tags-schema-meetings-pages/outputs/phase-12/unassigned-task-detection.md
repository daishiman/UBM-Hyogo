# Unassigned Task Detection

## 判定

06c の実装範囲内で今すぐ追加すべき未タスクは 0 件。大きな環境依存・後続wave責務のみ下表に分離する。

| 項目 | 理由 | 対応方針 |
| --- | --- | --- |
| Phase 11 実スクリーンショット | D1 fixture、admin Google account、wrangler dev/staging が必要 | 08b Playwright E2E / 09a staging smoke に委譲 |
| ESLint no-restricted-imports 正式導入 | 現状は `scripts/lint-boundaries.mjs` が境界検証の正本。ESLint導入は波及が大きい | 必要時に lint foundation task で扱う |
| `/admin/users` 管理者管理 UI | 現行仕様で明示的に不採用 | 運用要請発生まで未作成 |
| profile 本文の管理者直接編集 | 不変条件 #4/#11 に反する | 作成しない |
| タグ直接編集 UI | 不変条件 #13 に反する | 作成しない |

## 影響

スクリーンショット未取得により、06c単体では UI/UX の視覚証跡は完了していない。ただしコンポーネント実装と unit test は存在し、視覚検証は後続E2Eに分離可能な境界である。
