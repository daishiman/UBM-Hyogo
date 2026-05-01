# Issue 106 admin_member_notes repository task spec

## メタ情報

| 項目 | 値 |
| --- | --- |
| GitHub Issue | #106 `[UT-02A] admin_member_notes 読み取り Repository 新設` |
| Issue 状態 | closed のまま扱う |
| タスクID | task-imp-02a-admin-member-notes-repository-001 |
| タスク種別 | implementation / NON_VISUAL |
| docsOnly | false（当初は仕様書作成のみ。今回のユーザー指示で既存実装の regression test 追加まで実行） |
| 作成日 | 2026-05-01 |
| 状態 | implemented_pending_user_approval |
| スコープ | 既存 repository 実装の regression test / 04c handoff verification / Phase 1-12 evidence 更新まで。commit、push、PR 作成、Issue 状態変更は行わない |

## 目的

`buildAdminMemberDetailView()` が引数で受け取る `adminNotes` を D1 の `admin_member_notes` から取得する repository 実装タスクを、Phase 1-13 の単独実行可能な仕様書として再構成する。

Issue #106 は既に closed であり、現在の main には `apps/api/src/repository/adminNotes.ts` が存在する。本仕様書は closed Issue の事後整理ではなく、同等タスクを再検証する場合の設計書ベース仕様として保存する。今回の実行では、新規 repository は作らず、既存実装に対する regression test と 04c handoff verification を追加した。

## Decision Log

| 日付 | 判断 | 根拠 |
| --- | --- | --- |
| 2026-05-01 | Issue #106 は reopen せず、実装前仕様として再構成する | Issue は closed で現行実装 anchor が存在するため、状態変更ではなく履歴保存と後続実装者向け境界明確化を目的にする |
| 2026-05-01 | `adminMemberNotes.ts` は新設せず `adminNotes.ts` を canonical owner とする | 02c の admin repository 正本と重複させない |
| 2026-05-01 | mutation / audit route は本体 AC ではなく 04c consumer handoff として扱う | 本タスクの中心は read repository と public/member 非混入の検証であり、write path は責務境界が異なる |
| 2026-05-01 | ユーザー指示により docs-only close-out から実装検証 close-out へ切替 | `apps/api` の regression test 3 ファイルを追加し、Phase 9/11/12 の実測 evidence と整合させるため |

## 受入条件

- AC-1: `apps/api/src/repository/adminNotes.ts` または互換 repository が `listByMemberId(c, memberId)` を提供する。
- AC-2: `admin_member_notes` は `PublicMemberProfile` / `MemberProfile` に混入しない。
- AC-3: repository は `_shared/db.ts`、`_shared/brand.ts`、D1 `prepare/bind` 規約に従う。
- AC-4: `member_id` で絞り、他 member の note を返さない。
- AC-5: 一覧は新しい順で返す。現行正本では `created_at DESC` を採用する。
- AC-6: 空結果は `[]` とする。
- AC-7: `member_responses` / `response_fields` を更新しない。
- AC-8: repository unit test と view model 非混入 test を用意する。
- AC-9: 04c admin backoffice API が依存先として参照できる。
- AC-10: 04c consumer handoff として、admin note mutation route は `requireAdmin` を通し、mutation 時は `audit_log` append を同一 branch の verification scope で確認する。本タスク単体の read repository PASS 条件とは分離して記録する。
- AC-11: Guardrail として、現行 admin detail の `audit` が `audit_log` 由来である場合、`admin_member_notes` row を builder audit DTO と直接同一視しない。

## 正本参照

| 種別 | パス |
| --- | --- |
| Issue 元指示 | `docs/30-workflows/completed-tasks/UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY.md` |
| 管理 repository 境界 | `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` |
| D1 schema | `docs/00-getting-started-manual/specs/08-free-database.md` |
| 管理 UI / API 方針 | `docs/00-getting-started-manual/specs/11-admin-management.md` |
| builder 契約 | `apps/api/src/repository/_shared/builder.ts` |
| admin detail route | `apps/api/src/routes/admin/members.ts` |
| admin note route | `apps/api/src/routes/admin/member-notes.ts` |
| 現行実装 anchor | `apps/api/src/repository/adminNotes.ts` |

## 現行実装との衝突解消

Issue 元指示は `adminMemberNotes.ts` と `listAdminNotesByMemberId()` を想定していたが、main の現行実装では 02c の広い admin repository として `adminNotes.ts` / `listByMemberId()` が正本化されている。さらに `buildAdminMemberDetailView()` の `audit` 引数は audit-shaped DTO であり、現在の admin detail route は `audit_log` を渡す。

したがって実装時は、`adminMemberNotes.ts` を重複新設せず、必要な場合だけ `adminNotes.listByMemberId()` から画面用 DTO へ変換する adapter を 04c 側に置く。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義・P50確認 | `phase-01.md` | completed |
| 2 | 技術設計 | `phase-02.md` | completed |
| 3 | 設計レビュー | `phase-03.md` | completed |
| 4 | テスト戦略 | `phase-04.md` | completed |
| 5 | 実装ランブック | `phase-05.md` | completed |
| 6 | 異常系検証 | `phase-06.md` | completed |
| 7 | AC トレース | `phase-07.md` | completed |
| 8 | DRY / 命名整理 | `phase-08.md` | completed |
| 9 | 品質保証 | `phase-09.md` | completed |
| 10 | 最終レビュー | `phase-10.md` | completed |
| 11 | NON_VISUAL evidence | `phase-11.md` | completed |
| 12 | ドキュメント同期 | `phase-12.md` | completed |
| 13 | 承認ゲート | `phase-13.md` | blocked_pending_user_approval |
