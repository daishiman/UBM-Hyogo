# Phase 8: 単体・統合テスト実行

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 \
  | tee outputs/phase-11/evidence/test.log
```

## 期待結果

- `apps/api/src/repository/__tests__/builder.test.ts` の throw assertion 2 ケース（line 192 / 301）が PASS
- `apps/api/src/middleware/repository-providers.test.ts` の middleware 結線テストが PASS
- 全 suite で fail 0、skip 0 が望ましい（skip がある場合は親タスクから継承された既存 skip のみ許容し、本タスク起因の skip 追加禁止）

## 検証

```bash
grep -E "Tests:|attendanceProvider not bound" outputs/phase-11/evidence/test.log
```

期待出力例:

```
✓ buildMemberProfile rejects when attendanceProvider not bound to context
✓ buildAdminMemberDetailView rejects when attendanceProvider not bound to context
Tests:  XX passed, XX total
```

## 完了条件

- `test.log` に上記 2 throw assertion の PASS 行が含まれる（AC-4 evidence）
- `Tests:` summary が fail 0
