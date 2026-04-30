# 04b-followup-001-admin-queue-request-status-metadata Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 04b-followup-001-admin-queue-request-status-metadata |
| タスク種別 | impl（admin_member_notes に request_status / requested_at メタデータを追加し、`/me/visibility-request` `/me/delete-request` 投入経路を pending で記録） |
| ワークフロー | in-progress（Phase 1-13 進行中） |
| canonical task root | `docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata/` |
| 同期日 | 2026-04-30 |
| owner | apps/api |
| domain | admin queue / member self-service write API |
| depends_on | 04b（`/me/*` self-service API、`admin_member_notes` 初期スキーマ） |
| 委譲先 | 04b-followup-004-admin-queue-resolve-workflow（resolve 経路） |

## Acceptance Criteria

詳細は `docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata/outputs/phase-07/ac-matrix.md` を正本とする（AC-1 〜 AC-11）。要点:

- AC-1: migration `0007_admin_member_notes_request_status.sql` が `request_status` (`pending` / `resolved` / `rejected`) と `requested_at` 列を追加する
- AC-2: 既存 `admin_member_notes` 行は backfill で `request_status='pending'`, `requested_at=created_at` を割り当てる
- AC-3: `repository/adminNotes.ts` の insert 経路が `request_status='pending'`, `requested_at=now` を必ずセットする
- AC-4: `/me/visibility-request` POST 時、新規 `admin_member_notes` 行が `note_type='visibility_request'` + `request_status='pending'` で記録される
- AC-5: `/me/delete-request` POST 時、新規 `admin_member_notes` 行が `note_type='delete_request'` + `request_status='pending'` で記録される
- AC-6: 同一 member の同一 note_type で `request_status='pending'` が既に存在する場合は重複投入を防止 (409 など、設計に従う)
- AC-7: admin が resolve / reject 後（pending 行が消える）は再投入が許可される
- AC-8: `repository/__tests__/adminNotes.test.ts` が pending insert / 重複防止 / status 遷移を網羅する
- AC-9: `routes/me/index.test.ts` が visibility / delete request の status=pending 記録を契約レベルで検証する
- AC-10: `responseEmail` / `rulesConsent` / `adminNotes` を含む禁止 leak が response に発生しない（不変条件 #4 trace）
- AC-11: spec `07-edit-delete.md` / `08-free-database.md` が request_status 追加に整合した記述に更新される

## 不変条件 Trace

