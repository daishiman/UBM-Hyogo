# Phase 4: テスト戦略

実装区分: 実装仕様書

## 4.1 test matrix

| # | テスト | 対象ファイル | 種別 | AC ref |
| --- | --- | --- | --- | --- |
| T1 | `attendanceProviderMiddleware` 正常系: `c.var.attendanceProvider` が set される | `apps/api/src/middleware/repository-providers.test.ts` | 単体 | AC-3 |
| T2 | `attendanceProviderMiddleware` 経由後の `findByMemberIds` が D1 binding に届く（fakeD1 で確認） | 同上 | 単体 | AC-3 |
| T3 | `buildMemberProfile(c, mid)` の引数が 2 個に縮小されたこと（typecheck で第3引数指定が型エラー） | `apps/api/src/repository/_shared/builder.test.ts` | 型 | AC-1 |
| T4 | `buildMemberProfile` が `c.var.attendanceProvider` を解決して結果を返す | 同上 | 単体 | AC-2 |
| T5 | provider 未注入時 `buildMemberProfile` が **throw**（旧 `[]` fallback ではない） | 同上 | 単体 | AC-5 |
| T6 | `buildAdminMemberDetailView(c, mid, adminNotes)` の引数が 3 個に縮小（第4引数 `deps` が型エラー） | `apps/api/src/repository/__tests__/builder.test.ts` | 型 | AC-1 |
| T7 | `buildAdminMemberDetailView` ctx 解決動作 | 同上 | 単体 | AC-2 |
| T8 | `buildAdminMemberDetailView` provider 未注入時 throw | 同上 | 単体 | AC-5 |
| T9 | `apps/api/src/routes/me` smoke: middleware 結線済 → `GET /me/profile` 200 で `attendance` が返る | `apps/api/src/routes/me/__tests__/index.test.ts`（既存があれば） | route | AC-6, AC-7 |
| T10 | `apps/api/src/routes/admin/members` smoke: `GET /admin/members/:mid` 200 で `attendance` が返る | `apps/api/src/routes/admin/members.test.ts`（既存） | route | AC-6, AC-7 |
| T11 | grep gate: `apps/api/src/repository/_shared/builder.ts` に `deps` 出現なし | CI / Phase 9 | 静的 | AC-1 |
| T12 | grep gate: route ファイルに `attendanceProvider:` リテラル出現なし（call site 撤去確認） | CI / Phase 9 | 静的 | AC-6 |
| T13 | typecheck / lint / build 全通過 | CI | 自動 | AC-8 |
| T14 | 既存 read path テスト regression なし（`pnpm --filter @ubm-hyogo/api test`） | CI | 自動 | AC-7 |

## 4.2 mock 注入経路の統一パターン

```ts
// builder unit test での provider mock（ctx 直接 set）
const ctx = createMockHonoContext({
  db: fakeD1,
  var: { attendanceProvider: mockAttendanceProvider },
});
const profile = await buildMemberProfile(ctx, asMemberId("M001"));
```

```ts
// route test での provider mock（test fixture middleware）
app.use("*", async (c, next) => {
  c.set("attendanceProvider", mockAttendanceProvider);
  await next();
});
```

## 4.3 provider 未注入時 throw の検証

```ts
const ctxWithoutProvider = createMockHonoContext({
  db: fakeD1,
  var: {} as never,  // attendanceProvider 未 set
});
await expect(buildMemberProfile(ctxWithoutProvider, mid))
  .rejects
  .toThrow(/attendanceProvider not bound/i);
```

## 4.4 AC × test mapping

| AC | tests |
| --- | --- |
| AC-1 | T3, T6, T11 |
| AC-2 | T4, T7 |
| AC-3 | T1, T2 |
| AC-4 | T3, T6 (型として現れる) |
| AC-5 | T5, T8 |
| AC-6 | T9, T10, T12 |
| AC-7 | T9, T10, T14 |
| AC-8 | T13 |
| AC-9 | Phase 3 ADR |
| AC-10 | Phase 11 `test.log` に T1-T10 pass summary、`grep-gate.log` に T11-T12、typecheck/lint/build logs |
| AC-11 | Phase 12 strict 7 files |

## 4.5 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api build
```

期待: 全 PASS、新規テスト T1〜T8 が追加されている、既存テストの regression なし
