---
phase: 6
title: テスト計画 — vitest + RTL + (任意) jest-axe
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 6: テスト計画

[実装区分: 実装仕様書]

## 1. テスト戦略

- 単体: vitest + @testing-library/react で render / role / focus / event を検証
- a11y: jest-axe が既存導入されている場合のみ各 spec に 1 件追加（任意）
- E2E: 本 SW スコープ外（Playwright smoke は親 SW で別途）

## 2. 命名規則（CLAUDE.md 不変条件 8）

- `*.spec.tsx` のみ。`*.test.tsx` は禁止（lefthook `block-test-suffix` が reject）

## 3. `loading.spec.tsx`

ファイル: `apps/web/app/login/loading.spec.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoginLoading from "./loading";

describe("LoginLoading", () => {
  // TC-LL-01
  it("role=status / aria-busy=true / aria-live=polite を持つ", () => {
    render(<LoginLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  // TC-LL-02
  it("sr-only テキストが存在する", () => {
    render(<LoginLoading />);
    expect(screen.getByText("ログイン画面を読み込み中")).toBeInTheDocument();
  });
});
```

## 4. `error.spec.tsx`

ファイル: `apps/web/app/login/error.spec.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import LoginError from "./error";

describe("LoginError", () => {
  // TC-LE-01
  it("マウント直後に h1 に focus が当たる", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveFocus();
  });

  // TC-LE-02
  it("digest があるときは code 表示", () => {
    const err = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<LoginError error={err} reset={vi.fn()} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  // TC-LE-03
  it("digest がないときは code 非表示", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.queryByText(/error id:/)).not.toBeInTheDocument();
  });

  // TC-LE-04
  it("reset を呼ぶ", async () => {
    const reset = vi.fn();
    render(<LoginError error={new Error("boom")} reset={reset} />);
    await userEvent.click(screen.getByRole("button", { name: /再読み込み/ }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  // TC-LE-05
  it("section が aria-live=assertive を持つ", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });
});
```

## 5. （任意）jest-axe テスト

既存導入が `apps/web/vitest.setup.ts` 等で確認できた場合のみ追加:

```tsx
import { axe } from "jest-axe";

it("LoginLoading は a11y 違反なし", async () => {
  const { container } = render(<LoginLoading />);
  expect(await axe(container)).toHaveNoViolations();
});
```

## 6. fail path / 回帰 guard（Phase 6 拡充）

| ガード | 期待 |
|--------|------|
| `bg-surface-2` utility 未定義時 build fail | `next build --webpack` で class が purge されず存在することを確認 |
| `*.test.tsx` 命名 | lefthook で reject されること（CI 副次確認） |
| HEX 直書き | `grep -rnE "#[0-9a-fA-F]{3,6}" apps/web/app/login/` で 0 件 |

## 7. テスト実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login
# coverage 取得（Phase 7）
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run --coverage \
  apps/web/app/login/loading.spec.tsx \
  apps/web/app/login/error.spec.tsx
```

## 8. テスト件数サマリー（期待）

| 種別 | 件数 |
|------|------|
| PASS | 4 tests（TC-LL-01..02 + TC-LE-01..05 を 7 assertions で網羅）|PASS | 4 tests（TC-LL-01..02 + TC-LE-01..05 を 7 assertions で網羅） |
| FAIL | 0 |
| SKIP | 0 |
| 任意（jest-axe） | +2（条件付き） |


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 6 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
