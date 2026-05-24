# Phase 4: テスト計画

新規 primitive `AdminTopbar` の TDD（RED → GREEN）計画。Phase 2 の正本実装スニペットに対し、props 省略時の既定描画 / slot 注入 / OKLch トークン参照 / axe を単体 spec で網羅し、既存 `(admin)/layout.spec.tsx` を integration 回帰として無修正 pass で守る。

## 1. テスト戦略マトリクス

| Layer | テスト種別 | ツール | 対象 | 区分 |
|---|---|---|---|---|
| Unit | primitive 単体契約 | Vitest + React Testing Library | `AdminTopbar.tsx`（既定描画 / slot 注入 / OKLch / axe） | **新規（RED→GREEN）** |
| Integration | AppShell data-* 契約回帰 | Vitest | `app/(admin)/layout.spec.tsx`（topbar/sidebar/route/theme/route-group） | **無修正 pass 確認** |
| Manual | 視認 | browser（Phase 11） | admin layout の topbar 表示 | Phase 11 担保 |

> 新規 primitive のため、まず spec を書いて RED（`AdminTopbar.tsx` 未存在で import error）を確認し、Phase 5 で実装して GREEN にする TDD サイクルとする。

## 2. props vs internal state（VSCPKR-03）

- AdminTopbar は **internal state を一切持たない**純粋な props → DOM の Server Component。
- テスト操作対象は全て **外部 props**（`breadcrumb` / `actions`）と **props 省略（default param `= {}`）** の 2 系統のみ。`useState` / event handler 由来の状態遷移テストは存在しない。
- したがって本 Phase の TC は「外部入力（props）× 期待 DOM」の組み合わせのみで設計する。

## 3. テストケース表（`AdminTopbar.spec.tsx`）

| TC-id | 観点 | 入力 | 期待値 |
|---|---|---|---|
| TC-1 | 既定 root 描画 | `<AdminTopbar />`（props 省略） | `<header data-shell="topbar">` が 1 件描画される |
| TC-2 | 既定 breadcrumb slot | props 省略 | `data-component="admin-breadcrumb-slot"` の `<div>` が存在し、テキスト「管理」を含む |
| TC-3 | 既定 actions slot | props 省略 | `data-component="admin-topbar-actions"` の `<div>` が `aria-hidden="true"` を持ち、子要素が空 |
| TC-4 | breadcrumb 注入 | `breadcrumb={<span data-testid="bc">パンくず</span>}` | slot wrapper（`data-component="admin-breadcrumb-slot"`）は維持、中身が注入要素に差し替わる（既定テキスト「管理」は消える） |
| TC-5 | actions 注入 | `actions={<button data-testid="act">操作</button>}` | slot wrapper（`data-component="admin-topbar-actions"`）の中身が注入要素に差し替わり、`aria-hidden` 属性が**外れる** |
| TC-6 | OKLch トークン class | props 省略 | root header の class に `border-[var(--ubm-color-border-default)]`、breadcrumb slot の class に `text-[var(--ubm-color-text-primary)]` が含まれる |
| TC-7 | axe critical violation | props 省略 / 注入双方の代表 1 ケース | axe 検査で violations 0 |

## 4. 各 TC のテストコードスニペット（実装者がそのまま使える粒度）

新規ファイル: `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`

> import 階層: spec は `__tests__/` 配下のため、primitive 本体は `../AdminTopbar`、axe helper（`apps/web/src/test/axe.ts`）は `../../../test/axe`。`axe` は `jest-axe` の `configureAxe` インスタンスで、`expect(await axe(container)).toHaveNoViolations()` の形で使う（`jest-axe/extend-expect` の `toHaveNoViolations` matcher は既存 vitest setup で読み込まれている前提。未設定なら spec 冒頭で `import "jest-axe/extend-expect";` を追加する）。

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { AdminTopbar } from "../AdminTopbar";

afterEach(() => cleanup());

