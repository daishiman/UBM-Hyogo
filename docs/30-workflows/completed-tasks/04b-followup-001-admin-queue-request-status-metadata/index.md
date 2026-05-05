# 04b-followup-001-admin-queue-request-status-metadata — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| ディレクトリ | docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata |
| Wave | 4 (followup) |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 担当 | app-member-self-service |
| 状態 | implementation / Phase 1-12 completed / Phase 13 pending_user_approval |
| タスク種別 | implementation |
| workflow_state | spec_created |
| Issue | #217 |

## 目的

`admin_member_notes` の `visibility_request` / `delete_request` 行に「処理状態（pending/resolved/rejected）」と「処理結果メタデータ（resolved_at / resolved_by_admin_id）」を列として追加し、本人再申請ガード（04b）と admin resolve workflow（07a / 07c）が同じ正本を参照できる構造に揃える。`hasPendingRequest` を「同 type の最新行が存在 = pending」から `request_status='pending'` に基づく判定へ移行し、admin 処理後の本人再申請経路を論理的に開く。

## スコープ

### 含む

- `apps/api/migrations/0007_admin_member_notes_request_status.sql`
  - `request_status TEXT` / `resolved_at INTEGER` / `resolved_by_admin_id TEXT` の追加
  - 既存 `visibility_request` / `delete_request` 行を `request_status='pending'` に backfill
  - `general` 行は `request_status NULL` のまま
  - 追加の partial index `idx_admin_notes_pending_requests` の作成
- `apps/api/src/repository/adminNotes.ts` への state transition helper 追加
  - `markResolved(noteId, adminId)` / `markRejected(noteId, adminId, reason)`
  - `hasPendingRequest` を `request_status='pending'` 限定化
  - 新 `RequestStatus` 型と Row interface 拡張
- `routes/me/services.ts` の `memberSelfRequestQueue` が `hasPendingRequest` 経由で pending 限定判定へ切り替わることを確認（route 本体は原則変更不要）
- `apps/api/src/repository/__tests__/adminNotes.test.ts` への state transition テスト追加
- `routes/me/index.test.ts` への「処理済み後の再申請が成功」ケース追加
- `docs/00-getting-started-manual/specs/07-edit-delete.md` の queue 状態遷移節追記

### 含まない

- 07a / 07c admin resolve workflow 本体（参照タスクへ委譲、本タスクは helper の export 契約までを定義）
- audit_log schema 変更（既存 audit 構造を維持）
- 物理削除の導入（論理削除運用を踏襲）
- web 側 UI 表示変更（NON_VISUAL タスク）
- CHECK 制約による enum 固定（DDL は TEXT、enum は zod / repository 層で守る）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04b-parallel-member-self-service-api-endpoints | `note_type` 列追加（migration 0006）が前提 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `admin_member_notes` 基盤と repository 層 |
| 下流 | 07a-parallel-tag-assignment-queue-resolve-workflow | resolve 時に `markResolved` / `markRejected` を呼ぶ |
| 下流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | delete_request resolve 時に同 helper を利用 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | 本タスクの正本指示書（Issue #217） |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | queue 状態遷移を追記する spec |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | `admin_member_notes` テーブル定義 |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration（note_type 追加）と整合 |
| 必須 | apps/api/src/repository/adminNotes.ts | repository helper 改修対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API 正本との整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本との整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | task workflow 正本との整合 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | 正本参照導線 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | 正本 quick reference |
| 参考 | docs/30-workflows/04b-parallel-member-self-service-api-endpoints/index.md | 課題発見元 workflow |
| 必須 | CLAUDE.md | 不変条件 #4 / #5 / #11 |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/index.md | 状態遷移設計の体裁 |

## 受入条件 (AC)

