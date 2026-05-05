# Runbook

## Verify

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/repository/attendance.test.ts
```

## Expected

- first POST: `201 { ok: true, attendance }`
- duplicate POST: `409 { ok: false, error: "attendance_already_recorded", existing }`
- deleted member POST: `422`
- missing session/member: `404`
- candidates: excludes deleted and already-attending members
- DELETE existing: `200` + audit
- DELETE missing: `404`
