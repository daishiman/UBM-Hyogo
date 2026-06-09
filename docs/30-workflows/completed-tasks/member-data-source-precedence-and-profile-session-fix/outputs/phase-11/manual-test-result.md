# Phase 11 手動テスト結果（member-data-source-precedence-and-profile-session-fix）

## 目的

本ワークフローの主証跡（自動テスト / typecheck / migration verifier）と、VISUAL screenshot を本サイクルで実体化しない理由を記録する。
本ファイルは `workflow_state=implemented_local_runtime_pending` の current facts として、ローカル実装済み範囲の検証結果を記す。

## 分類と証跡戦略

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | VISUAL（Lane D admin field editor のみ。A/B/C/E は NON_VISUAL backend） |
| workflow_state | implemented_local_runtime_pending（apps/packages 実装とローカル検証は完了。commit / PR / D1 適用 / deploy / 認証済み visual capture は user-gated） |
| 主証跡 | 自動テスト（`*.spec.ts(x)`）。NON_VISUAL backend の決定的証跡が主。VISUAL Lane D は screenshot を補助証跡として計画 |
| evidence strategy | tier1 = focused Vitest + D1 contract Vitest + API/web typecheck + D1 migration verifier / tier2 = Playwright screenshot（認証済み runtime user-gated） |

## screenshot を実体化しない理由（VISUAL runtime user-gated）

- 実装コードと UI surface はローカルに存在する。
- ただし canonical PNG は staging deploy + admin/member login + seeded D1/R2 状態が必要で、外部操作を伴う。
- したがって本サイクルの PNG は **0 枚**。`phase11-capture-metadata.json` の各 entry を
  `status: "pending_runtime_visual"` とし、phase12-compliance の Phase 11 evidence existence 検査では
  `Status=pending`（存在検査対象外）として扱う。
- screenshots/ ディレクトリには実 PNG は置かず、ディレクトリ保持用の `.gitkeep` のみを置く（PNG 0 枚の状態を明示）。
- 実撮影は staging deploy + bearer mint を前提に **user-gated**（Phase 13）。

## ローカル検証結果

| 検証 | 結果 |
|------|------|
| D1 migration verifier | `pnpm verify:d1-migrations` PASS（34 migrations / documented duplicate prefix groups 5） |
| API typecheck | `pnpm --filter @ubm-hyogo/api typecheck` PASS |
| Web typecheck | `pnpm --filter @ubm-hyogo/web typecheck` PASS |
| Focused Vitest | mapper / field-precedence / MemberFieldEditor: 3 files / 17 tests PASS（本レビュー追加実行） |
| D1 contract Vitest | `memberFieldOverrides.repository.spec.ts` + `member-fields.contract.spec.ts` + `sync-sheets-to-d1.contract.spec.ts`: 3 files / 18 tests PASS（本レビュー追加実行） |

## 実行済み検証コマンド

```bash
pnpm verify:d1-migrations
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/web typecheck
pnpm exec vitest run apps/api/src/jobs/mappers/sheets-to-members.spec.ts apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts apps/api/src/routes/me/index.contract.spec.ts packages/integrations/google/src/forms/mapper.spec.ts apps/web/app/'(member)'/profile/page.spec.tsx apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx
pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts apps/api/src/routes/me/index.contract.spec.ts
mise exec -- pnpm vitest run --config=vitest.config.ts apps/api/src/use-cases/_shared/field-precedence.spec.ts apps/api/src/jobs/mappers/sheets-to-members.spec.ts
mise exec -- pnpm vitest run --config=vitest.config.ts apps/web/src/components/admin/__tests__/MemberFieldEditor.spec.tsx
mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api/src/repository/memberFieldOverrides.repository.spec.ts apps/api/src/routes/admin/member-fields.contract.spec.ts apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts
```

## 結論

- 主証跡（migration verifier / typecheck / focused Vitest / D1 contract Vitest）はローカル PASS。
- VISUAL screenshot は **0 枚（pending_runtime_visual）**。実体化は staging deploy と認証情報を伴うため user-gated。
