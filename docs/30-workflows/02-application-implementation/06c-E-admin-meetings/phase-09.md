# Phase 9: 品質保証 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 9 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene を確認する。

## 実行タスク

1. 型安全（`mise exec -- pnpm typecheck`）/ lint / test の通過条件を列挙する。完了条件: コマンドが記録される。
2. 無料枠見積もり（D1 row 数: meetings 〜数百行 / attendances 〜数千行 / 月次 read 数）を出す。完了条件: 数値根拠が出る。
3. secret hygiene（新規 secret 無し、AUTH_SECRET 流用、`.env` 平文禁止）を確認する。完了条件: チェックリストが埋まる。
4. a11y（Drawer focus trap / Form label / CSV download button の aria）を確認する。完了条件: WCAG AA 観点が記録される。

## 参照資料

- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- CLAUDE.md（シークレット管理セクション）

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- secret 値そのものは記載しない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- 無料枠超過リスク（D1 row 数 / 月次 R/W）。

## サブタスク管理

- [ ] 型 / lint / test 通過条件を書く
- [ ] 無料枠見積もりを書く
- [ ] secret hygiene を確認する
- [ ] a11y を確認する
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md

## 完了条件

- 型安全 / lint / test の green 条件が固定される
- 無料枠が超過しないことが定量的に示される
- 新規 secret が導入されないことが確認される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、品質チェックリストを渡す。
