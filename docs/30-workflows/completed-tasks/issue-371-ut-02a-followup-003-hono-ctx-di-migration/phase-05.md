# Phase 5: 実装ランブック（漸進移行）

実装区分: 実装仕様書

## 5.1 移行戦略

「middleware 先行 → builder 切替 → call site 撤去 → silent fallback throw 化 → テスト改修」の順で**1 PR 内で漸進**実施する。
順序を守ることで、途中段階でも `pnpm test` が常に GREEN を保てる。

## 5.2 ステップ

### Step 1: 型定義の追加（変更なし状態）

```bash
# 新規 middleware ファイルの作成（中身はまだ未結線）
touch apps/api/src/middleware/repository-providers.ts
touch apps/api/src/middleware/repository-providers.test.ts
```

ファイル内容: Phase 2.3 のシグネチャ（`RepositoryProviderVariables` / `attendanceProviderMiddleware`）を実装。

検証:
```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers
```

### Step 2: middleware の route 結線

- `apps/api/src/routes/me/index.ts`
  - `Variables` 型に `& RepositoryProviderVariables` を合成
  - `app.use("*", attendanceProviderMiddleware)` を session-guard middleware の後段に追加
- `apps/api/src/routes/admin/members.ts`
  - 同上（admin gate middleware の後段）

この時点で **builder の `deps?` はまだ残っており、call site の `{ attendanceProvider: ... }` も残っている**ため、動作は等価。

検証: `pnpm --filter @ubm-hyogo/api test` 全 GREEN を確認。

### Step 3: builder 側で ctx 解決を追加（後方互換ありで）

`apps/api/src/repository/_shared/builder.ts`:

```ts
// 移行期の互換コード
const provider = deps?.attendanceProvider ?? c.var.attendanceProvider;
```

検証: `pnpm test` GREEN。

### Step 4: call site から `{ attendanceProvider: ... }` を削除

- `apps/api/src/routes/me/index.ts:77-79`
- `apps/api/src/routes/admin/members.ts:305-307`

検証: `pnpm test` GREEN。

### Step 5: `deps?` 引数の削除と `fetchAttendanceFor` の throw 化

- `buildMemberProfile` / `buildAdminMemberDetailView` のシグネチャから `deps?` を削除
- `fetchAttendanceFor` で `if (!provider) throw new Error(...)` に変更
- 既存 `DbCtx` は変更せず、`RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を attendance builder 用に追加
- route では `c.get("ctx")` で得た `DbCtx` に `var.attendanceProvider` を合成して builder へ渡す

検証:
```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck  # call site の型エラーがないことを確認
mise exec -- pnpm --filter @ubm-hyogo/api test
```

### Step 6: テスト改修（mock 注入経路統一）

- `apps/api/src/repository/_shared/builder.test.ts` / `apps/api/src/repository/__tests__/builder.test.ts`
- mock helper を「ctx に直接 `var.attendanceProvider` を set」する形に統一
- T5 / T8（provider 未注入時 throw）テストを追加

検証: `pnpm test` 全 GREEN。

### Step 7: ADR / Phase 11 evidence の作成

- `outputs/phase-03/adr-di-strategy.md`
- `outputs/phase-11/evidence/` 配下に builder smoke / middleware smoke / route smoke の log を配置

## 5.3 grep gate（漸進移行確認）

各 step 完了時に以下を実行し、想定外の残存を検出:

```bash
# Step 5 後: deps 引数が残っていないこと
rg -n "deps\\?\\s*:\\s*\\{\\s*attendanceProvider" apps/api/src/repository/_shared/builder.ts
# 期待: マッチなし

# Step 4 後: call site に attendanceProvider: 残存なし
rg -n "attendanceProvider:" apps/api/src/routes/
# 期待: マッチなし
```

## 5.4 ロールバック

各 step は独立コミット推奨。問題発生時は該当コミットを `git revert` する。
特に Step 5（throw 化）後に既存テストで silent fallback 依存があった場合、
該当テストを Step 6 で修正するか、provider mock を補完する。

## 5.5 実行コマンドまとめ

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api build
```

## 5.6 DoD（Definition of Done）

- [ ] Step 1〜7 全完了
- [ ] AC-1〜AC-9 を満たす
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 全通過
- [ ] grep gate（5.3）全 PASS
- [ ] ADR `outputs/phase-03/adr-di-strategy.md` 作成済み
- [ ] Phase 11 evidence 配置済み
- [ ] Phase 12 strict 7 files 揃え
