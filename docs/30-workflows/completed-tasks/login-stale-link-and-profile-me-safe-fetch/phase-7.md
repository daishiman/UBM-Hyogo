# Phase 7: カバレッジ確認

## スコープ

[Feedback BEFORE-QUIT-002] に従い、本 PR の変更行のみを対象とする（全体 coverage は別 lane）。

## 対象ファイル / 期待カバレッジ

| ファイル | 期待 | 担当 spec |
|---------|------|----------|
| `apps/web/src/lib/url/safe-redirect.ts` | object fallback branch covered | `login-query.spec.ts`, `login-redirect.spec.ts`, `login-state.spec.ts` |
| `apps/web/src/lib/url/login-query.ts` | unknown/string[] narrowing covered | `login-query.spec.ts` |
| `apps/web/app/(member)/profile/page.tsx` の `/me` 取得分岐 | ok / not ok / AuthRequiredError covered | `page.spec.tsx` |

## 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage \
  apps/web/app/\(member\)/profile/page.spec.tsx \
  apps/web/src/lib/url/login-query.spec.ts \
  apps/web/src/lib/url/login-redirect.spec.ts \
  apps/web/src/lib/url/login-state.spec.ts
```

## drift gate

- 変更行は focused specs で直接踏む。
- 全体 coverage threshold は既存 gate に委譲する。
