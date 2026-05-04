# Phase 3: 設計レビュー — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 3 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

Phase 2 設計に対する simpler alternative を 3 案以上挙げ、PASS-MINOR-MAJOR を判定する。

## 実行タスク

1. alternative 案を 3 案以上書く（例: KV で代替 / meetings を Form schema に同居 / attendances を JSON 列に集約）。完了条件: 各案のトレードオフが明文化される。
2. 不変条件 #4/#5/#13/#15 違反の有無を確認する。完了条件: 違反案は MAJOR で却下される。
3. 採用案を確定する。完了条件: PASS-MINOR-MAJOR が記録される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- outputs/phase-02/main.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- alternative 案で無料枠 / 運用負荷が悪化していないか。

## サブタスク管理

- [ ] alternative 3 案を書く
- [ ] PASS-MINOR-MAJOR を判定する
- [ ] 採用案を確定する
- [ ] outputs/phase-03/main.md を作成する

## 実装仕様 (CONST_005)

### レビュー観点（CONST_005 項目別）

| 観点 | チェック内容 |
| --- | --- |
| 変更対象ファイル一覧 | Phase 2 の表が新規 / 編集 / 参照のみで分類されているか |
| D1 schema 命名整合 | 物理名 `meeting_sessions` / `member_attendance` と論理名 `meetings` / `meeting_attendances` の併記が漏れていないか |
| 関数シグネチャ | `updateMeeting`, `softDeleteMeeting` の引数・戻り値が既存型 `MeetingSessionRow` と整合しているか |
| zod schema | `PatchMeetingBodyZ` の各 field が PATCH partial 仕様（全て optional）になっているか |
| CSV serializer | 列順、BOM、`Content-Disposition`、RFC 4180 escape が固定されているか |
| audit log | mutation 5 種（create / update / delete / attendance.add / attendance.remove）の event 名が固定されているか |
| 不変条件 #4 / #5 / #13 / #15 | apps/web からの D1 直参照がないか、admin gate 二段防御が崩れていないか |

### D1 命名差分チェック項目

- 仕様書文中で「`meetings` テーブル」という記述があれば、必ず「（実 D1: `meeting_sessions`）」を併記する
- migration ファイル名 / SQL 内 table 名は物理名 `meeting_sessions` / `member_attendance` のみ使用する
- repository 層の TS 型 `MeetingSessionRow` は物理名由来。仕様書の論理名と TS 型名の対応を Phase 3 で明示する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- [x] 採用案が PASS で確定する
- [x] 不採用案の MAJOR 理由が明記される
- [x] 不変条件違反がないことが確認される
- [x] D1 命名差分（論理名 vs 物理名）の整合チェックが完了する
- [x] DoD: `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` 成功想定が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、確定設計とレビュー結果を渡す。
