# 07c-parallel-meeting-attendance-and-admin-audit-log-workflow — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-attendance-and-admin-audit-log-workflow |
| ディレクトリ | docs/30-workflows/07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Wave | 7 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | admin-ops |
| 状態 | Phase 1-12 completed / Phase 13 pending_user_approval |
| タスク種別 | implementation |

## purpose

`meeting_sessions` への参加履歴登録を **重複登録不可** + **削除済み会員除外** の制約付きで実装し、attendance の追加・解除を `audit_log`（who / what / when / before_json / after_json）として残す workflow を成立させる。

## scope in / out

### scope in

- `member_attendance` の `(meetingSessionId, memberId)` UNIQUE 制約活用 + idempotent 登録 API（`POST /admin/meetings/:sessionId/attendance`）
- attendance 候補リストから `member_status.isDeleted = true` の会員を除外する resolver
- `audit_log` テーブルを介した attendance add/remove の記録（actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at）
- attendance 削除時 (`DELETE /admin/meetings/:sessionId/attendance/:memberId`) の audit
- 既存 admin endpoint の audit 共通化方針の記録（この task では既存 endpoint の差し替えは行わない）

### scope out

- tag_assignment_queue resolve workflow 本体（07a の責務）
- schema_diff_queue alias workflow 本体（07b の責務）
- status / notes / logical delete / tag resolve / schema alias / sync の既存 audit 実装差し替え
- audit log の閲覧 UI（08a contract test と 09a staging smoke が境界）
- 監査ログの長期保管 / 外部 SIEM 連携（09b の cron / monitoring と分離）
- attendance 一括 import / CSV upload UI

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | `/admin/meetings/*` `/admin/members/*` の endpoint 形を引き取る |
| 上流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | `/admin/meetings` `/admin/members` UI の操作トリガを引き取る |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `audit_log` repository / fixture を引き取る |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | 削除済みフラグ反映 (`member_status.isDeleted`) の挙動を確定 |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | `meetings.ts` `attendance.ts` repository を引き取る |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | attendance 重複阻止 / audit 残置 を contract test で固定 |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | `/admin/meetings` での attendance 操作を E2E で検証 |
| 並列 | 07a / 07b | 同 Wave 内で互いに独立（別 endpoint・別テーブル） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | admin 5 画面責務、メモは公開しない、本人本文を編集しない |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | `meeting_sessions` `member_attendance` `audit_log` のスキーマ |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | tag queue 連携先（audit 対象）の責務確認 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / D1 / migration 運用境界 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 #7 #11 #15 の出典 |
| 参考 | docs/00-getting-started-manual/specs/07-edit-delete.md | 論理削除と削除済み扱い |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | `/admin/meetings` UI 叩き台 |

## AC（Acceptance Criteria）

- AC-1: 同一 `(meetingSessionId, memberId)` の二重 INSERT が D1 UNIQUE 制約 (`uq_member_attendance`) で reject され、API は **HTTP 409** + 既存 row を返す（idempotent）
- AC-2: `member_status.isDeleted = true` の会員は `GET /admin/meetings/:sessionId/attendance/candidates` の応答配列から **0 件** に除外される
- AC-3: attendance 付与 / attendance 解除が `audit_log` に **1 行** 残る（actor_id, actor_email, action, target_type, target_id, created_at が NOT NULL）
- AC-4: `audit_log` に before_json / after_json を JSON 文字列で残し、付与時は after_json、解除時は before_json を route test で確認する
- AC-5: attendance 削除でも audit に `action="attendance.remove"` が残り、再付与 (idempotent retry) でも 1 行ずつ独立して記録される
- AC-6: 不変条件 #11（管理者は他人本文を直接編集しない）に違反する `PATCH /admin/members/:memberId/profile` 等の endpoint が **存在しない** ことを spec / contract test で固定
- AC-7: 不変条件 #15（attendance 重複不可・削除済み除外）が DB 制約 + API gate の二重防御として記述されている

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 重複阻止と audit の真の論点、AC-1〜7 を確定 |
| 2 | 設計 | phase-02.md | Mermaid フロー、`audit_log` schema、attendance API 仕様、env / dependency matrix |
| 3 | 設計レビュー | phase-03.md | alternative 3 案（DB constraint only / app-layer only / 二重防御）と PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | unit (重複) / contract (409) / authorization (admin only) / DB 制約 test の verify suite |
| 5 | 実装ランブック | phase-05.md | runbook + Hono handler 擬似コード + audit hook 配線 |
| 6 | 異常系検証 | phase-06.md | 401 / 403 / 404 / 409 / 422 / 5xx / 削除済みクリック / 同時 click |
| 7 | AC マトリクス | phase-07.md | AC × Phase 4 検証 × Phase 5 実装 のトレース |
| 8 | DRY 化 | phase-08.md | audit hook の共通化、命名 (action enum) Before/After |
| 9 | 品質保証 | phase-09.md | free-tier writes 見積、secret 不要確認、a11y（ボタンラベル / 表 role） |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO、blocker 一覧 |
| 11 | 手動 smoke | phase-11.md | wrangler d1 execute / curl evidence |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/audit-log-schema.md
outputs/phase-02/attendance-flow.mmd
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-12/elegant-verification.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Cloudflare D1 | `DB` binding | wrangler.toml | `member_attendance` `meeting_sessions` `audit_log` |
| Cloudflare Workers (api) | Hono handler | `apps/api/src/routes/admin/attendance.ts` | attendance add/remove で `auditLog.append` を直接呼び出す |
| 環境変数 | （新規導入なし） | — | session の adminUserId は AuthGateState 経由で取得 |
| Secrets | （新規導入なし） | — | 03b / 05a と共有 |

## invariants touched

- **#5** 公開 / 会員 / 管理の3層分離（attendance API は admin gate のみ通す）
- **#7** 論理削除（削除済み会員は attendance 候補から除外）
- **#11** 管理者は他人本文を直接編集できない（profile 直接編集 endpoint 非導入を spec で固定）
- **#13** 開催日 / 参加履歴は Forms schema 外（admin-managed）
- **#15** attendance 重複不可・削除済み除外

## completion definition

- 13 Phase の `status` が artifacts.json で全て `completed`
- AC-1〜7 が Phase 7 マトリクスで完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべて PASS
- 不変条件 #5 / #7 / #11 / #13 / #15 が Phase 9 多角的チェックで触れられている
- Phase 13 で user 承認後に PR 作成完了
