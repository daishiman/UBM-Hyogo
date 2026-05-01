# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 種別 | NON_VISUAL |

## 目的

`admin_member_notes` read repository の回帰を防ぐテスト戦略を定義する。

## 実行タスク

1. repository unit test のケースを定義する。
2. view model 非混入 test のケースを定義する。
3. 04c consumer 側に残す route contract test を分離する。
4. D1 fixture の seed 方針を決める。
5. mutation route を扱う場合は `requireAdmin` と `audit_log.append` の route contract を別枠で定義する。

## 参照資料

- `apps/api/src/repository/__tests__/adminNotes.test.ts`
- `apps/api/src/repository/__tests__/builder.test.ts`
- `apps/api/src/routes/me/index.test.ts`
- `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/phase-04.md`

## 実行手順

1. 正常系: 対象 member の notes だけを返す。
2. 空配列: 対象 member に notes がない場合は `[]`。
3. 分離: 別 member の note が混入しない。
4. ソート: `created_at DESC` の順序を確認する。
5. 非混入: `PublicMemberProfile` / `MemberProfile` に `adminNotes` key が存在しないことを型または JSON assertion で確認する。
6. route contract: `POST/PATCH /admin/members/:memberId/notes` は admin 認可なしで失敗し、成功時は audit append される。

## 統合テスト連携

候補コマンド:

```bash
pnpm --filter ./apps/api test -- adminNotes
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/repository/__tests__/adminNotes.test.ts
```

## 多角的チェック観点（AIが判断）

- read-only task で write path を過剰に要求しない。
- 現行 `adminNotes.ts` が CRUD を持つ場合でも、Issue #106 の必須検証は read path と非混入。
- fixture は production 仕様へ昇格しない。
- audit_log と admin_member_notes を同じ表示 field として検証しない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P4-1 | unit cases | 正常/空/分離/ソートが定義済み |
| P4-2 | invariant cases | #11/#12 の検証が定義済み |
| P4-3 | command matrix | 実行コマンドが定義済み |

## 成果物

- test matrix
- fixture plan
- route test handoff note

## 完了条件

- [ ] AC-4 / AC-5 / AC-6 / AC-8 に対応するテストがある。
- [ ] public/member view model への混入防止が検証可能。

## タスク100%実行確認【必須】

- [ ] Phase 5 実装ランブックに渡すテスト順序が明確。

## 次Phase

Phase 5: 実装ランブック。
