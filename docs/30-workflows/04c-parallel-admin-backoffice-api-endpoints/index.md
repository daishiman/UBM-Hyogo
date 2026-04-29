# 04c-parallel-admin-backoffice-api-endpoints - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| ディレクトリ | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | api / admin |
| 状態 | Phase 12 completed / Phase 13 pending |
| タスク種別 | implementation |

## 目的

管理者バックオフィスの全 endpoint を `apps/api`（Hono）に実装する。dashboard / member 一覧・詳細・status 更新・admin notes / 削除復元 / tag queue resolve / schema diff alias / meeting + attendance / sync trigger を、`admin_users` 認可と admin_member_notes 分離（不変条件 #11, #12）と本人本文の直接編集禁止（不変条件 #4）を構造的に保証して提供する。

## スコープ

### 含む

- `GET /admin/dashboard`（総会員数 / 公開中人数 / 未タグ人数 / schema 未解決数）
- `GET /admin/members`（公開中 / 非公開 / 退会済み 切替）
- `GET /admin/members/:memberId`（drawer 用 detail + admin_member_notes + 参加履歴 + 回答メタ）
- `PATCH /admin/members/:memberId/status`（publish_state / hidden_reason / is_deleted の更新）
- `POST /admin/members/:memberId/notes` + `PATCH /admin/members/:memberId/notes/:noteId`
- `POST /admin/members/:memberId/delete` + `POST /admin/members/:memberId/restore`
- `GET /admin/tags/queue` + `POST /admin/tags/queue/:queueId/resolve`
- `GET /admin/schema/diff` + `POST /admin/schema/aliases`
- `GET /admin/meetings` + `POST /admin/meetings`
- `POST /admin/meetings/:sessionId/attendance` + `DELETE /admin/meetings/:sessionId/attendance/:memberId`
- `POST /admin/sync/schema` + `POST /admin/sync/responses`
- 認可境界（admin gate middleware が `admin_users` を確認）
- 全 admin 操作の audit_log 記録

### 含まない

- 本人プロフィール本文の直接編集 endpoint（不変条件 #11）
- `/admin/users` 管理者管理 UI / 追加 endpoint（spec 11 で不採用）
- `/admin/tags` のタグ辞書編集（spec 12 で不採用）
- 物理削除（spec 07 で不採用）
- Auth.js provider 設定（05a）
- workflow 内部ロジックの実装（07a/b/c）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | meetings / attendance / tag_queue / schema_diff_queue repository |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | admin_users / admin_member_notes / audit_log / sync_jobs repository、apps/web → D1 直接禁止 lint |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | members / status / responses 系（dashboard と admin_members 用） |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | sync schema endpoint の job 関数 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | sync responses endpoint の job 関数 |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | AdminDashboardView / AdminMemberListView / AdminMemberDetailView 型 |
| 下流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | admin gate middleware 配備 |
| 下流 | 05b-parallel-magic-link-provider-and-auth-gate-state | login 後の admin gate 通過 |
| 下流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | admin UI が consume |
| 下流 | 07a / 07b / 07c | workflow が本タスクの endpoint を入口とする |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | contract / authz test の入口 |
| 並列 | 04a, 04b | 同 Wave 内独立 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 管理者権限・画面責務 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue 設計 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 公開状態 / 削除 / 復元の API 表 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | admin 判定 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | 管理ページ認証 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey / schema |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | AdminDashboardView / AdminMemberListView / AdminMemberDetailView |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | 16 テーブル定義 |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 4c 詳細 |

## 受入条件 (AC)

- AC-1: `admin_users` に登録された user のみ全 `/admin/*` を 200 で通す。それ以外は 403 + memberId 露出ゼロ
- AC-2: 本人本文の直接編集 endpoint が一切存在しない（PATCH /admin/members/:memberId/profile 系不在）
- AC-3: `admin_member_notes` の本文値が public/member view model レスポンスに混ざらない（contract test）
- AC-4: 認可違反テスト（公開 user / 一般会員 / admin の境界 6 ケース）が全 pass
- AC-5: status 更新で publish_state と is_deleted を別フィールドで扱い、混同不可（型 test）
- AC-6: タグ確定は `POST /admin/tags/queue/:queueId/resolve` 経由のみ。`PATCH /admin/members/:memberId/tags` は不在（不変条件 #13）
- AC-7: schema 変更は `/admin/schema/*` に集約。`PATCH /admin/sync/schema` 等の名称重複なし（不変条件 #14）
- AC-8: meeting attendance の重複 POST は 409、削除済み会員への attendance 付与は 422（不変条件 #15）
- AC-9: 全 admin 操作で audit_log に who(admin email) / what(action) / when(timestamp) / target(memberId or sessionId) が record される
- AC-10: sync trigger endpoint（schema / responses）は 202 で job_id を返し、同期実行中の重複 trigger は 409
- AC-11: response schema が view model と一致（zod safeParse 成功）
- AC-12: admin_member_notes は admin detail のみに含め、list / public / member view model へ混ぜない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/endpoint-spec.md | 全 admin endpoint の zod schema |
| 設計 | outputs/phase-02/handler-design.md | router / middleware / repository 結線 |
| 設計 | outputs/phase-02/mermaid-flow.md | request flow と admin gate |
| 設計 | outputs/phase-04/test-matrix.md | unit / contract / authz / integration mapping |
| 実装 | outputs/phase-05/runbook.md | endpoint 実装順序 |
| 実装 | outputs/phase-05/pseudocode.md | 主要 handler placeholder |
| 検証 | outputs/phase-06/failure-cases.md | 認可違反 / 重複 / 削除済み / sync 失敗 |
| 検証 | outputs/phase-07/ac-matrix.md | AC × verify × runbook |
| 検証 | outputs/phase-09/free-tier.md | D1 read/write 見積もり |
| 検証 | outputs/phase-11/manual-evidence.md | curl / wrangler 出力 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様 | phase-*.md x 13 | Phase 仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (apps/api) | Hono runtime | 100k req/day 内 |
| Cloudflare D1 | 16 テーブル全アクセス | 5GB / 500k reads / 100k writes 内 |
| Auth.js (consumer) | session 注入のみ | - |

