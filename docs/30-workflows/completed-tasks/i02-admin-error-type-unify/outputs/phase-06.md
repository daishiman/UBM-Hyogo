# Phase 6: ローカル検証

**[実装区分: 実装仕様書]** — コード変更を伴う

## メタ情報

- task slug: `i02-admin-error-type-unify`
- phase: 6 / 13
- 検証対象: Phase 5 で書き換えた `useAdminMutation.ts` / `useAdminMutation.spec.ts` / `hooks/index.ts`

## 目的

Phase 5 の実装結果に対し、**型・lint・focused test・coverage gate** をローカルで通過させ、CI に投入可能な状態にする。
回帰が無いこと（p-10 redirect logic、`authed.spec.ts`、admin features 他テスト）を担保する。

## 実行タスク

1. typecheck の通過確認
2. lint の通過確認
3. focused test（`useAdminMutation` / `authed`）の Green 確認
4. apps/web 全体 test の回帰チェック
5. `coverage-guard.sh` で coverage gate を通過

## 参照資料

- `scripts/coverage-guard.sh` — coverage 80% gate の正本
- `apps/web/vitest.config.ts` — coverage 設定
- CLAUDE.md「sync-merge 時 hook 挙動」セクション — `--changed` モードの挙動

## 実行手順

### Step 1: typecheck

```bash
mise exec -- pnpm typecheck
```

期待: exit 0。`AuthRequiredError` / `FetchAuthedError` への型 narrowing が成立し、`AdminMutationHttpError` 由来の型エラーゼロ。

### Step 2: lint

```bash
mise exec -- pnpm lint
```

期待: exit 0。未使用 import 警告ゼロ（旧 class 削除に伴う unused import を Phase 5 で除去済み）。

### Step 3: focused test

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed
```

期待:
- `useAdminMutation.spec.ts` の 401 / 403 / 5xx 全 case PASS（Phase 4 で Red にした assertion が Green 化）
- `authed.spec.ts` は変更なしで PASS（class signature 不変）

### Step 4: apps/web 全体 test の回帰チェック

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test
```

期待: 全 PASS。`AdminMutationHttpError` を import している箇所が他に無いため、回帰ゼロのはず。
fail が出た場合は `rg "AdminMutationHttpError" apps/web/src` を再実行し、見落とした参照を補修。

### Step 5: coverage-guard

```bash
bash scripts/coverage-guard.sh
```

期待: exit 0。`apps/web` 対象 package の Statements / Branches / Functions / Lines いずれも **>= 80%**。

`--changed` モードで実行される場合（pre-push 想定）も同じ閾値が適用される。

### Step 6: grep による残存ゼロ最終確認

```bash
rg "AdminMutationHttpError" apps/web/src
rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/index.ts
```

両者 0 hit。

## 統合テスト連携

- 統合テスト（int-test）は本 phase では実行しない（focused test + apps/web 全体で十分）
- p-10 redirect 連携の int test を Phase 4 Step 5 で追加した場合は本 Step 4 に含めて通過させる

## 多角的チェック観点（AIが判断）

| 観点 | 確認方法 |
|------|---------|
| typecheck の narrowing 健全性 | `instanceof FetchAuthedError && e.status === 403` で `e.status` が number として narrow されている（tsc 経由） |
| coverage 劣化なし | `coverage-guard.sh` の閾値超過判定 |
| 未使用 import 残骸ゼロ | lint warning なし |
| `authed.spec.ts` 不変 | `git diff apps/web/src/lib/fetch/__tests__/authed.spec.ts` が空 |
| `hooks/index.ts` 不要 export 残骸ゼロ | grep 0 hit |

## サブタスク管理

- [ ] typecheck PASS
- [ ] lint PASS
- [ ] focused test PASS（useAdminMutation / authed）
- [ ] apps/web 全体 test PASS
- [ ] `coverage-guard.sh` exit 0
- [ ] grep 残存ゼロ

## 成果物

- ローカル検証ログ（typecheck / lint / test / coverage の各 exit 0 出力）
- coverage report（`apps/web/coverage/` 配下）— PR 添付不要、ローカル確認のみ

## 完了条件

- `mise exec -- pnpm typecheck` exit 0
- `mise exec -- pnpm lint` exit 0
- `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` PASS
- `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed` PASS
- `mise exec -- pnpm -F "@ubm-hyogo/web" test` 全 PASS
- **`bash scripts/coverage-guard.sh` exit 0**
- `apps/web` 該当 package の coverage Statements / Branches / Functions / Lines **>= 80%**

## タスク100%実行確認【必須】

- [ ] 上記 6 サブタスクすべて完了
- [ ] coverage-guard exit 0 を実ログで確認
- [ ] `rg "AdminMutationHttpError" apps/web/src` 0 hit

## 次Phase

Phase 7: コードレビュー観点整理（grep gate / type narrowing / p-10 互換確認）
