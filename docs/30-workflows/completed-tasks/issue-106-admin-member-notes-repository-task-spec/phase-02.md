# Phase 2: 技術設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 前Phase | Phase 1 |
| 次Phase | Phase 3 |

## 目的

`admin_member_notes` の read path を repository として実装する場合の型、SQL、境界、依存関係を確定する。

## 実行タスク

1. repository public API を決める。
2. D1 schema と TypeScript row 型の対応表を作る。
3. `buildAdminMemberDetailView()` の `adminNotes` 引数に渡す adapter 方針を決める。
4. `_shared/brand.ts` の既存 brand 型を確認し、追加が必要な場合だけ追加する。
5. public/member view model への混入防止策を設計する。
6. admin detail の `audit` が `audit_log` 由来か、`admin_member_notes` 由来かを分離して設計する。

## 参照資料

- `apps/api/src/repository/adminNotes.ts`
- `apps/api/src/repository/_shared/brand.ts`
- `apps/api/src/repository/_shared/db.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md`

## 実行手順

1. repository 名は現行正本に合わせて `adminNotes.ts` を優先する。Issue 元指示の `adminMemberNotes.ts` は旧候補名として記録する。
2. read-only 最小実装の場合は `listByMemberId(c: DbCtx, memberId: MemberId)` を必須 API とする。
3. 現行実装と同等に CRUD を含む場合でも、本 Issue の AC は read path に限定して trace する。
4. SQL は `SELECT ... FROM admin_member_notes WHERE member_id = ?1 ORDER BY created_at DESC` を基本とする。
5. `AdminMemberNoteRow` と builder audit DTO は別型にしてよい。必要な場合は route/service 層で `{ actor, action, occurredAt, note }` へ変換する。
6. `GET /admin/members/:memberId` が `audit_log` を渡している場合は、その契約を壊さず、admin notes 表示は別 field / drawer section / route response のどこに置くかを 04c 側で決める。

## 統合テスト連携

`apps/api/src/repository/__tests__/adminNotes.test.ts` に repository contract を置き、route contract は 04c 側へ委譲する。

## 多角的チェック観点（AIが判断）

- DB 列対応: `note_id`, `member_id`, `body`, `note_type`, `request_status`, `resolved_at`, `resolved_by_admin_id`, `created_by`, `updated_by`, `created_at`, `updated_at`
- 仕様語と実装語: Issue 元の `actor/action/occurredAt/note` は audit DTO、DB row は `createdBy/body/createdAt` を主語にする。
- owner: `apps/api/src/repository/adminNotes.ts` の canonical owner は admin repository task。
- co-owner: 04c admin route は consumer として review 責務を持つ。
- auth / audit: mutation route は `requireAdmin` と `audit_log.append` を consumer 側 AC に含める。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P2-1 | public API 設計 | 関数名・引数・戻り値が確定 |
| P2-2 | DB 対応表 | DDL と row 型の対応が確定 |
| P2-3 | 境界設計 | public/member 非混入の確認方法が確定 |

## 成果物

- module map
- dependency matrix
- DB to TS mapping
- audit DTO adapter 方針

## 完了条件

- [ ] D1 schema に存在しない列を前提にしていない。
- [ ] `member_responses` / `response_fields` を触らない設計になっている。
- [ ] 04c が consumer として呼べる API が明記されている。

## タスク100%実行確認【必須】

- [ ] 旧候補名と現行名の差分が記録されている。
- [ ] 不変条件 #11 / #12 の検証方法が Phase 4 へ渡されている。

## 次Phase

Phase 3: 設計レビュー。