describe("AdminTopbar", () => {
  // TC-1: props 省略時に data-shell="topbar" の <header> を描画
  it("props 省略時に data-shell=\"topbar\" の header を 1 件描画する", () => {
    const { container } = render(<AdminTopbar />);
    const headers = container.querySelectorAll('header[data-shell="topbar"]');
    expect(headers).toHaveLength(1);
    expect(headers[0].tagName).toBe("HEADER");
  });

  // TC-2: 省略時 breadcrumb slot がテキスト「管理」を含む
  it("props 省略時に breadcrumb slot がテキスト「管理」を含む", () => {
    const { container } = render(<AdminTopbar />);
    const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    expect(slot).not.toBeNull();
    expect(slot?.textContent).toBe("管理");
  });

  // TC-3: 省略時 actions slot が aria-hidden="true" を持ち中身が空
  it("props 省略時に actions slot が aria-hidden=\"true\" を持ち中身が空", () => {
    const { container } = render(<AdminTopbar />);
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions).not.toBeNull();
    expect(actions?.getAttribute("aria-hidden")).toBe("true");
    expect(actions?.childNodes.length).toBe(0);
  });

  // TC-4: breadcrumb 注入で slot 中身が差し替わる（wrapper の data-component は維持）
  it("breadcrumb 注入で slot 中身が差し替わり wrapper は維持される", () => {
    const { container } = render(
      <AdminTopbar breadcrumb={<span data-testid="bc">パンくず</span>} />,
    );
    const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    expect(slot).not.toBeNull();
    expect(slot?.querySelector('[data-testid="bc"]')).not.toBeNull();
    // 既定テキスト「管理」は注入で置き換わる
    expect(slot?.textContent).toBe("パンくず");
  });

  // TC-5: actions 注入で slot 中身が差し替わり aria-hidden が外れる
  it("actions 注入で slot 中身が差し替わり aria-hidden が外れる", () => {
    const { container } = render(
      <AdminTopbar actions={<button data-testid="act">操作</button>} />,
    );
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions).not.toBeNull();
    expect(actions?.querySelector('[data-testid="act"]')).not.toBeNull();
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
  });

  // TC-6: OKLch トークン class が DOM class に存在
  it("OKLch トークン class（border / text）が DOM class に存在する", () => {
    const { container } = render(<AdminTopbar />);
    const header = container.querySelector('header[data-shell="topbar"]');
    const breadcrumb = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    expect(header?.className).toContain("border-[var(--ubm-color-border-default)]");
    expect(breadcrumb?.className).toContain("text-[var(--ubm-color-text-primary)]");
  });

  // TC-7: axe critical violation 0（省略時 + 注入時の代表ケース）
  it("axe critical violation 0（props 省略時）", async () => {
    const { container } = render(<AdminTopbar />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("axe critical violation 0（slot 注入時）", async () => {
    const { container } = render(
      <AdminTopbar
        breadcrumb={<span>会員管理</span>}
        actions={<button type="button">操作</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

## 5. integration 回帰（`(admin)/layout.spec.tsx` 無修正 pass）

- 既存 `apps/web/app/(admin)/layout.spec.tsx` は AppShell の data-* 契約（`data-shell="topbar"` / `data-shell="sidebar"` / `data-route="admin"` / `data-theme="cool"` / `data-route-group="admin"`）を assert する。
- 本タスクは inline `<header data-shell="topbar">` を `<AdminTopbar />` 呼び出しに置換するだけで、出力 DOM は同一（`data-shell="topbar"` は primitive 内部 root に保持）。
- したがって layout.spec.tsx は **無修正で pass しなければならない**。pass しない場合は data-* 契約の所有権（Phase 2 §2）が崩れている兆候であり、実装 diff を見直す（特に `data-route-group` / `data-theme` を誤って primitive へ移していないか）。

## 6. 実行コマンド

```bash
# 新規 primitive spec（括弧を含まないパスのためエスケープ不要）
mise exec -- pnpm --filter @ubm-hyogo/web test -- "src/components/layout/__tests__/AdminTopbar.spec.tsx"

# 既存 layout 回帰 spec（パスに () を含むため引用符で囲み shell の glob/グループ展開を防ぐ）
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
```

> パス `app/(admin)/layout.spec.tsx` の括弧は引用符で囲めば zsh/bash でそのまま渡せる（`"..."` 内では `()` は展開されない）。引用を外す場合のみ `app/\(admin\)/layout.spec.tsx` のエスケープが必要。

## 7. 完了判定（Gate-B 入口）

- TC-1〜TC-7 が全て GREEN。
- `(admin)/layout.spec.tsx` が無修正で GREEN。
- RED フェーズ（実装前に import error で fail）→ GREEN フェーズ（Phase 5 実装後 pass）の遷移を確認済み。
