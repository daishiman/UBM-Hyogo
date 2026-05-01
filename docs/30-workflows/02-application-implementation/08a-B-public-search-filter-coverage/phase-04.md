# Phase 4: テスト戦略 — 08a-B-public-search-filter-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 4 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL |

## 目的

unit / contract / E2E / a11y のテスト戦略を 6種パラメータ × 既知ケース（happy / 空結果 / 不正値）で先に設計する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 未確定の検索仕様の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path（screenshot / curl）が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作（実装・deploy・PR）が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/08a-B-public-search-filter-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 08a-followup-001 base coverage, 07a tag resolve API, 06a public web smoke
- 下流: 08b playwright e2e（検索シナリオ）, 09a staging smoke（検索 smoke）

## 多角的チェック観点

- #4 公開状態フィルタ正確性
- #5 public/member/admin boundary
- #6 admin-only field を public response に含めない
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

- query parameter 6種（q / zone / status / tag / sort / density）すべてに対し既知ケースが spec として記述される
- `GET /api/public/members` の query 受け取り型と response 形が確定する
- 空結果 / 不正値 / 大量ヒットの UI 挙動が記述される
- a11y 観点が AC として明文化される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、verify suite と test 構造を渡す。
