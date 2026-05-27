# Phase 13 — PR Gate

## Status

`pending_user_approval` — commit / push / PR は user 明示承認後に実行。

## Pre-flight commands

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## PR body checklist

- [ ] Phase 11 evidence 参照（screenshots + 200 trace）
- [ ] AC-1..AC-9 達成状況
- [ ] 親 workflow `admin-ui-prototype-alignment` followup-001 と明記
- [ ] PR base = `dev`
