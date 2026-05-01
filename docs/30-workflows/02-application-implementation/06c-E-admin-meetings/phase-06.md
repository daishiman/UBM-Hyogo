# Phase 6: 異常系検証 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 6 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

401 / 403 / 404 / 409 / 422 / 5xx と削除済み member の取り扱い、attendance upsert の冪等性、CSV escape を網羅する。

## 実行タスク

1. 401（未ログイン）/ 403（非 admin）/ 404（meetingId 不在）の挙動を確定する。完了条件: API gate と UI gate の両方で記録される。
2. 422（zod 検証失敗: heldOn 形式不正、memberId 存在せず）の挙動を確定する。完了条件: error response shape が固定される。
3. 409（同 heldOn + 同 title 重複）/ attendance upsert の冪等性を確定する。完了条件: PRIMARY KEY (meetingId, memberId) で represent される。
4. CSV escape（カンマ・改行・引用符を含む displayName）の挙動を確定する。完了条件: RFC 4180 準拠が確認される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log（失敗時も記録するか方針確定）
- #15 Auth session boundary
- 削除済み member への attendance 付与は 410 を返す。

## サブタスク管理

- [ ] 401/403/404 を確定する
- [ ] 422 を確定する
- [ ] 409 / 冪等性を確定する
- [ ] CSV escape を確定する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- 全 failure case が response shape 付きで記録される
- 冪等性 / RFC 4180 が AC 化される
- audit log の失敗系ポリシーが固定される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、failure case と response shape を渡す。
