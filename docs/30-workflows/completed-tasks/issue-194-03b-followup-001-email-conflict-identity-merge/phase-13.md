# Phase 13: PR 作成 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

approval gate / local-check-result / change-summary / PR template を確定する。
PR 作成自体は user 明示 GO 後にのみ実行する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 13 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |
| 上流 | 03b / 04c / 02a |
| 下流 | 04c admin E2E / 公開ディレクトリ重複解消 smoke |

## 目的

PR タイトル / 本文 template / Refs #194 / 必要 evidence 一覧を確定し、user gate 通過後に PR を作成する。

## 実行タスク

1. user 明示 GO の確認（Phase 10 GO + Phase 11 evidence + Phase 12 strict 7 揃い）
2. local-check-result の placeholder を実測値で埋める
3. `change-summary.md` / `pr-info.md` を作成
4. `gh pr create` で PR 作成し `pr-creation-result.md` に URL 記録

## 参照資料

- `phase-05.md` / `phase-10.md` / `phase-11.md` / `phase-12.md`
- `.claude/commands/ai/diff-to-pr.md`

## approval gate

- user 明示 GO がない限り commit / push / PR 作成を行わない
- Phase 10 の GO/NO-GO が GO であること
- Phase 11 manual evidence が `outputs/phase-11/` に揃っていること（VISUAL_ON_EXECUTION）
- Phase 12 strict 7 files が `outputs/phase-12/` に揃っていること

## local-check-result（実測 placeholder）

- `mise exec -- pnpm typecheck` PASS
- `mise exec -- pnpm lint` PASS
- `mise exec -- pnpm --filter @repo/api test` PASS
- `mise exec -- pnpm --filter @repo/web test` PASS
- 必要 evidence 一覧と curl matrix exit code を `outputs/phase-13/local-check-result.md` に記録

## change-summary（実測ベース）

- 追加: `apps/api/migrations/0010_identity_merge_audit.sql`、`0011_identity_aliases.sql`、`0012_identity_conflict_dismissals.sql`
- 追加: `apps/api/src/repository/identity-conflict.ts`、`identity-merge.ts` + `__tests__/`
- 追加: `apps/api/src/routes/admin/identity-conflicts.ts`
- 追加: `apps/api/src/services/admin/identity-conflict-detector.ts` + test
- 追加: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`、`apps/web/src/components/admin/IdentityConflictRow.tsx`
- 追加: `packages/shared/src/schemas/identity-conflict.ts`
- 変更: `apps/api/src/index.ts`（`createAdminIdentityConflictsRoute` mount）
- 変更: `apps/api/src/repository/__tests__/_setup.ts`、`packages/shared/src/schemas/index.ts`
- ドキュメント: 11-admin-management.md / 01-api-schema.md / 08-free-database.md / runbook 追記

## PR template

```markdown
## Summary
- 03b で残った EMAIL_CONFLICT を admin 手動 merge で解消する経路を追加
- /admin/identity-conflicts に候補一覧 / 二段階確認 / dismiss UI を実装
- POST /admin/identity-conflicts/:id/merge は D1 transactional batch で identity_aliases と audit ledger を atomic に記録
- identity_merge_audit / identity_aliases / identity_conflict_dismissals DDL を追加し audit_log と二重記録

Refs #194

## Test plan
- [ ] unit (identity-conflict-detector / maskResponseEmail)
- [ ] integration (identity-merge transaction / dismiss UNIQUE)
- [ ] contract (/admin/identity-conflicts response shape)
- [ ] authorization (admin / non-admin)
- [ ] manual smoke + screenshot（PII マスク確認）
```

## 必要 evidence 一覧

| evidence | path |
| --- | --- |
| typecheck / lint / test 結果 | `outputs/phase-13/local-check-result.md` |
| change-summary | `outputs/phase-13/change-summary.md` |
| pr-info | `outputs/phase-13/pr-info.md` |
| pr-creation-result | `outputs/phase-13/pr-creation-result.md` |
| Phase 11 evidence | `outputs/phase-11/*.png`、`curl-results.md`、`wrangler-tail.log` |
| Phase 12 strict 7 | `outputs/phase-12/*.md` |

## サブタスク管理

- [ ] user 明示 GO 確認
- [ ] local-check-result.md 実測値記入
- [ ] change-summary.md / pr-info.md 作成
- [ ] `gh pr create` 実行と URL 記録

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`

## 完了条件

- approval gate が GO
- local-check-result の全項目 PASS
- PR が作成され URL が記録される

## タスク100%実行確認

- [ ] approval gate 遵守
- [ ] PR template に Refs #194 を含む
- [ ] commit / push / PR は user GO 後にのみ実行

## 次 Phase への引き渡し

次タスクへ、PR URL、evidence path、merge 後 follow-up（03b-followup-006 連携）を渡す。
