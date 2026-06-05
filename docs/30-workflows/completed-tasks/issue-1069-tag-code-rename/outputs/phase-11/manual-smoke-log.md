# manual-smoke-log

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1069-tag-code-rename` |
| evidence type | local deterministic smoke |
| status | PASS |

## 目的

Phase 11 NON_VISUAL evidence として、実行した local コマンドと結果を記録する。

## 実行タスク

- focused D1 Vitest を実行した。
- API typecheck を実行した。
- repo lint を実行した。
- `verify:static-manifest` を実行した。初回は正本 spec hash drift で失敗し、`regenerate:static-manifest` 後に PASS した。

## 参照資料

- `manual-test-result.md`
- `apps/api/src/repository/_shared/generated/static-manifest.json`

## 成果物

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts apps/api/src/routes/admin/tags.contract.spec.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | PASS: 4 files / 37 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `mise exec -- pnpm verify:static-manifest` | PASS after `mise exec -- pnpm regenerate:static-manifest` |

## 統合テスト連携

D1 config を使い、repository/route/audit/member_tags regression を同一 run で確認した。

## 完了条件

- [x] focused test PASS を記録した
- [x] typecheck PASS を記録した
- [x] lint PASS を記録した
- [x] static manifest PASS を記録した
