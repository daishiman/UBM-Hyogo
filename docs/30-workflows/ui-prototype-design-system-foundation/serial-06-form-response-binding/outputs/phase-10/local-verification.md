# Phase 10 — Local Verification

## 実行コマンドと結果

### typecheck

```
$ mise exec -- pnpm --filter @ubm-hyogo/web typecheck
> @ubm-hyogo/web@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit
(exit 0)
```

### lint

```
$ mise exec -- pnpm --filter @ubm-hyogo/web lint
> @ubm-hyogo/web@0.1.0 lint
> tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'
(exit 0)
```

### adapter unit spec

```
$ mise exec -- pnpm vitest run --root=. --config=vitest.config.ts \
    apps/web/src/lib/adapters/__tests__/member-detail.spec.ts

 ✓ apps/web/src/lib/adapters/__tests__/member-detail.spec.ts (8 tests) 9ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  6.60s
```

## 実コード反映確認

```
$ git status --short | grep apps/web
 M apps/web/app/(public)/members/[id]/page.tsx
?? apps/web/src/components/public/MemberDetail.tsx
?? apps/web/src/fixtures/public-member-profile.ts
?? apps/web/src/lib/adapters/member-detail.ts
?? apps/web/src/lib/adapters/__tests__/member-detail.spec.ts
```

実コード（`apps/web/`）に変更が反映されていることを確認 (CONST_005 遵守)。
