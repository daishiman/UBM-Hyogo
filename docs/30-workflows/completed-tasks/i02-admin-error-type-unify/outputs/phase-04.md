# Phase 4: テスト作成

**[実装区分: 実装仕様書]** — コード変更を伴う

## メタ情報

- task slug: `i02-admin-error-type-unify`
- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- phase: 4 / 13
- 対象ファイル: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`

## 目的

`useAdminMutation` の error throw path 統合（`AdminMutationHttpError` → `AuthRequiredError` / `FetchAuthedError`）に先行して、**テスト側 assertion を新 class へ書き換え**、Red 状態を作る。
Phase 5 の実装適用後に Green へ遷移する TDD サイクルを成立させる。

## 実行タスク

1. `useAdminMutation.spec.ts` の import を更新
2. 401 case 用 assertion を `AuthRequiredError` で書き換え
3. 403 / non-2xx case 用 assertion を `FetchAuthedError` で書き換え
4. `AdminMutationHttpError` への参照を全削除
5. p-10 redirect logic 連携を確認する int test を 1 件追加（任意・Phase 6 整合確認用）

## 参照資料

- `apps/web/src/lib/fetch/authed.ts` — `AuthRequiredError` / `FetchAuthedError` の class signature
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` — 現状の throw path（L106-110, L144, L148）
- 元 spec の「テスト方針」セクション（before / after コード）

## 実行手順

### Step 1: import 書き換え

```ts
// before
import { AdminMutationHttpError } from "../useAdminMutation";

// after
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";
```

### Step 2: 401 case assertion 更新

```ts
// before
expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
expect((getResult().error as AdminMutationHttpError).status).toBe(401);

// after
expect(getResult().error).toBeInstanceOf(AuthRequiredError);
// AuthRequiredError は status property を持たない設計のため、status 検査は削除
```

### Step 3: 403 case assertion 更新

```ts
// before
expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
expect((getResult().error as AdminMutationHttpError).status).toBe(403);

// after
expect(getResult().error).toBeInstanceOf(FetchAuthedError);
expect((getResult().error as FetchAuthedError).status).toBe(403);
```

### Step 4: 5xx case assertion 更新

403 と同様に `FetchAuthedError` へ置換。`status` property 検査は維持。

### Step 5: p-10 redirect 連携 int test（任意）

`AuthRequiredError` 発火時に redirect handler が呼ばれることを確認するテストを 1 件追加（既存 p-10 redirect 実装が存在する場合のみ）。
未実装の場合は本 phase ではスキップし、p-10 完了後に追加する。

## 統合テスト連携

- `apps/web/src/lib/fetch/__tests__/authed.spec.ts` の既存テストは**変更なし**（class signature 不変）
- 統合テスト（`int-test`）側は admin mutation の error 種別を直接 instanceof で判定する箇所が無いことを `rg "AdminMutationHttpError" apps/web/src` で再確認

## 多角的チェック観点（AIが判断）

| 観点 | 確認方法 |
|------|---------|
| 旧 class 参照ゼロ | `rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/__tests__/` が 0 hit |
| 新 class import が `@/lib/fetch/errors` に統一 | `useAdminMutation.spec.ts` の import 行を目視 |
| 401 / 403 / 5xx の 3 path すべてに assertion がある | `describe` ブロック数と case を突合 |
| Red 状態確認 | Phase 5 着手前に `pnpm -F @ubm-hyogo/web test -- --run useAdminMutation` で fail することを確認 |

## サブタスク管理

- [ ] import 行更新
- [ ] 401 assertion 更新
- [ ] 403 assertion 更新
- [ ] 5xx assertion 更新
- [ ] `rg` で旧 class 残存ゼロ確認
- [ ] Red 状態確認

## 成果物

- 更新ファイル: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- 差分: import / assertion 3-4 箇所。test ロジック・mock setup は不変

## 完了条件

- `useAdminMutation.spec.ts` 内 `AdminMutationHttpError` 参照が 0 件
- `useAdminMutation.spec.ts` 内 `AuthRequiredError` / `FetchAuthedError` 参照が新規追加
- 該当 spec が Red（Phase 5 未着手のため fail）であること

## タスク100%実行確認【必須】

- [ ] 上記 6 サブタスクすべて完了
- [ ] `rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/__tests__/` が空
- [ ] `pnpm -F @ubm-hyogo/web test -- --run useAdminMutation` が assertion 不一致で fail（= Red 確認済み）

## 次Phase

Phase 5: 実装（useAdminMutation.ts 本体の throw path 置換 / class 定義削除）
