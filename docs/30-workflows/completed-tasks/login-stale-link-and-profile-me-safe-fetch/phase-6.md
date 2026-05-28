# Phase 6: テスト拡充

## 目的

Phase 4 の S-1/S-2 を、実装済みコードに合わせて fail path 補強まで広げる。

## 追加ケース

### S-1 拡張（`apps/web/app/(member)/profile/page.spec.tsx`）

| ID | シナリオ | 期待 |
|----|---------|------|
| TC-S1-04 | `/me` 成功 → `/me/profile` で `FetchAuthedError(500)` | 既存通り `SectionError` (`MEMBER_FETCH_*`) |
| TC-S1-05 | `/me` で `FetchAuthedError(503, "down")` | `SectionError` (`MEMBER_SESSION_*`) が表示され throw されない |
| TC-S1-06 | `/me` で `AuthRequiredError` | `/login?redirect=/profile` redirect |

### S-2 拡張（login redirect specs）

| ID | 対象 | 期待 |
|----|------|------|
| TC-S2-01 | `parseLoginQuery({ redirect: object })` | `/profile` fallback |
| TC-S2-02 | `toLoginRedirect(object)` | `/login?redirect=%2Fprofile` |
| TC-S2-03 | `replaceLoginState("sent", object)` | URL に `[object Object]` が出ない |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  apps/web/app/\(member\)/profile/page.spec.tsx \
  apps/web/src/lib/url/login-query.spec.ts \
  apps/web/src/lib/url/login-redirect.spec.ts \
  apps/web/src/lib/url/login-state.spec.ts
```

## DoD

- [x] S-1 / S-2 focused cases are implemented.
- [ ] focused test command is green.
