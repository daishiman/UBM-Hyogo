# Phase 6: テスト実行 + カバレッジ計測

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | parallel-08-shared-foundation-admin-ui-foundation |
| phase | 6 / 13 |
| 種別 | 検証（自動テスト・カバレッジ） |
| 想定所要 | 20〜30 分 |
| 前提 Phase | Phase 5 完了（ファイル変更・新規・confirm 完了） |

---

## 目的

Phase 5 で投入した admin UI 共通基盤の最低品質ゲートを満たす。

1. Vitest（unit + contract）が全て pass
2. Playwright smoke で `/admin` route が runtime error なしに初回描画
3. `bash scripts/coverage-guard.sh` exit 0（Statements / Branches / Functions / Lines >=80%）
4. `tsc --noEmit` が 0 error

> 本 Phase は **検証のみ**。コード差分の追加投入は Phase 5 へ差し戻して再実行する。

---

## 実行タスク

| # | 内容 | コマンド |
|---|------|---------|
| T1 | 型再確認 | `mise exec -- pnpm tsc --noEmit` |
| T2 | Vitest unit | `mise exec -- pnpm -F "@ubm-hyogo/web" test` |
| T3 | カバレッジ計測 | `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --coverage` |
| T4 | カバレッジ gate | `bash scripts/coverage-guard.sh` |
| T5 | Web build smoke | `mise exec -- pnpm -F "@ubm-hyogo/web" build` |
| T6 | Playwright smoke | `mise exec -- pnpm -F "@ubm-hyogo/web" exec playwright test --grep "@smoke"` （存在しない場合は dev server + `curl http://localhost:3000/admin` で 200/302 確認に代替） |

---

## 参照資料

| 種別 | パス |
|------|------|
| coverage-guard | `scripts/coverage-guard.sh` |
| Vitest 設定 | `apps/web/vitest.config.ts` |
| Playwright 設定 | `apps/web/playwright.config.ts`（存在しない場合は skip 代替） |
| Phase 5 成果物 | `apps/web/src/features/admin/hooks/`, `apps/web/app/layout.tsx` |

---

## 実行手順

### Step 1 — 型チェック

```bash
mise exec -- pnpm tsc --noEmit
```

**期待値**: 0 error。`useAdminMutation` の型 import に起因するエラーが無いこと。

### Step 2 — Vitest（unit + contract）

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test
```

**契約テスト要件**（Phase 4/5 で追加済みの `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` を実行する。本 Phase で新規テストを追加しない）:

```ts
import { describe, expect, it } from "vitest";
import {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "@/features/admin/hooks";

describe("useAdminMutation contract", () => {
  it("exports the function with the expected arity", () => {
    expect(typeof useAdminMutation).toBe("function");
    expect(useAdminMutation.length).toBeGreaterThanOrEqual(1);
  });

  it("throws the step-01 placeholder until implementation lands", () => {
    expect(() => useAdminMutation("patchMemberStatus")).toThrowError(
      /implementation in step-01/,
    );
  });

  it("preserves AdminMutationOptions / AdminMutationResult shapes as type-only", () => {
    const opts: AdminMutationOptions = { toastMessage: "ok" };
    const _result: AdminMutationResult | null = null;
    expect(opts.toastMessage).toBe("ok");
    expect(_result).toBeNull();
  });
});
```

> ファイル名は `*.spec.ts`（CLAUDE.md 不変条件: `*.test.ts` 禁止）。

### Step 3 — カバレッジ計測 + Gate

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --coverage
bash scripts/coverage-guard.sh
```

**期待値**:
- Statements / Branches / Functions / Lines いずれも **>= 80%**
- `coverage-guard.sh` exit code = 0

> Phase 5 で新規追加した `useAdminMutation.ts` は throw skeleton のため branch coverage が低くなりやすい。契約テストで `toThrow` 経路を確実に通すこと。

### Step 4 — Web build smoke

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" build
```

**期待値**: OpenNext Workers 互換 build が成功。`next build --webpack` 経由（CLAUDE.md 不変条件）。

### Step 5 — Playwright smoke / route reachability

`apps/web/playwright.config.ts` が存在する場合:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec playwright test --grep "@smoke"
```

存在しない場合の代替（dev server 起動 → HTTP 応答確認）:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev &
DEV_PID=$!
sleep 8
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
kill $DEV_PID
```

**期待値**: `/admin` への HTTP 応答が 200 / 302 / 307 のいずれか（middleware による未ログインリダイレクト含む）。500 系は不可。

---

## 統合テスト連携

- contract test は serial-05/step-01 投入後も assertion を継続維持（throw メッセージは差し替え予定）。
- coverage 80% gate は ui-prototype-alignment-mvp-recovery 全体方針と整合。

---

## 多角的チェック観点（AIが判断）

- coverage が 80% に乗らない場合、不要なファイルが計測対象に含まれていないか（`vitest.config.ts` の `coverage.include` / `exclude` 設定）
- Playwright smoke の代替（curl）でも runtime error が console に出ていないか
- build の bundle に `[project]/...` 仮想 module specifier が混入していないか（CLAUDE.md 不変条件）
- contract test の `*.spec.ts` 命名が守られているか

---

## サブタスク管理

| ID | 内容 | 完了条件 |
|----|------|---------|
| ST-06-01 | tsc --noEmit 0 error | exit 0 |
| ST-06-02 | Vitest 全 pass | failure 0 |
| ST-06-03 | coverage >=80% | coverage-guard.sh exit 0 |
| ST-06-04 | web build success | exit 0 |
| ST-06-05 | /admin reachable | HTTP 200/302/307 |

---

## 成果物

- `outputs/phase-06/test-summary.md`（Vitest / coverage / build / smoke の各実行ログ抜粋）
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.contract.spec.ts`（不足時に追加）
- coverage report（`apps/web/coverage/` 配下、リポジトリには含めない）

---

## 完了条件 (DoD)

- [ ] `mise exec -- pnpm tsc --noEmit` exit 0
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test` exit 0
- [ ] `bash scripts/coverage-guard.sh` exit 0（Statements/Branches/Functions/Lines 全 >=80%）
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" build` exit 0
- [ ] `/admin` route が HTTP 200/302/307 で応答

---

## タスク100%実行確認【必須】

```bash
mise exec -- pnpm tsc --noEmit \
  && mise exec -- pnpm -F "@ubm-hyogo/web" test \
  && mise exec -- pnpm -F "@ubm-hyogo/web" test -- --coverage \
  && bash scripts/coverage-guard.sh \
  && mise exec -- pnpm -F "@ubm-hyogo/web" build
```

上記チェーンが exit 0 で完走することを確認する。1 つでも fail した場合は本 Phase 内で原因を解消し、Phase 7 へ進まない。

---

## 次Phase

→ Phase 7: 静的解析・型安全性（lint / strict / unused import / token 直書き grep）
