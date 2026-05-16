# Phase 9: 品質検証（E2E + 統合）

## メタ情報

- **タスク**: parallel-08-shared-foundation-admin-ui-foundation
- **Phase**: 9 / 13
- **[実装区分: 実装仕様書]**
- **判定根拠**: `apps/web/app/layout.tsx` 編集、`apps/web/src/features/admin/hooks/useAdminMutation.ts` および `apps/web/src/features/admin/hooks/index.ts` の新規作成という code 差分を伴う。`(admin)/admin/error.tsx` / `middleware.ts` は confirm（既存）。よって docs-only ではなく実装仕様書。
- **前提**: Phase 1〜8 完了済み。type-only skeleton + ToastProvider wrap が apps/web に組み込まれている。

---

## 目的

admin UI 共通基盤（ToastProvider root 配置・useAdminMutation skeleton・admin error boundary・middleware guard）が、`/admin` route の実ランタイムで E2E + 統合レベルで矛盾なく機能することを検証する。
特に serial-05/step-01 から `import { useAdminMutation } from "@/features/admin/hooks"` が type-only で先行解決できることを確認し、後続 step の前提を担保する。

---

## 実行タスク

1. typecheck / lint / build の grep gate を含めた lint pass
2. Vitest 単体テストで `useAdminMutation` skeleton の throw 挙動と型 export を検証
3. Playwright `@admin-smoke` tag で `/admin` page load smoke を実行
4. ToastProvider scope 内で `useToast` が `/admin` 配下から参照できることを runtime で確認
5. `(admin)/admin/error.tsx` が boundary trigger（useAdminMutation throw）を catch することを確認
6. coverage >=80% を確認し `bash scripts/coverage-guard.sh` exit 0
7. serial-05/step-01 が `import { useAdminMutation } from "@/features/admin/hooks"` を type-only で resolve できることを `tsc --noEmit` で先行検証

---

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- `apps/web/app/layout.tsx`
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `apps/web/src/features/admin/hooks/index.ts`
- `apps/web/app/(admin)/admin/error.tsx`（既存）
- `apps/web/middleware.ts`（既存）
- `apps/web/src/components/ui/Toast.tsx`
- CLAUDE.md 不変条件: D1 直接アクセス禁止 / OKLch トークン / `getEnv()` 経由 env

---

## 実行手順

### Step 1: 型チェック / lint / build

```bash
mise exec -- pnpm tsc --noEmit
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" build
```

- すべて exit 0
- `next build --webpack` を Cloudflare Workers 互換のため正本とする

### Step 2: 単体テスト

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test
```

- `useAdminMutation` を呼ぶと `Error("implementation in step-01")` が throw されること
- `AdminMutationOptions` / `AdminMutationResult` 型が `@/features/admin/hooks` から export されていること

### Step 3: E2E smoke（admin page load）

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec playwright test --grep @admin-smoke
```

- `/admin` への到達（middleware guard 通過済みセッション）
- `ToastProvider` 配下で `useToast` が throw しないこと
- 意図的に `useAdminMutation` を呼んだ component で `(admin)/admin/error.tsx` の reset button が描画されること

### Step 4: serial-05 連携の type-only 先行検証

`apps/web/src/__type_probe__/parallel-08.ts`（一時 probe、Phase 10 終了時に削除）に以下を置き `tsc --noEmit` を再実行:

```ts
import { useAdminMutation, type AdminMutationOptions, type AdminMutationResult } from "@/features/admin/hooks";
// type-only 解決のみ確認。実行はしない。
type _A = AdminMutationOptions;
type _B = AdminMutationResult;
type _C = typeof useAdminMutation;
```

### Step 5: coverage guard

```bash
bash scripts/coverage-guard.sh
```

- exit 0、`apps/web` line coverage >= 80%

---

## 統合テスト連携

- serial-05/step-01 は本 Phase 通過後にのみ `useAdminMutation` 実装本体（fetch + toast + error 伝播）に着手できる。
- ToastProvider scope は root layout 配置のため、`(public)` / `(admin)` 両 segment から `useToast` 参照可能であることを smoke で同時に確認する。
- `(admin)/admin/error.tsx` の reset 動作は React Server Components の boundary 契約に従う。

---

## 多角的チェック観点（AI が判断）

- **SRP**: `useAdminMutation` は fetch + toast + error の 3 責務に閉じ、admin domain ロジックを混入しない（Phase 9 は型契約のみ）
- **不変条件**: D1 直接アクセス禁止 / `getEnv()` 経由 / OKLch トークン / `apps/web` から D1 binding 禁止
- **テスト戦略**: `*.spec.ts` 命名のみ（`*.test.ts` 禁止）
- **dependency**: serial-05/step-01 への type 契約に破壊的変更なし
- **scope**: ToastProvider wrap 以外の root layout 変更を含まない

---

## サブタスク管理

| No | サブタスク | 完了条件 |
|----|-----------|---------|
| 9-1 | typecheck / lint / build | 3 コマンド exit 0 |
| 9-2 | 単体テスト | useAdminMutation throw + 型 export 検証 |
| 9-3 | Playwright `@admin-smoke` | /admin load + ToastProvider scope + error.tsx catch |
| 9-4 | type-only 先行検証 | serial-05 想定 import が tsc 通過 |
| 9-5 | coverage guard | exit 0 / >=80% |

---

## 成果物

- `outputs/phase-9/quality-report.md`（pass/fail 一覧、coverage 数値、smoke 実行 log path）
- `outputs/phase-9/type-probe.md`（serial-05 連携検証結果）

---

## 完了条件

- [ ] typecheck / lint / build / test / playwright `@admin-smoke` / coverage-guard すべて pass
- [ ] ToastProvider scope 内で `useToast` が `/admin` 配下で throw しない
- [ ] `(admin)/admin/error.tsx` が useAdminMutation throw を catch
- [ ] serial-05 想定 import が type-only で resolve
- [ ] CLAUDE.md 不変条件違反 0

---

## タスク 100% 実行確認【必須】

- [ ] 上記 7 タスクすべて完遂
- [ ] 1 つでも未完であれば本 Phase を fail として再着手
- [ ] CONST_007（先送り禁止）遵守

---

## 次 Phase

Phase 10: 最終レビュー（design ↔ implementation drift 0 を確認）。
