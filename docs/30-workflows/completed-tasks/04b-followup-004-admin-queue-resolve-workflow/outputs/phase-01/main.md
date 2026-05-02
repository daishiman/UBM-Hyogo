# Phase 1 — 要件定義サマリ

issue: #319 / 04b-followup-004-admin-queue-resolve-workflow

## ゴール
admin が `visibility_request` / `delete_request` の pending 依頼を一覧で確認し、承認/却下によって `member_status` と `admin_member_notes` を atomic に更新する正規ワークフローを提供する。04b-followup-001 で揃った status/metadata カラムを実際に消費する閉ループを完成させる。

## スコープ
- `GET /admin/requests?status=pending&type=visibility_request|delete_request` — pending FIFO 一覧 + cursor pagination
- `POST /admin/requests/:noteId/resolve` — `{ resolution: approve|reject, resolutionNote? }`
- approve+visibility_request → `member_status.publish_state` 更新
- approve+delete_request → `member_status.is_deleted=1` + `deleted_members` INSERT
- reject → `member_status` 不変、note のみ rejected に
- Web UI `/admin/requests` — list / detail / confirmation modal

## 不変条件 (CLAUDE.md)
- #4: admin-managed data（`admin_member_notes`）は Google Form schema と分離維持
- #5: D1 直接アクセスは `apps/api` のみ。`apps/web` は admin proxy 経由のみ
- #11: profile 本文 mutation は admin から作らない
- #13: tag 直接更新 mutation は本ワークフローに含めない

## 受け入れ条件 (AC)
| AC | 内容 |
|----|------|
| AC-1 | admin が pending 依頼一覧を取得できる（FIFO・cursor pagination） |
| AC-2 | visibility_request 承認で `member_status.publish_state` が `desiredState` に更新 |
| AC-3 | delete_request 承認で `member_status.is_deleted=1` + `deleted_members` 行追加 |
| AC-4 | reject 時は `member_status` 不変・note のみ rejected |
| AC-5 | 二重 resolve は 409 で拒否される（楽観ロック） |
| AC-6 | `member_status` + note 更新が atomic（D1 batch） |
| AC-7 | PII（email/phone/name 等）は admin UI に raw で出さない |

## 非ゴール
- profile 本文の admin 編集（不変条件 #11）
- tag 直接更新（不変条件 #13）
- 自動再申請ループ（reject 後のフォロー UI）

## 依存タスク
- 04b-followup-001（status/metadata カラム・`markResolved` / `markRejected`）
- 05a（`requireAdmin` middleware）
- 06c / 07a（admin proxy / sidebar）
