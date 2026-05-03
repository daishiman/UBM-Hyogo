# Phase 4: テスト戦略 — ut-web-cov-04-admin-lib-ui-primitives-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 4 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

AC を test ID にマッピングし、coverage 目標値（Stmts/Lines/Funcs ≥85%, Branches ≥80%）と除外境界を固定する。

## 実行タスク

1. AC を test ID にマッピングする。
2. coverage 目標値を package レベルと file レベルで明記する。
3. 除外境界（型定義のみのファイル等）を decision log として記録する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/claude-design-prototype/（UI primitives 視覚仕様）

## 実行手順

- 対象 directory: docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-04-admin-lib-ui-primitives-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c-A-admin-dashboard
- 下流: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md


## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- admin lib: contract test（authed fetch / error mapping / type guard）の 4 ケース
- UI primitives: open/close, prop variant, callback invocation の最低 3 ケース
- barrel files (icons.ts, ui/index.ts) は import smoke で関数存在を assert
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、AC、blocker、evidence path、approval gate を渡す。
