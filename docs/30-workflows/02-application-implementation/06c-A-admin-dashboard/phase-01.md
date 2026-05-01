# Phase 1: 要件定義 — 06c-A-admin-dashboard

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-A-admin-dashboard |
| phase | 1 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 06b-A-me-api-authjs-session-resolver / 06c admin pages 本体 / require-admin middleware |
| 下流 | 08b admin E2E / 09a staging admin smoke |

## 目的

未完了の真因、scope、依存境界、成功条件を確定する。

## 実行タスク

1. 参照資料と該当 spec / prototype を確認する。完了条件: dashboard 機能の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts
- apps/web/app/admin/

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-A-admin-dashboard/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06b-A-me-api-authjs-session-resolver / 06c admin pages 本体 / require-admin middleware
- 下流: 08b admin E2E / 09a staging admin smoke

## 多角的チェック観点

- #5 public/member/admin boundary（apps/web D1 direct access forbidden を含む）
- #11 管理者も他人本文を直接編集しない
- #13 admin audit logging
- #15 Auth session boundary
- 未実装/未実測を PASS と扱わない。
- prototype `pages-admin.jsx` の表現と正本仕様 11-admin-management.md を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- `/admin` は admin role 必須（middleware + require-admin API の二段防御）で保護される
- KPI tile（公開メンバー数 / pending request 件数 / 未解決 audit 件数）が集計 API 経由で表示される
- 直近 7 日のアクション一覧が dashboard 上で確認できる
- 非 admin user が `/admin` にアクセスした場合、middleware で 302、API で 403 を返す
- dashboard 閲覧は audit log に記録される（#13）
- apps/web は D1 直参照せず apps/api 経由で集計データを取得する（#5）

## 追加セクション（Phase 1）

### true issue
- `/admin` dashboard の集計 UI / API がプロトタイプ仕様 11-admin-management.md / pages-admin.jsx に対し未接続である点が真の課題。
- middleware / require-admin API の二段防御は別タスクで担保されるが、dashboard 固有の集計境界が未定義。

### 依存境界
- 上流: 06b-followup-002 session resolver / 06c admin pages 本体 / require-admin middleware
- 下流: 08b admin E2E / 09a staging admin smoke

### 価値とコスト
- 価値: 管理者が公開メンバー数 / pending request 件数 / 未解決 audit 件数を即座に把握できる。
- コスト: 集計 endpoint 1 系統と KPI tile component 群、audit log への閲覧記録 1 行。

### 4 条件
- 価値性: admin 業務の起点になる KPI を提供する。
- 実現性: 既存 D1 テーブル（members / membership_requests / audit_log）の集計のみで実装可能。
- 整合性: #5 / #11 / #13 / #15 と矛盾しない。
- 運用性: free-tier 範囲内、secret 値の追加なし。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate を渡す。