- AC-1: `admin_member_notes` に `request_status TEXT` / `resolved_at INTEGER` / `resolved_by_admin_id TEXT` の 3 列が追加され、`note_type='general'` 行は migration 後も 3 列とも NULL を維持し、repository helper 経由で request 状態へ遷移しない
- AC-2: migration 適用後、既存の `note_type IN ('visibility_request','delete_request')` 行が全て `request_status='pending'` / `resolved_at=NULL` / `resolved_by_admin_id=NULL` に backfill される（0 件取りこぼし）
- AC-3: `hasPendingRequest(memberId, noteType)` が `note_type=? AND request_status='pending'` の存在判定で true/false を返す（resolved/rejected 行は false 扱い）
- AC-4: `markResolved(noteId, adminId)` 呼出で当該行が `request_status='resolved'`、`resolved_at=now()`（unix epoch ms）、`resolved_by_admin_id=adminId` に更新され、対象行の noteId を返す。`general` 行に対する呼出は `null` を返し UPDATE 0 件
- AC-5: `markRejected(noteId, adminId, reason)` 呼出で `request_status='rejected'`、`resolved_at` / `resolved_by_admin_id` 同様に更新、`reason` は body 末尾に追記される（既存 body は保持）
- AC-6: state transition は単方向：`pending → resolved` / `pending → rejected` のみ許容。`resolved → *` / `rejected → *` の呼出は UPDATE 0 件（`WHERE request_status='pending'`）で防ぐ
- AC-7: `POST /me/visibility-request` / `POST /me/delete-request` で、resolved 行のみ存在する member は 202 で新規 pending 行が作成される（再申請可能）
- AC-8: 同 member × 同 type の pending 行が既にある場合は従来どおり 409 (DUPLICATE_PENDING_REQUEST)
- AC-9: partial index `idx_admin_notes_pending_requests` が `(member_id, note_type) WHERE request_status='pending'` に作成され、pending 検索が index hit する（`EXPLAIN QUERY PLAN` で確認）
- AC-10: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `apps/api` の vitest 全件 green
- AC-11: `docs/00-getting-started-manual/specs/07-edit-delete.md` に Mermaid 状態遷移図と `request_status` 値定義が追記され、不変条件 #4 / #11 に反していない旨が明記される

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md, state-machine.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md, test-strategy.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md, migration-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md, ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md, manual-smoke-log.md, link-checklist.md, sql/*.txt |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md + 必須6タスク成果物 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md, local-check-result.md, change-summary.md, pr-info.md, pr-creation-result.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| migration | apps/api/migrations/0007_admin_member_notes_request_status.sql | 列追加 + backfill + partial index |
| コード | apps/api/src/repository/adminNotes.ts | state transition helper |
| テスト | apps/api/src/repository/__tests__/adminNotes.test.ts | state transition テスト |
| テスト | apps/api/src/routes/me/index.test.ts | 再申請可能化のケース追加 |
| spec | docs/00-getting-started-manual/specs/07-edit-delete.md | queue 状態遷移節追記 |
| ドキュメント | outputs/phase-02/state-machine.md | Mermaid 状態遷移図 |
| ドキュメント | outputs/phase-05/migration-runbook.md | 0007 migration 適用 / rollback 手順 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装トレース |
| メタ | artifacts.json | 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api Hono | 100k req/日 |
| Cloudflare D1 | `admin_member_notes` ALTER TABLE / partial index | 5GB / 500k reads / 100k writes |

## Secrets 一覧（このタスクで導入）

なし。`CLOUDFLARE_API_TOKEN` 等は既存の `scripts/cf.sh` 経由で 1Password から動的注入。

## 触れる不変条件

- #4: `response_fields` は本人 PATCH 不可 / 申請は別テーブル化。本タスクは `admin_member_notes` のみを変更し、`member_responses` には触れない
- #5: D1 への直接アクセスは `apps/api` に閉じる。本 migration / repository は全て `apps/api` 配下
- #11: 管理者は member 本文を直接編集できない。`markResolved` / `markRejected` は `admin_member_notes` のみを更新し、`member_responses` には触れない

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致
- AC 11 件すべてが Phase 7 / 10 でトレース済み
- automation-30 の検証4条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- タスク独自の価値評価軸（価値性 / 実現性 / 整合性 / 運用性）が Phase 10 で PASS
- migration 0007 が local D1 に dry-run 適用され rollback 手順が phase-12 に記載
- Phase 13 の PR が user 承認後に作成

## 関連リンク

- 元正本指示書: ../unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md
- 上位 README: ../README.md
- 共通テンプレ: ../02-application-implementation/_templates/phase-template-app.md
- 上流 task: ../04b-parallel-member-self-service-api-endpoints/index.md
- 下流 task: ../02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/index.md
