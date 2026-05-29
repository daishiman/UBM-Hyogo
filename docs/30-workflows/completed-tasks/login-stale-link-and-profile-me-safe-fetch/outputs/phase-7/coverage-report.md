# Phase 7 成果物: カバレッジレポート

詳細は [../../phase-7.md](../../phase-7.md) を参照。

## 期待

| ファイル | 期待 |
|---------|------|
| `apps/web/src/lib/url/safe-redirect.ts` | object fallback branch covered |
| `apps/web/src/lib/url/login-query.ts` | unknown/string[] narrowing covered |
| `apps/web/app/(member)/profile/page.tsx` `/me` 分岐 | ok / not ok / AuthRequiredError covered |

実値は focused test 実行後の console output を Phase 11 evidence として扱う。
