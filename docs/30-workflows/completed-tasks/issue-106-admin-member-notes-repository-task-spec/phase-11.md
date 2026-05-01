# Phase 11: NON_VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| visualEvidence | NON_VISUAL |

## 目的

画面 screenshot ではなく、コード・テスト・静的確認で evidence を残す。

## 実行タスク

1. repository API の grep evidence を作成する。
2. DDL / migration の grep evidence を作成する。
3. test output を保存する。
4. public/member leak がないことを JSON または type assertion で記録する。

## 参照資料

- `apps/api/src/repository/adminNotes.ts`
- `apps/api/migrations/0006_admin_member_notes_type.sql`
- `apps/api/migrations/0007_admin_member_notes_request_status.sql`
- `apps/api/src/repository/__tests__/adminNotes.test.ts`

## 実行手順

候補 evidence:

```bash
rg -n "export const listByMemberId|admin_member_notes|PublicMemberProfile|MemberProfile" apps/api/src/repository/adminNotes.ts
rg -n "admin_member_notes|idx_admin_notes" apps/api/migrations docs/00-getting-started-manual/specs/08-free-database.md
pnpm --filter ./apps/api test -- adminNotes
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/repository/__tests__/adminNotes.test.ts
```

## 統合テスト連携

Phase 11 は evidence の記録であり、Phase 9 の test PASS を参照する。未実行なら `NOT_EXECUTED` と明記する。

## 多角的チェック観点（AIが判断）

- NON_VISUAL evidence は screenshot の代替であり、実行していないテストを PASS と書かない。
- closed Issue の状態変更は evidence に含めない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P11-1 | grep evidence | 対象 anchor が保存済み |
| P11-2 | test evidence | 実行結果が保存済み、または NOT_EXECUTED |
| P11-3 | leak evidence | 非混入確認が保存済み |

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md
- outputs/phase-11/test-output.txt（補助 evidence）
- outputs/phase-11/invariant-snapshot.txt（補助 evidence）

## 完了条件

- [ ] NON_VISUAL evidence が 3 種以上ある。
- [ ] screenshot 未取得の理由が明確。

## タスク100%実行確認【必須】

- [ ] placeholder evidence を PASS と扱っていない。

## 次Phase

Phase 12: ドキュメント同期。
