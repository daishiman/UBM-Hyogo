# Phase 1: 要件定義・P50確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| タスク | Issue #106 admin_member_notes repository |
| 種別 | implementation / NON_VISUAL |
| docsOnly | false（当初は仕様書作成のみ。今回の実行では既存実装の regression test 追加まで含める） |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_pending_user_approval |
| scope | タスク仕様書作成のみ。コード実装、commit、push、PR 作成は行わない |

## 目的

Issue #106 の実装要件、既存実装有無、正本仕様との対応を確定し、Phase 2 以降の設計に進める状態にする。

## 実行タスク

1. `git log -- apps/api/src/repository/adminNotes.ts apps/api/src/repository/_shared/builder.ts` で既存履歴を確認する。
2. `rg -n "admin_member_notes|adminNotes|buildAdminMemberDetailView" apps/api docs .claude` で current code anchor を確認する。
3. Issue 元指示 `docs/30-workflows/completed-tasks/UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY.md` を読む。
4. `docs/00-getting-started-manual/specs/08-free-database.md` の `admin_member_notes` DDL と indexes を確認する。
5. `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` の repository 境界を確認する。
6. `artifacts.json.metadata` の `taskType` / `visualEvidence` / `scope` / `workflow_state` が本 Phase と一致することを確認する。

## Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | なし。本仕様書作成では `admin_member_notes` DDL、repository、shared exports を編集しない |
| 本タスクが ownership を持つか | no。実装 owner は既存 `apps/api/src/repository/adminNotes.ts` の admin repository wave |
| 他 wave への影響 | 04c admin route は consumer、04b member self-service は queue producer |
| 競合リスク | Issue 元候補名 `adminMemberNotes.ts` と現行 `adminNotes.ts` の重複新設 |
| migration 番号 / exports 改名の予約 | 予約しない。既存 `0006` / `0007` migration を参照のみ |
| test file ownership | repository test は `apps/api/src/repository/__tests__/adminNotes.test.ts`、route contract は 04c consumer 側 |

## 参照資料

- `apps/api/src/repository/adminNotes.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `apps/api/migrations/0006_admin_member_notes_type.sql`
- `apps/api/migrations/0007_admin_member_notes_request_status.sql`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/11-admin-management.md`

## 実行手順

1. P50 確認として、対象 repository が未実装か既実装かを先に確定する。
2. 既実装の場合は重複実装を禁止し、仕様書上は「現在の実装を正本 anchor として扱う」方針に切り替える。
3. `buildAdminMemberDetailView()` の `adminNotes` 引数型を写経せず、実コードから確認する。
4. 受入条件 AC-1 から AC-9 を index と一致させる。
5. Phase 1-3 が完了するまで Phase 4 以降の実装計画を確定しない。

## 統合テスト連携

Phase 1 ではテスト実行は任意。実装状態の棚卸しとして `pnpm --filter ./apps/api test -- adminNotes` 相当の実行候補だけ記録する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: Issue 元指示の `adminMemberNotes.ts` 名と現行 `adminNotes.ts` 名の差分を明示する。
- 漏れなし: DB 列、戻り型、非混入 invariant、下流 04c 依存を全て拾う。
- 整合性: closed Issue を reopen しない。
- 依存関係整合: 02a builder、02c admin repository、04c route の順序を崩さない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P1-1 | P50 実装確認 | current anchor が列挙されている |
| P1-2 | 正本仕様確認 | DDL / repository boundary / admin management が参照済み |
| P1-3 | AC 確定 | index の AC-1〜AC-11 と一致 |

## 成果物

- Phase 1 実装確認メモ
- spec extraction map
- AC 一覧

## 完了条件

- [ ] 既実装/未実装の判定が記録されている。
- [ ] `admin_member_notes` の列と index が正本から確認されている。
- [ ] 不変条件 #11 / #12 が Phase 2 へ引き継がれている。

## タスク100%実行確認【必須】

- [ ] P50 確認を省略していない。
- [ ] Phase 2 に渡す未確定事項がない。

## 次Phase

Phase 2: 技術設計。
