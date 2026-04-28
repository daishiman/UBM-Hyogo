# 手動 smoke テスト エビデンス

## vitest テスト実行結果（2026-04-27）

staging D1 環境への接続不可のため、vitest 結果を evidence として記録。

```
Test Files  19 passed (19)
     Tests  201 passed (201)
  Start at  15:17:19
  Duration  7.69s
```

## 新規追加テスト（02a タスク分）

```
✓ apps/api/src/repository/__tests__/brand.test.ts (8 tests)
✓ apps/api/src/repository/__tests__/members.test.ts (5 tests)
✓ apps/api/src/repository/__tests__/identities.test.ts (5 tests)
✓ apps/api/src/repository/__tests__/status.test.ts (6 tests)
✓ apps/api/src/repository/__tests__/responses.test.ts (7 tests)
✓ apps/api/src/repository/__tests__/responseSections.test.ts (3 tests)
✓ apps/api/src/repository/__tests__/responseFields.test.ts (3 tests)
✓ apps/api/src/repository/__tests__/fieldVisibility.test.ts (5 tests)
✓ apps/api/src/repository/__tests__/memberTags.test.ts (5 tests)
✓ apps/api/src/repository/__tests__/builder.test.ts (14 tests)
```

## 型チェック結果

```
packages/shared typecheck: Done
packages/integrations typecheck: Done
packages/integrations/google typecheck: Done
apps/web typecheck: Done
apps/api typecheck: Done
```

全パッケージでエラーなし。
