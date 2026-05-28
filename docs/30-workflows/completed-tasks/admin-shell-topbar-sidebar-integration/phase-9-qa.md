# Phase 9: QA

## 実行コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

## 各 gate の確認観点

- **typecheck**: 新規 props 型 / `isActive` シグネチャ整合
- **lint**: client/server 境界違反検出 (`'use client'` 必要な component で `next/headers` 等を呼ばない)
- **verify-design-tokens**: HEX 直書き 0 件確認
- **verify-pr-ready.sh**: gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift 一括チェック
- **build**: OpenNext Workers 互換 bundle (webpack mode) で fail しない

## grep gate 手動確認

```bash
grep -F '管理' apps/web/app/\(admin\)/layout.tsx  # 0 件期待 (AC-1)
grep -rn '<Breadcrumb' apps/web/app/\(admin\)/admin/  # 本 task では現行把握のみ。撤去は Task C gate
```
