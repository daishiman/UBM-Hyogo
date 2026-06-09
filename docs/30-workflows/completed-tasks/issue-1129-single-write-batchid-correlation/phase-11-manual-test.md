# Phase 11: 手動テスト / NON_VISUAL Evidence

## ステータス: completed

## 判定

**PASS — NON_VISUAL / local semantic evidence captured.**

変更は `apps/api` の audit append payload のみで、UI / route / CSS / component / browser-visible copy は変更していない。スクリーンショットは不要で、focused API contract tests と typecheck を主証跡にする。

## 実行結果

| Command | Exit | Result |
| --- | --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | 0 | PASS: 2 files / 31 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | 0 | PASS |

## AC 対応

| AC | Evidence |
| --- | --- |
| AC-1 | Phase 1-3 で request-scoped / 群サイズ 1 を確定 |
| AC-2 | `members.tags.contract.spec.ts` で assign `after_json.batchId` UUID を確認、`audit.contract.spec.ts` で filter hit を確認 |
| AC-3 | `members.tags.contract.spec.ts` で unassign `before_json.batchId` UUID を確認、`audit.contract.spec.ts` で filter hit を確認 |
| AC-4 | `audit.contract.spec.ts` が既存 `GET /admin/audit?batchId=` 経由で after/before OR 検索を確認 |
| AC-5 | assign 再送 / delete noop の audit 件数非増加を確認 |
| AC-6 | assign batchId と unassign batchId が別 UUID で、単一 request scope の群サイズ 1 を確認 |

## 完了条件

- [x] NON_VISUAL の screenshot 不要理由を記録した
- [x] focused Vitest / typecheck の実測結果を記録した
- [x] AC-1..6 の evidence 対応を記録した
