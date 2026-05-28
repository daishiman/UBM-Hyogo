---
spec_classification: implementation_spec
state: spec_created
phase: 6
phase_name: テスト追加
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 6: テスト追加

## 6.1 新規 / 追記 spec

| # | spec path | 種別 | 内容 |
|---|-----------|------|------|
| 1 | `apps/web/app/(admin)/admin/tags/__tests__/page.spec.tsx` | RTL | AdminPageHeader title="タグ割当" / eyebrow="ADMIN / TAGS" / 直 Breadcrumb 0 件 |
| 2 | `apps/web/app/(admin)/admin/meetings/__tests__/page.spec.tsx` | RTL | title="開催日 / 出席管理" |
| 3 | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/page.spec.tsx` | RTL | title=`${detail.title}`・breadcrumbs 3 段 |
| 4 | `apps/web/app/(admin)/admin/schema/__tests__/page.spec.tsx` | RTL | actions slot に "resolve 履歴を見る" Link |
| 5 | `apps/web/app/(admin)/admin/schema/history/__tests__/page.spec.tsx` | RTL | title="alias resolve 履歴" |
| 6 | `apps/web/app/(admin)/admin/requests/__tests__/page.spec.tsx` | RTL | title="依頼キュー" |
| 7 | `apps/web/app/(admin)/admin/identity-conflicts/__tests__/page.spec.tsx` | RTL | (1) AdminPageHeader 配置 (2) `<main>` 0 件 (3) palette class 0 件 |
| 8 | `apps/web/app/(admin)/admin/audit/__tests__/page.spec.tsx` | RTL | title="監査ログ" |
| 9 | `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx` | RTL | AdminPageHeader 配置のみ |
| 10 | `tests/structure/admin-page-header-adoption.spec.ts` | structure gate | AC-C1..C5 grep gate |

## 6.2 RTL spec の共通骨子 (擬似)

```ts
import { render, screen } from "@testing-library/react";
import Page from "../page";

describe("<seg> page", () => {
  it("renders AdminPageHeader with expected title and eyebrow", async () => {
    const ui = await Page({ /* server props */ });
    render(ui);
    expect(screen.getByRole("heading", { level: 1, name: /<title>/ })).toBeInTheDocument();
    expect(screen.getByText("ADMIN / <SEG>")).toBeInTheDocument();
  });

  it("does not render legacy <Breadcrumb> directly", () => {
    // page.tsx の DOM 内で aria-label="パンくず" 等を直接出す Breadcrumb component が
    // 重複出現しないことを assert
  });
});
```

## 6.3 structure gate 骨子 (擬似)

```ts
// tests/structure/admin-page-header-adoption.spec.ts
import { globSync } from "node:fs";
import { readFileSync } from "node:fs";

const pages = globSync("apps/web/app/(admin)/admin/**/page.tsx");

describe("admin page-header adoption", () => {
  it.each(pages)("%s adopts AdminPageHeader", (p) => {
    const src = readFileSync(p, "utf-8");
    expect(src).toMatch(/AdminPageHeader/);
  });

  it.each(pages)("%s does not import legacy Breadcrumb directly", (p) => {
    const src = readFileSync(p, "utf-8");
    expect(src).not.toMatch(/from\s+["']@\/components\/admin\/Breadcrumb["']/);
  });

  it.each(pages)("%s has no Tailwind palette classes", (p) => {
    const src = readFileSync(p, "utf-8");
    expect(src).not.toMatch(/\b(text|bg|border|divide)-(zinc|slate|gray|neutral|blue|red|green|amber|yellow|sky|indigo)-[0-9]/);
  });

  it.each(pages)("%s has no inline HEX colors", (p) => {
    const src = readFileSync(p, "utf-8");
    expect(src).not.toMatch(/(bg|text|border)-\[#/);
  });
});
```

## 6.4 既存 spec の touch

panel spec / e2e は触らない (I-C2)。