## Endpoints 一覧

| method | path | 認可 | 主 view model | 主 D1 |
| --- | --- | --- | --- | --- |
| GET | /admin/dashboard | admin gate | AdminDashboardView | members + member_status + tag_assignment_queue + schema_diff_queue |
| GET | /admin/members | admin gate | AdminMemberListView | members + member_status |
| GET | /admin/members/:memberId | admin gate | AdminMemberDetailView | members + responses + admin_member_notes + member_attendance |
| PATCH | /admin/members/:memberId/status | admin gate | { publishState, isDeleted, hiddenReason, updatedAt } | member_status + audit_log |
| POST | /admin/members/:memberId/notes | admin gate | { noteId, createdAt } | admin_member_notes + audit_log |
| PATCH | /admin/members/:memberId/notes/:noteId | admin gate | { noteId, updatedAt } | admin_member_notes + audit_log |
| POST | /admin/members/:memberId/delete | admin gate | { memberId, isDeleted: true, deletedAt } | member_status + deleted_members + audit_log |
| POST | /admin/members/:memberId/restore | admin gate | { memberId, isDeleted: false } | member_status + deleted_members + audit_log |
| GET | /admin/tags/queue | admin gate | AdminTagQueueView | tag_assignment_queue + members |
| POST | /admin/tags/queue/:queueId/resolve | admin gate | { queueId, status: 'resolved' } | tag_assignment_queue + member_tags + audit_log |
| GET | /admin/schema/diff | admin gate | AdminSchemaDiffView | schema_diff_queue + schema_questions |
| POST | /admin/schema/aliases | admin gate | { stableKey, aliasResolved: true } | schema_questions + schema_diff_queue + audit_log |
| GET | /admin/meetings | admin gate | AdminMeetingListView | meeting_sessions + member_attendance |
| POST | /admin/meetings | admin gate | { sessionId, scheduledAt } | meeting_sessions + audit_log |
| POST | /admin/meetings/:sessionId/attendance | admin gate | { sessionId, memberId } | member_attendance + audit_log |
| DELETE | /admin/meetings/:sessionId/attendance/:memberId | admin gate | { removed: true } | member_attendance + audit_log |
| POST | /admin/sync/schema | admin gate | { jobId, status: 'queued' } | sync_jobs + audit_log |
| POST | /admin/sync/responses | admin gate | { jobId, status: 'queued' } | sync_jobs + audit_log |

## D1 テーブル（参照）

- members, member_identities, member_status, member_responses, response_sections, response_fields, member_field_visibility
- meeting_sessions, member_attendance
- tag_definitions, tag_assignment_queue, member_tags
- schema_versions, schema_questions, schema_diff_queue
- admin_users, admin_member_notes, audit_log, sync_jobs, deleted_members

## Secrets 一覧（このタスクで導入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |

なし。認証 secret は 05a / 05b で導入。

## 触れる不変条件

- #1: schema 固定しすぎない（schema diff endpoint で柔軟性維持）
- #4: 本人プロフィール本文 D1 編集禁止（PATCH /admin/members/:memberId/profile 不在）
- #5: apps/web → D1 直接禁止（本タスクは apps/api 側）
- #7: responseId と memberId 混同禁止
- #11: 管理者は他人プロフィール本文を直接編集できない
- #12: admin_member_notes は public/member view model に混ざらない
- #13: tag は admin queue → resolve 経由（直接編集禁止）
- #14: schema 変更は `/admin/schema` に集約
- #15: meeting attendance は重複登録不可、削除済み会員除外

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md, ../_templates/task-index-template.md
- 設計書: ../_design/phase-2-design.md（Wave 4c 節）
