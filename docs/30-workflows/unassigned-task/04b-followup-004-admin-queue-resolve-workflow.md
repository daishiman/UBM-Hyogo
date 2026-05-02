# admin queue resolve workflow（編集/削除依頼の確定処理） - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | 04b-followup-004-admin-queue-resolve-workflow                       |
| タスク名     | admin queue resolve workflow（visibility_request / delete_request の処理） |
| 分類         | 機能追加 / 管理者バックオフィス                                     |
| 対象機能     | admin が `admin_member_notes` の依頼を pickup → 公開状態変更 + audit |
| 優先度       | 高                                                                  |
| 見積もり規模 | 中〜大規模                                                          |
| ステータス   | consumed / canonical workflow 実装完了（canonical: `docs/30-workflows/04b-followup-004-admin-queue-resolve-workflow/`、Phase 1-12 completed、Phase 13 pending_user_approval） |
| 発見元       | 04b Phase 12 unassigned-task-detection #4                           |
| 発見日       | 2026-04-29                                                          |
| 委譲先 wave  | 07a / 07c                                                           |

## Canonical Status

本単票は `docs/30-workflows/04b-followup-004-admin-queue-resolve-workflow/` の Phase 1-13 仕様書へ昇格し、同 canonical workflow で実装完了済み。Current canonical state is `implementation_completed`; this stub is retained only as source trace evidence.

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b で member 側の `/me/visibility-request` `/me/delete-request` を実装し、依頼内容を `admin_member_notes` に `note_type='visibility_request'` / `'delete_request'` として永続化した。しかし **admin 側で pickup → 確定する resolve workflow** は未実装で、依頼が永遠に pending 状態のまま蓄積する。07a（admin バックオフィス）または 07c（管理 API）で実装する必要がある。

### 1.2 問題点・課題

- 依頼を pickup する admin 用 API / UI が無い
- 確定処理（visibility_request → `member_status.publish_state` 変更 / delete_request → 論理削除）の trigger 経路が未確定
- audit log（誰が・いつ・どの依頼を処理したか）の記録仕様が未定（[04b-followup-001](04b-followup-001-admin-queue-request-status-metadata.md) の request metadata と連動）
- 依頼処理後の memberに対する通知 (Magic Link 含む) の有無が未定義

### 1.3 放置した場合の影響

- member の編集/削除依頼が機能せず、利用規約上の「自己情報削除権」を満たせない
- admin 側に依頼一覧が見えない状態で運用開始すると、依頼が滞留し regulatory なクレームが発生
- audit 履歴が無いまま手作業で `member_status` を更新すると、不変条件 #4（admin-managed data 分離）の遵守が破綻する

---

## 2. 何を達成するか（What）

### 2.1 目的

admin が `admin_member_notes` の `note_type='visibility_request'` / `'delete_request'` を **一覧表示し pickup → resolve** する一連のワークフローを構築し、`member_status` テーブルの公開状態 / 削除状態を整合的に更新する。

### 2.2 最終ゴール

- admin queue 一覧 API（pending 依頼の列挙）が存在する
- resolve API（`POST /admin/requests/:noteId/resolve`）が `member_status.publish_state` 更新 / 論理削除 / `admin_member_notes` の status 更新を atomic に実行する
- audit 行が `admin_member_notes`（または別テーブル）に追記される
- admin UI（07a）で pickup 〜 resolve まで操作可能

### 2.3 スコープ

#### 含むもの

- pending 依頼一覧 API
- resolve API（visibility_request / delete_request の両方）
- D1 transaction での `member_status` + `admin_member_notes` 同時更新
- audit metadata（resolved_by / resolved_at / resolutionNote）
- admin UI 連携（07a と同期）

#### 含まないもの

- request status / metadata の **schema 設計** 自体（[04b-followup-001](04b-followup-001-admin-queue-request-status-metadata.md) で実施済み）
- member 側 `/me/*` の API 仕様変更（04b で fix 済）
- 通知/メール連携（別タスクで判断）

### 2.4 成果物

- admin queue 一覧 / resolve API 実装
- D1 migration（[04b-followup-001](04b-followup-001-admin-queue-request-status-metadata.md) の追加列を使う。新規列追加が必要な場合のみ別 migration）
- admin UI 統合差分（07a と同期）
- audit 動作の単体・統合テスト

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- [04b-followup-001](04b-followup-001-admin-queue-request-status-metadata.md) が完了し、`admin_member_notes` に `request_status` / `resolved_at` / `resolved_by_admin_id` 列が存在する
- 04b で確立した `adminNotes.findLatestByMemberAndType` `adminNotes.hasPendingRequest` の利用方針を継承
- 不変条件 #4（admin-managed data 分離）と #5（D1 アクセスは apps/api 内）

### 3.2 実行手順

1. `GET /admin/requests?status=pending&type=visibility_request|delete_request` 仕様を確定
2. `POST /admin/requests/:noteId/resolve` 仕様を確定（resolution: approve / reject）
3. D1 transaction で `member_status` と `admin_member_notes` を同時更新するリポジトリ層を実装
4. visibility_request 承認: `member_status.publish_state` を依頼内容に応じて変更
5. delete_request 承認: `member_status.is_deleted` を 1 に、`admin_member_notes.request_status='resolved'` に
6. audit テスト（複数承認・拒否・冪等性）

### 3.3 受入条件 (AC)

- AC-1: admin が pending 依頼を一覧で取得できる
- AC-2: visibility_request 承認で `member_status.publish_state` が更新される
- AC-3: delete_request 承認で論理削除フラグが立つ
- AC-4: 拒否 (reject) 時は `member_status` を変更せず status を rejected にする
- AC-5: 同 noteId への二重 resolve が冪等または 409 で拒否される
- AC-6: 全更新が D1 transaction で atomic（途中失敗でロールバック）

---

## 4. 苦戦箇所 / 学んだこと（04b で得た知見）

### 4.1 admin schema 拡張の wave 境界

04b では `admin_member_notes.note_type` 列を additive migration（0006）で追加し、04b-followup-001 で `request_status` / `resolved_at` / `resolved_by_admin_id` を追加した。本タスクはその列を利用するため、**schema ownership 宣言**を Phase 1 で明示し、追加 ALTER が必要な場合だけ新規 migration を起こす。

### 4.2 admin と member の責務境界

04b の `/me/*` は依頼の **作成** のみ責務。本タスクの `/admin/*` は依頼の **解決** のみ責務。`admin_member_notes` テーブルを共同利用するが、書き込み主体は明確に分離する。

---

## 5. 関連リソース

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- 04b の `apps/api/src/repository/adminNotes.ts`
- migration 0006 (`admin_member_notes.note_type`)
- [04b-followup-001-admin-queue-request-status-metadata.md](04b-followup-001-admin-queue-request-status-metadata.md)
