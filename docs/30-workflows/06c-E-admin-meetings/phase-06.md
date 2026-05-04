# Phase 6: 異常系検証 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 6 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

401 / 403 / 404 / 409 / 422 / 5xx と削除済み member / soft-deleted meeting の取り扱い、attendance duplicate、CSV escape を網羅する。

## 実行タスク

1. 401（未ログイン）/ 403（非 admin）/ 404（meetingId 不在）の挙動を確定する。完了条件: API gate と UI gate の両方で記録される。
2. 422（zod 検証失敗: heldOn 形式不正、削除済み member）の挙動を確定する。完了条件: error response shape が固定される。
3. 409（同 heldOn + 同 title 重複候補）/ attendance duplicate を確定する。完了条件: PRIMARY KEY (meetingId, memberId) で represent し、duplicate は 409 を返す。
4. CSV escape（カンマ・改行・引用符を含む displayName）の挙動を確定する。完了条件: RFC 4180 準拠が確認される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log（失敗時も記録するか方針確定）
- #15 Auth session boundary
- 削除済み member への attendance 付与は 422 を返す。
- 存在しない member または soft-deleted meeting への attendance 付与は 404 を返す。

## サブタスク管理

- [ ] 401/403/404 を確定する
- [ ] 422 を確定する
- [ ] 409 / duplicate を確定する
- [ ] CSV escape を確定する
- [ ] outputs/phase-06/main.md を作成する

## 実装仕様 (CONST_005)

### 異常系マトリクス（HTTP status × エンドポイント × 入力）

| status | endpoint | 入力 | 期待 response shape |
| --- | --- | --- | --- |
| 401 | 全 admin endpoint | session cookie 無し | `{ error: "unauthorized" }` |
| 403 | 全 admin endpoint | 非 admin session | `{ error: "forbidden" }` |
| 404 | `PATCH /api/admin/meetings/:id` | 未存在 id | `{ error: "not_found" }` |
| 404 | `GET /api/admin/meetings/:id/export.csv` | 未存在 id | `{ error: "not_found" }` |
| 404 | `POST /api/admin/meetings/:id/attendances` | 存在しない member | `{ error: "member_not_found" }` |
| 404 | `POST /api/admin/meetings/:id/attendances` | soft-deleted meeting | `{ error: "session_not_found" }` |
| 422 | `POST /api/admin/meetings/:id/attendances` | 削除済み member | `{ error: "member_is_deleted" }`（不変条件 #15） |
| 422 | `PATCH /api/admin/meetings/:id` | heldOn 形式不正 | zod issues |
| 422 | `POST /api/admin/meetings` | title 空 | zod issues |
| 422 | `POST /api/admin/meetings/:id/attendances` | memberId 形式不正 | zod issues |
| 409 | `POST /api/admin/meetings` | 同 heldOn + 同 title 重複（採用方針による） | `{ error: "conflict" }`（採用しない場合は idempotent 仕様で記載） |
| 409 | `POST /api/admin/meetings/:id/attendances` 二重 | 同 (meetingId, memberId) | `{ error: "attendance_already_recorded" }` |
| 5xx | 全 endpoint | D1 binding 障害 | `{ error: "internal" }`（詳細は log のみ） |

### CSV escape（RFC 4180）テストケース

| displayName | 期待 CSV cell |
| --- | --- |
| `田中, 太郎` | `"田中, 太郎"` |
| `山田\n二郎` | `"山田\n二郎"` |
| `"佐藤"` | `"""佐藤"""` |

### audit log の失敗系ポリシー

- 401 / 403: audit log 不要（gate 段階で reject）
- 404 / 422: audit log 不要（mutation 未実行）
- 5xx: server side log のみ、audit log は emit しない（mutation 未確定のため）
- 削除済み member / soft-deleted meeting / unknown member への attendance 失敗（422 / 404）: audit log emit しない

## 成果物

- outputs/phase-06/main.md

## 完了条件

- [x] 全 failure case が response shape 付きで記録される
- [x] duplicate / RFC 4180 が AC 化される
- [x] audit log の失敗系ポリシーが固定される
- [x] DoD: 異常系テストケースが Phase 4 のテストファイルに反映され、`mise exec -- pnpm test --filter @ubm-hyogo/api` が green

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、failure case と response shape を渡す。
