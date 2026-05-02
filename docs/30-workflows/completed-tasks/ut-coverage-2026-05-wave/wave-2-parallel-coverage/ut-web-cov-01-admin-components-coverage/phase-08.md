# Phase 8: DRY 化 — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 8 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

重複 test fixture / helper の DRY 化と命名統一を行う。

## 実行タスク

1. test fixture / helper の重複を抽出する。
2. _shared/ への昇格候補を識別する。
3. 命名・配置の規約と差分を docs に残す。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%, branches=68.01%, functions=43.51%, statements=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/claude-design-prototype/

## 実行手順

- 対象 directory: docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-01-admin-components-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c-A-admin-dashboard, 06c-B-admin-members, 06c-C-admin-tags, 06c-D-admin-schema, 06c-E-admin-meetings
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
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md


## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- admin client component に happy / authz-fail / empty / mutation の最低 4 ケース
- snapshot ではなく明示 assertion ベース
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、AC、blocker、evidence path、approval gate を渡す。
