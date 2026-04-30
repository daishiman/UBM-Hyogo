# changelog fragment: 04b-followup-001 admin queue request_status metadata sync

- date: 2026-04-30
- worktree: task-20260430-141846-wt-1
- task: `docs/30-workflows/completed-tasks/04b-followup-001-admin-queue-request-status-metadata/`
- wave: 4 / followup / implementation / NON_VISUAL

## 同期内容

- `apps/api/migrations/0007_admin_member_notes_request_status.sql`: 新規追加。`admin_member_notes` に `request_status TEXT` / `resolved_at INTEGER` / `resolved_by_admin_id TEXT` を additive ALTER。既存 `visibility_request` / `delete_request` 行を `pending` で backfill し、partial index `idx_admin_notes_pending_requests`（`WHERE request_status='pending'` 限定）を作成
- `apps/api/src/repository/adminNotes.ts`: `RequestStatus` 型（`pending` | `resolved` | `rejected`）追加 / `AdminMemberNoteRow` に `requestStatus` / `resolvedAt` / `resolvedByAdminId` 拡張 / `create` で request 行を `pending` 初期化 / `hasPendingRequest` を `request_status='pending'` ベース判定へ移行（resolved 後の再申請を構造的に許容）/ `markResolved` / `markRejected` を `WHERE request_status='pending'` ガード付き UPDATE で追加（`markRejected` は `body = body || ?3` の単発 SQL 連結で reason を atomic 追記）
- `apps/api/src/repository/__tests__/adminNotes.test.ts`: state transition / 再申請 / pending ガード / general 行 no-op の単体テスト追加
- `apps/api/src/routes/me/index.test.ts`: resolved 後の `POST /me/visibility-request` が 202 で成功するケースを追加（互換性回帰固定）
- `docs/00-getting-started-manual/specs/07-edit-delete.md`: 「申請 queue の状態遷移」節を追加（Mermaid + 列定義 + 不変条件参照）
- `docs/00-getting-started-manual/specs/08-free-database.md`: `admin_member_notes` 列定義に `request_status` / `resolved_at` / `resolved_by_admin_id` と partial index を追記
- `references/database-admin-repository-boundary.md`: `adminNotes.ts` boundary の queue 行に `request_status` 列ベース pending 判定 / `markResolved` / `markRejected` の admin context 限定を追記
- `references/task-workflow-active.md`: 04b-followup-001 を completed_without_pr / Phase 1-12 完了 / NON_VISUAL として登録
- `indexes/quick-reference.md`: §UBM-Hyogo Member Self-Service queue 早見に request_status 状態機械 / partial index / 再申請許容契約を追加
- `indexes/resource-map.md`: 「04b-followup-001 admin queue request_status metadata」行を追加（migration 0007 / repository helper / specs 07/08 / lessons-learned L-04B-006 へリンク）
- `references/lessons-learned-04b-member-self-service.md`: L-04B-006 を末尾に追加（pending 列ベース移行 / partial index 設計 / migration 0006→0007 additive 連鎖 / 既存「最新行存在」前提テストとの互換性確保）
- `changelog/`（本ファイル）: 04b-followup-001 close-out entry を追加

## 検証

- 仕様根拠: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `phase12-task-spec-compliance-check.md`（不変条件 #4 / #5 / #11 trace）/ `documentation-changelog.md`
- 実装: `apps/api/migrations/0007_admin_member_notes_request_status.sql` / `apps/api/src/repository/adminNotes.ts` / `apps/api/src/repository/__tests__/adminNotes.test.ts` / `apps/api/src/routes/me/index.test.ts`
- 制約: 各 reference 500 行以内維持（lessons-learned-04b: L-04B-006 追加後も 500 行以内）
- typecheck / lint / test: exit 0 / 407 tests pass（Phase 11 検証済）

## 不変条件 trace

- #4（response_fields 非介入）: migration 0007 は `admin_member_notes` 単独 ALTER。`response_fields` / `member_responses` には触れない
- #5（D1 アクセスは `apps/api` 限定）: repository helper は `apps/api/src/repository/adminNotes.ts` 内で完結。`apps/web` は経由しない
- #11（管理者は member 本文を直接編集しない）: `markResolved` / `markRejected` は `admin_member_notes` 行のみ UPDATE。`member_responses` は不変

## 関連 Issue / 後続

- Issue: #217
- 下流: 07a / 07c admin resolve workflow が `markResolved` / `markRejected` を import して queue UI から状態遷移を駆動する
