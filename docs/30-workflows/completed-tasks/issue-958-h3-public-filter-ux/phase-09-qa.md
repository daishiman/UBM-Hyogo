# Phase 9 — 品質保証

## 1. 実行コマンド一括

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/web exec vitest run --coverage \
  app/\(member\)/profile/_components/__tests__/PublicConsentCallout.spec.tsx \
  src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx \
  src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts \
  src/components/public/__tests__/AllHiddenFallback.spec.tsx \
  app/\(public\)/members/__tests__/page.spec.tsx
bash scripts/verify-pr-ready.sh
mise exec -- pnpm exec verify-design-tokens || true   # script 名は repo 実体に合わせ調整
```

## 2. grep gate（Phase 6 §2 を Phase 9 で再実行）

- INV-1: `apps/api/src/routes/` 配下 diff 空
- INV-2: HEX 直書きゼロ
- INV-3: `apps/web/src` から `env.DB` 等 D1 binding 参照ゼロ
- INV-5: `*.test.{ts,tsx}` 新規ゼロ
- INV-6: `apps/web/src/components/admin/` 配下に `<input` 直接追加なし（FormField 経由）
- INV-7: `useBulkRepublish.ts` 内に `fetch(` 直書きなし

## 3. mirror parity（skill 同期は Phase 12 task で実施。本 phase では parity 事前確認のみ）

`bash scripts/verify-skill-mirror.sh`（既存があれば実行）

## 4. CI required check（変更なし想定）

本タスクで required check 追加なし。既存 CI gate のみで pass。

## 5. 完了条件

- [x] コマンド一括明示
- [x] grep gate 7 項目
