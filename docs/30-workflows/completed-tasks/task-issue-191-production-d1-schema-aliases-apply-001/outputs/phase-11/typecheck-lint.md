# Typecheck / Lint (EV-11-3)

実行日時: 2026-05-02

## typecheck
```
$ mise exec -- pnpm typecheck
> ubm-hyogo@0.1.0 typecheck
> pnpm -r typecheck

Scope: 5 of 6 workspace projects
packages/shared typecheck:                Done
packages/integrations typecheck:          Done
packages/integrations/google typecheck:   Done
apps/web typecheck:                       Done
apps/api typecheck:                       Done
```
→ ✅ exit 0 / PASS

## lint
```
$ mise exec -- pnpm lint
... (string-literal warnings: pre-existing, not introduced by this task)
packages/shared lint:                Done
packages/integrations lint:          Done
packages/integrations/google lint:   Done
apps/web lint:                       Done
apps/api lint:                       Done
EXIT=0
```
→ ✅ exit 0 / PASS

警告は既存の string-literal lint rule に対する既知 hit（`apps/api/src/view-models/public/...`、`packages/shared/src/utils/consent.ts`、`apps/web/src/components/public/...`）であり、本タスク（仕様書のみ）では新規導入していない。
