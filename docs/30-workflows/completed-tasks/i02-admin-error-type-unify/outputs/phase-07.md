# Phase 7: コードレビュー観点

**[実装区分: 実装仕様書]** — コード変更を伴う

## メタ情報

- task slug: `i02-admin-error-type-unify`
- phase: 7 / 13
- レビュー対象 PR: Phase 5 で生成される変更（3 ファイル）

## 目的

`AdminMutationHttpError` 削除 + `AuthRequiredError` / `FetchAuthedError` 統合 PR に対し、
**残存ゼロ・再 export ゼロ・type narrowing 健全性・p-10 redirect logic 互換性** の 4 軸でレビュー観点を網羅し、
self-review および solo 運用での品質ゲートとして機能させる。

## 実行タスク

1. grep gate（旧 class 残存ゼロ確認）
2. 再 export ゼロ確認
3. type narrowing 健全性確認
4. p-10 redirect logic 互換性確認
5. 影響範囲外への意図しない diff チェック

## 参照資料

- `apps/web/src/lib/fetch/authed.ts` — `AuthRequiredError` / `FetchAuthedError` 定義
- p-10 spec（`docs/30-workflows/.../parallel-10-*` 配下に redirect logic spec が存在する場合）
- 元 spec「DoD」「リスク」セクション

## 実行手順

### Step 1: grep gate — `AdminMutationHttpError` 残存ゼロ

```bash
rg "AdminMutationHttpError" apps/web/src
rg "AdminMutationHttpError" apps/web
rg "AdminMutationHttpError" .
```

期待:
- `apps/web/src` 配下 0 hit
- `apps/web` 配下 0 hit（README / CHANGELOG 等も含む）
- リポジトリ全体での hit は本 spec.md / outputs/ / `docs/30-workflows/i02-*` 配下のドキュメントのみ許可

ドキュメント以外のソースコード（`.ts` / `.tsx` / `.js`）で 1 hit でも残っていれば**レビュー差し戻し**。

### Step 2: 再 export ゼロ確認

```bash
rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/index.ts
rg "export.*AdminMutationHttpError" apps/web/src
```

期待: 両者 0 hit。`@deprecated` 経由の alias re-export も**残さない**（元 spec「設計 3. 破壊回避」で完全削除採用と決定済み）。

### Step 3: type narrowing 健全性確認

`useAdminMutation.ts` の error 分岐が以下構造で正しく narrow されていることを目視 + tsc で確認:

```ts
if (e instanceof AuthRequiredError) {
  // ここで e は AuthRequiredError 型に narrow されている
}
if (e instanceof FetchAuthedError && e.status === 403) {
  // ここで e は FetchAuthedError 型に narrow され、e.status は number
}
```

確認コマンド:

```bash
mise exec -- pnpm typecheck
```

`@ts-expect-error` / `@ts-ignore` / `as any` を新規追加していないことを `git diff` で確認:

```bash
git diff apps/web/src/features/admin/hooks/useAdminMutation.ts | rg "ts-(expect-error|ignore)|as any"
```

期待: 0 hit。

### Step 4: p-10 redirect logic 互換性確認

p-10（`AuthRequiredError` → `/login?redirect=...` redirect）の handler が `AuthRequiredError` を catch する経路を grep で確認:

```bash
rg "AuthRequiredError" apps/web/src
```

期待: 以下 3 系統で hit する:
1. `apps/web/src/lib/fetch/authed.ts` — class 定義
2. `apps/web/src/features/admin/hooks/useAdminMutation.ts` — 本 PR で追加した throw / instanceof
3. p-10 redirect handler（存在する場合）— catch 側

p-10 redirect helper は既存 `toLoginRedirect` を使う。本タスクの DoD は optional `redirector` / `currentPath` DI で
401 → `/login?redirect=...` を unit test することで満たす。

### Step 5: 影響範囲外への意図しない diff チェック

```bash
git diff dev...HEAD --name-only
```

期待: 以下 3 ファイル + docs のみ:
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- `apps/web/src/features/admin/hooks/index.ts`
- `docs/30-workflows/i02-admin-error-type-unify/**`

他 features / lib / api への diff が混入していれば**スコープ違反**として差し戻し。

## 統合テスト連携

- p-10 redirect logic との結合は Phase 6 Step 4 の int test で担保（実装済みの場合）
- 未実装の場合は Phase 7 残課題に記載し、p-10 完了 PR で追加する

## 多角的チェック観点（AIが判断）

| # | 観点 | 確認方法 |
|---|------|---------|
| 1 | `AdminMutationHttpError` のソース残存ゼロ | `rg "AdminMutationHttpError" apps/web/src` 0 hit |
| 2 | `hooks/index.ts` での再 export 削除 | `rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/index.ts` 0 hit |
| 3 | `@deprecated` alias を残していない | 同上 grep で 0 hit（元 spec の判断と整合） |
| 4 | type narrowing 健全性 | typecheck PASS + `as any` / `ts-ignore` 新規ゼロ |
| 5 | p-10 redirect logic との互換性 | `AuthRequiredError` の catch 経路が p-10 で確立されている（または TODO 記載） |
| 6 | スコープ外 diff なし | `git diff dev...HEAD --name-only` が 3 ソース + docs のみ |
| 7 | `authed.ts` の class signature 不変 | `git diff apps/web/src/lib/fetch/authed.ts` が空 |
| 8 | API endpoint 側変更なし | `git diff apps/api/` が空 |

## サブタスク管理

- [ ] Step 1: grep gate 残存ゼロ
- [ ] Step 2: 再 export ゼロ
- [ ] Step 3: type narrowing 健全性
- [ ] Step 4: p-10 互換性確認
- [ ] Step 5: スコープ外 diff チェック

## 成果物

- レビュー観点チェックリスト（本 phase 文書）
- 残課題リスト（p-10 redirect handler 未実装時の int test TODO）

## 完了条件

- 上記 8 観点すべて確認済み
- `rg "AdminMutationHttpError" apps/web/src` 0 hit
- `git diff dev...HEAD --name-only` がスコープ内ファイルのみ
- typecheck で `as any` / `ts-ignore` 新規ゼロ

## タスク100%実行確認【必須】

- [ ] 上記 5 サブタスクすべて完了
- [ ] 8 観点 self-review 完了
- [ ] 残課題があれば PR description に明記

## 次Phase

Phase 8: 統合テスト / E2E（admin mutation 401 → redirect の end-to-end 確認、p-10 連携時のみ）
