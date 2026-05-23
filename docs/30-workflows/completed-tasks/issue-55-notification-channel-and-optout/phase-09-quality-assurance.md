# Phase 09 — 品質保証

## チェックリスト

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F @ubm-hyogo/api test -- --run
mise exec -- pnpm -F @ubm-hyogo/web test -- --run
bash scripts/verify-pr-ready.sh
```

## 不変条件再確認

| 不変条件 | 確認 |
| --- | --- |
| #5 D1 直接アクセスは `apps/api` 限定 | opt-out 読み書きは `apps/api/src/repository/member.ts` のみ。`apps/web` は API 経由 |
| #8 新規 test は `*.spec.{ts,tsx}` のみ | 追加した spec はすべて `.spec.` |
| #9 admin form は既存 UI primitive / label / aria 経由 | toggle は `MemberDrawer` 内で既存 style と a11y に合わせる |
| #10 admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | `MemberDrawer` UI は同 hook + `apps/web/src/lib/admin/api.ts` helper 経由 |
| Cloudflare CLI は `scripts/cf.sh` 経由 | wrangler 直接実行禁止を遵守 |

## セキュリティ

- admin endpoint は `requireAdmin` を通過していること
- migration により PII が増えるわけではないが、`notification_opt_out` 列の audit 観点は application `audit_log` に残ること

## DoD

- すべてのチェックが green
- `verify-pr-ready.sh` が 0 終了
