# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |

## 目的

採用案 A に対する unit / contract / authorization / integration テストを 08a へ引き渡す前に、本タスク内で verify suite として設計する。本人本文編集禁止（#11）、admin_member_notes leak ゼロ（#12）、tag queue 経由（#13）、schema 集約（#14）、attendance 制約（#15）が test で必ず担保されることを保証する。

## Verify suite 設計

### Unit test

| 対象 module | テスト内容 |
| --- | --- |
| middleware/admin-gate.ts | session の email が admin_users にある場合 200、ない場合 403、削除 admin で 403 |
| middleware/audit-trail.ts | mutation 終了時に audit_log.record が必ず呼ばれる、read-only では呼ばれない |
| services/sync-job-launcher.ts | hasActive=true で 409、false で sync_jobs に queued 投入 |
| services/admin-view-model-builder.ts | 削除済み会員を totals.totalMembers から除外、AdminMemberListItem に notes 不在 |
| schemas/admin/*.ts | 全 endpoint の zod safeParse |

### Contract test

| endpoint | 検証 |
| --- | --- |
| GET /admin/dashboard | response が AdminDashboardResponse に一致 |
| GET /admin/members | AdminMemberListItem に notes 不在を zod で強制 |
| GET /admin/members/:memberId | AdminMemberDetailResponse に notes 含有 OK |
| PATCH /admin/members/:memberId/status | request body が `isDeleted: never` を強制 |
| POST /admin/members/:memberId/notes | visibility が `'admin_only'` 固定 |
| POST + DELETE attendance | 409 / 422 / 200 のステータス分岐 |
| POST /admin/sync/* | 202 + jobId、409 for active |

### Authorization test

| シナリオ | 期待 |
| --- | --- |
| 公開 user で /admin/* 全 18 endpoint | 401 |
| 一般会員 (admin_users 不在) で /admin/* | 403 |
| admin_users 登録 user で /admin/* | 200 / 201 / 202 / 204 |
| admin gate 通過後に他人 memberId 編集（PATCH .../profile を試みる route） | 設計上 endpoint 不在で 404 |
| PATCH /admin/members/:memberId/tags を試みる | 404（endpoint 不在） |
| POST /admin/sync/schema を一般会員で叩く | 403 |
| GET /public/members レスポンスに notes フィールドが混入 | test fail（zod で禁止） |

### Integration test

| シナリオ | 検証 |
| --- | --- |
| Status 更新 → audit_log 記録確認 | audit_log に admin.member.status.update が残る |
| Note 作成 → 一覧取得 | 一覧に notes 不在、詳細に notes 含有 |
| Tag queue resolve → member_tags 反映 | member_tags に tagCode が追加される |
| Schema alias assign → schema_questions.stableKey 更新 | DB 直接照会で確認 |
| Meeting 作成 → attendance 重複付与 | 1 回目 201、2 回目 409 |
| Attendance 削除済み会員に付与 | 422 |
| Sync schema trigger → sync_jobs に queued | sync_jobs の最新 row が status=queued |

## Test matrix（AC × verify suite）

| AC | unit | contract | authz | integration |
| --- | --- | --- | --- | --- |
| AC-1 (admin_users のみ通過) | admin-gate.ts | - | 公開 user / 一般会員 / admin の 3 シナリオ | - |
| AC-2 (本文 PATCH 不在) | - | type test | PATCH .../profile が 404 | - |
| AC-3 (notes 公開非露出) | view-model-builder.ts | GET /admin/members に notes 不在 zod | GET /public/members に notes 不在 | note 作成後の list 検証 |
| AC-4 (認可境界 6 ケース) | - | - | 6 ケース全 pass | - |
| AC-5 (publish_state vs isDeleted 分離) | schemas/admin/status.ts | PATCH status の type test | - | - |
| AC-6 (tag は queue 経由) | - | type test | PATCH .../tags が 404 | tag resolve flow |
| AC-7 (schema /admin/schema 集約) | - | - | sync 経路に alias 不在 | schema alias flow |
| AC-8 (attendance 重複 / 削除済み) | - | POST attendance 409 / 422 | - | duplicate / deleted member |
| AC-9 (audit_log who/what/when/target) | audit-trail.ts | - | - | 全 mutation 後の audit |
| AC-10 (sync trigger 202 + 409) | sync-job-launcher.ts | POST /admin/sync/* | - | trigger flow |
| AC-11 (response schema 一致) | schemas/admin/*.ts | 全 endpoint zod | - | - |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 認可境界 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue test |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | status / delete test |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 各 test を pass させる runbook 化 |
| Phase 6 | failure case を test に追加 |
| Phase 7 | AC matrix の verify 列を本 Phase の test 名で埋める |
| 08a (Wave 8) | 本タスクの test 群を取り込み |

## 多角的チェック観点（不変条件マッピング）

- #11: PATCH /admin/members/:memberId/profile が type test と route 一覧で 404 を返すことを確認
- #12: GET /public/* / GET /me/* / GET /admin/members に notes 不在を zod で確認
- #13: PATCH /admin/members/:memberId/tags が 404 を返すことを authz test で確認
- #14: schema 変更経路が /admin/schema/* のみであることを route 一覧 test で確認
- #15: POST attendance の 409 / 422 を contract で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 一覧化 | 4 | completed | module 別 |
| 2 | contract test 一覧化 | 4 | completed | endpoint × zod |
| 3 | authz test 一覧化 | 4 | completed | 6 シナリオ以上 |
| 4 | integration test 設計 | 4 | completed | 7 flow |
| 5 | test matrix 作成 | 4 | completed | outputs/phase-04/test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 主成果物 |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × verify mapping |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] unit / contract / authz / integration の 4 層全てに test 設計がある
- [ ] AC × verify mapping が表で完成
- [ ] 不変条件 #11 / #12 / #13 / #14 / #15 を test で担保する手段が明記

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 4 を completed に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test 駆動で実装する順序（admin gate → audit middleware → handlers）
- ブロック条件: test matrix が空欄なら次 Phase 開始しない
