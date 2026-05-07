# Phase 6: コードレビュー観点

実装区分: 実装仕様書

## 6.1 必須レビュー項目

| # | 観点 | 確認方法 |
| --- | --- | --- |
| R1 | builder の `deps?` 引数が完全削除されている | `rg "deps\\?\\s*:" apps/api/src/repository/_shared/builder.ts` → マッチなし |
| R2 | builder の `c` 第1引数の型 (`DbCtx`) が `var.attendanceProvider` を要求している | builder.ts の型定義を目視 |
| R3 | `fetchAttendanceFor` で provider undefined → throw（旧 `[]` fallback 削除） | builder.ts L40-50 周辺を目視 |
| R4 | middleware の結線順序が auth 系 middleware の **後段** | `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts` の `app.use` 順序を目視 |
| R5 | `RepositoryProviderVariables` が export され、各 route で `Variables` 交差型に合成されている | route ファイル冒頭の `new Hono<{ ... Variables: ... & RepositoryProviderVariables }>()` を目視 |
| R6 | call site から `{ attendanceProvider: ... }` 引数が完全削除 | `rg "attendanceProvider:" apps/api/src/routes/` → マッチなし |
| R7 | 新規 middleware の単体テスト（T1, T2）が存在 | `apps/api/src/middleware/repository-providers.test.ts` を目視 |
| R8 | provider 未注入時 throw のテスト（T5, T8）が存在 | builder.test.ts / __tests__/builder.test.ts を目視 |
| R9 | `MemberProfile` / `AdminMemberDetailView` interface の構造変更がない | `git diff main -- apps/api/src/repository/_shared/builder.ts` で型 export の差分を確認 |
| R10 | D1 schema 変更がない | `git diff main -- apps/api/migrations/` で空であること |
| R11 | ADR `outputs/phase-03/adr-di-strategy.md` が 6 項目（Date / Status / Context / Decision / Alternatives / Consequences）を満たす | ファイル目視 |
| R12 | public profile builder（`buildPublicMemberProfile`）に変更が及んでいない（attendance を含まないため scope out） | `git diff` で当該関数に差分なし確認 |

## 6.2 アンチパターン検出

| アンチパターン | 検出方法 |
| --- | --- |
| call site で `c.set("attendanceProvider", ...)` を route handler 内で個別実施（middleware を介さない） | `rg "c.set\\(\"attendanceProvider\"" apps/api/src/routes/` → マッチなし |
| builder 内で `createAttendanceProvider` を直接 import | `rg "createAttendanceProvider" apps/api/src/repository/_shared/builder.ts` → マッチなし |
| silent fallback の復活（`?? []` 等） | `rg "attendanceProvider.*\\?\\?\\s*\\[\\]" apps/api/src/` → マッチなし |
| provider 取得の二重経路（`deps?` と `c.var` の併存） | builder.ts に `??` 演算子による両対応コードが残っていないこと |

## 6.3 自己レビュー手順

実装者は PR 作成前に以下を実行する:

```bash
# ファイルを git diff で目視
git diff main -- apps/api/src/repository/_shared/builder.ts
git diff main -- apps/api/src/routes/me/index.ts
git diff main -- apps/api/src/routes/admin/members.ts
git diff main -- apps/api/src/middleware/repository-providers.ts

# grep gate
rg -n "deps\\?\\s*:\\s*\\{\\s*attendanceProvider" apps/api/src/repository/_shared/builder.ts || echo "OK: no deps"
rg -n "attendanceProvider:" apps/api/src/routes/ || echo "OK: no inline attendanceProvider"
rg -n "createAttendanceProvider" apps/api/src/repository/_shared/builder.ts || echo "OK: no direct import in builder"
```

## 6.4 完了条件

- R1〜R12 全 PASS
- 6.2 アンチパターン全 negative
- 6.3 自己レビュー実施済み
