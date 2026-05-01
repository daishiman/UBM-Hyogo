# Phase 1: 要件定義 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 1 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/admin/meetings` 機能の真の責務、scope、依存境界、成功条件を確定する。Form schema 外の admin-managed data として扱う原則を固定する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: meetings の責務境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver, requireAdmin middleware
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離（Form schema に昇格しない）
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary（admin gate 二段防御）
- 未実装/未実測を PASS と扱わない。
- gas-prototype の挙動を本番仕様に昇格させない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- `/admin/meetings` が admin session で 200 を返し、未ログイン / 非 admin は 403 になる
- `meetings` / `meeting_attendances` の D1 schema 案が確定する
- API endpoint と HTTP メソッドが確定する
- apps/web は cookie forwarding のみで成立する
- 全 mutation が audit log 対象であることが明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate、D1 schema 案を渡す。
