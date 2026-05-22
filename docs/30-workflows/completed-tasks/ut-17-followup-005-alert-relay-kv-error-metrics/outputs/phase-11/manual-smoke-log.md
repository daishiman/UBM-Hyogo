# Manual Smoke Log

本タスクは local NON_VISUAL evidence で完了する。production Workers Logs tail は
deploy 後の user-gated operation のため、この Phase 11 では未実行。

代替 smoke:
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
- `outputs/phase-11/evidence/test.log`