| 不変条件 | 該当箇所 | 対応 |
|---|---|---|
| #4 admin-managed data 分離 | `admin_member_notes.request_status` は admin-managed 列。GET 系 response に絶対露出しない | repository converter で omit、route test で leak assert |
| #5 D1 直接アクセス禁止 | migration / repository は `apps/api` に閉じる。`apps/web` から直接参照しない | 物理ファイル配置（`apps/api/migrations/`、`apps/api/src/repository/`） |
| #11（系列がある場合） | request_status 値域 `pending` / `resolved` / `rejected` に固定し、自由文字列を許さない | CHECK 制約 + repository 型ガード |

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata/phase-01.md` / `outputs/phase-01/` | 要件定義 / AC-1〜11 |
| 2 | `phase-02.md` / `outputs/phase-02/` | 設計（テーブル拡張・状態遷移） |
| 3 | `phase-03.md` / `outputs/phase-03/` | API 契約（`/me/*` POST 投入時の status 確定） |
| 4 | `phase-04.md` / `outputs/phase-04/` | テスト戦略 / matrix |
| 5 | `phase-05.md` / `outputs/phase-05/` | repository 設計（`adminNotes.ts`） |
| 6 | `phase-06.md` / `outputs/phase-06/` | view-model / route 設計 |
| 7 | `phase-07.md` / `outputs/phase-07/` | ac-matrix.md（正本） |
| 8 | `phase-08.md` / `outputs/phase-08/` | `_shared/` / repository 共通化評価 |
| 9 | `phase-09.md` / `outputs/phase-09/` | main.md（不変条件 trace） |
| 10 | `phase-10.md` / `outputs/phase-10/` | E2E / contract 移送判断 |
| 11 | `phase-11.md` / `outputs/phase-11/` | manual-evidence.md |
| 12 | `phase-12.md` / `outputs/phase-12/` | implementation-guide / system-spec-update-summary / unassigned-task-detection / skill-feedback-report |
| 13 | `phase-13.md` | ユーザー承認 / PR |

## 主要 Artifact

### Migration

| ファイル | 役割 | AC trace | 不変条件 trace |
|---|---|---|---|
| `apps/api/migrations/0007_admin_member_notes_request_status.sql` | `admin_member_notes` に `request_status` / `requested_at` 列追加 + 既存行 backfill | AC-1 / AC-2 | #4（admin-managed 列） / #5（apps/api 配下） |

### Repository（変更）

| ファイル | 役割 | AC trace | 不変条件 trace |
|---|---|---|---|
| `apps/api/src/repository/adminNotes.ts` | insert 時 `request_status='pending'` / `requested_at=now` を必ずセット。重複 pending 防止。GET 系では admin 経路にのみ露出 | AC-3 / AC-4 / AC-5 / AC-6 / AC-7 | #4 / #5 / #11（status enum 固定） |

### Repository Test

| ファイル | 役割 | AC trace | 不変条件 trace |
|---|---|---|---|
| `apps/api/src/repository/__tests__/adminNotes.test.ts` | pending insert / 重複防止 / status 遷移を unit test | AC-3 / AC-6 / AC-7 / AC-8 | #11（enum 値域） |

### Route Test

| ファイル | 役割 | AC trace | 不変条件 trace |
|---|---|---|---|
| `apps/api/src/routes/me/index.test.ts` | `/me/visibility-request` `/me/delete-request` の POST 契約。pending 行が記録されることと、response に admin-managed 列が leak しないこと | AC-4 / AC-5 / AC-9 / AC-10 | #4（leak 防御） |

### Spec（正本仕様）

| ファイル | 反映内容 | AC trace |
|---|---|---|
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 編集/削除依頼の状態遷移（pending → resolved / rejected）と再申請条件を追記 | AC-7 / AC-11 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | `admin_member_notes` テーブルに `request_status` / `requested_at` を追記 | AC-1 / AC-11 |

### Unassigned-task（依存差替）

| ファイル | 役割 |
|---|---|
| `docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md` | resolve / reject 経路は本タスクのスコープ外。本タスクで `request_status` 列が確定することを前提に、04b-followup-004 が pickup → 確定 → audit を実装する。依存先記述を本タスク完了で「pending メタ実装済み」に差し替える |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/me/visibility-request` `/me/delete-request` の右列に「投入時 `request_status='pending'` で記録 / resolve・reject 後は再申請可能」を追記 |
| `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` | `admin_member_notes` の `request_status` / `requested_at` 列を境界記述に追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 04b-followup-001 を active タスクとして登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | 本 inventory への参照を追加 |

## Validation Chain

| 検証項目 | 結果（Phase 11 時点で更新） |
|---|---|
| migration 適用（local D1） | TBD |
| backfill 後の既存行 status 確認 | TBD |
| `repository/__tests__/adminNotes.test.ts` | TBD |
| `routes/me/index.test.ts` | TBD |
| typecheck / lint | TBD |
| 不変条件 #4 / #5 / #11 trace（`outputs/phase-09/main.md`） | TBD |
| Phase 11 manual evidence | TBD |
| Phase 13（ユーザー承認 / PR 作成） | PENDING |

## 確定値・列定義

- `request_status` enum: `'pending'` / `'resolved'` / `'rejected'`
- `requested_at`: D1 `TEXT` (ISO8601)、insert 時 `datetime('now')`
- backfill: 既存行は `request_status='pending'`, `requested_at=created_at`
- 重複防止条件: `(member_id, note_type, request_status='pending')` のユニーク扱い
