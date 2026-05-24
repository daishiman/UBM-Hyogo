# Phase 6 — テスト実行記録

## adapter unit spec (vitest)

```
$ pnpm vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts
 ✓ apps/web/src/lib/adapters/__tests__/member-detail.spec.ts (8 tests) 9ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

| # | ケース | 結果 |
|---|--------|------|
| 1 | fixture は PublicMemberProfileZ.parse を通過 | ✅ |
| 2 | happy path: summary/attendance/tags 伝播 | ✅ |
| 3 | visibility=member field 除外 | ✅ |
| 4 | visibility=admin section 丸ごと除外 | ✅ |
| 5 | unknown kind silent skip | ✅ |
| 6 | 入力 mutate しない | ✅ |
| 7 | publicSections 空 → sections === [] | ✅ |
| 8 | sanitize（visibility / source キーなし） | ✅ |

## Playwright spec

本サイクル内で `apps/web/playwright/tests/serial-06-member-detail.spec.ts` を追加し、API-backed member detail の DOM assertion と `outputs/phase-11/screenshots/public-member-detail.png` の取得を完了した。production-equivalent 19-route visual regression は引き続き `serial-07-regression-evidence` に委譲する。

既存 `apps/web/playwright/tests/public-detail-register-legal.spec.ts` の `data-component="profile-hero"` / `[data-section]` / `[data-stable-key]` assertion は本実装の DOM contract を維持する。

## test suffix 検証

- 追加された test file: `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
- suffix: `*.spec.ts` (CLAUDE.md 不変条件 #8 / lefthook `block-test-suffix` 適合)
