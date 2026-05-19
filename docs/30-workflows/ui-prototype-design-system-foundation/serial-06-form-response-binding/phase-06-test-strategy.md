---
phase: 6
title: テスト方針 — adapter unit + Playwright visual + visibility filter assertion
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テスト層

| 層 | 目的 | tool | suffix |
|----|-----|------|--------|
| Unit | adapter の pure function 検証 | vitest | `*.spec.ts` |
| E2E / Visual | 画面描画と visibility filter assertion | Playwright | `*.spec.ts` |
| Contract | API response shape の維持 | 既存 `apps/api` contract spec | （既存・本 sub-workflow では追加しない） |

## 2. adapter unit spec

`/apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`:

### 2.1 ケース表

| # | ケース | 入力 | 期待 |
|---|--------|-----|------|
| 1 | happy path | 6 section, 全 visibility public | sections.length === 6, fields 全件保持 |
| 2 | visibility filter | 1 section に member field を混入 | 該当 field が除外される |
| 3 | section 全 field 除外 | 1 section の全 field が admin | section ごと出力に含まれない |
| 4 | unknown kind | 1 field の kind を `"unknown"` に上書き（型 cast） | silent skip。other fields は保持 |
| 5 | empty sections | publicSections === [] | sections === [] |
| 6 | immutability | input を adapter に渡した後に input を変更しない確認 | adapter 出力が影響を受けない |

### 2.2 テスト構造例

```ts
import { describe, expect, it } from "vitest";

import { toMemberDetailProps } from "../member-detail";
import { samplePublicMemberProfile } from "@/fixtures/public-member-profile";

describe("toMemberDetailProps", () => {
  it("public field のみ通す", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    for (const section of result.sections) {
      for (const field of section.fields) {
        // visibility プロパティは normalize 出力には含まれない
        expect(field).not.toHaveProperty("visibility");
      }
    }
  });

  it("unknown kind を silent skip する", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) = "unknown_kind";
    const result = toMemberDetailProps(tampered);
    expect(
      result.sections[0]?.fields.find(
        (f) => f.stableKey === tampered.publicSections[0].fields[0].stableKey,
      ),
    ).toBeUndefined();
  });
});
```

## 3. Playwright visual spec

`/apps/web/tests/e2e/public-member-detail.spec.ts`:

### 3.1 fixture 接続戦略

Playwright 実行時は MSW / mock fetch handler で `GET /public/members/member-fixture-001` に `samplePublicMemberProfile` を返す mock を設置する。serial-07 regression-evidence で実 D1 seed を使う設計であれば、本 sub-workflow では mock を採用する。

採用方針:
- `apps/web/playwright.config.ts` の `webServer` で API mock 用 `wrangler dev` を立ち上げる場合は実 D1 seed
- そうでなければ `page.route()` で `/public/members/**` を intercept

### 3.2 assertion

| # | 観点 | assertion |
|---|------|-----------|
| 1 | 描画完了 | `await expect(page.locator('[data-page="public-member-detail"]')).toBeVisible()` |
| 2 | 6 section 表示 | `await expect(page.locator('[data-section]')).toHaveCount(<= 6, >= 1)`（adapter で除外された section は出ない） |
| 3 | public field 表示 | `await expect(page.locator('[data-stable-key="full_name"]')).toBeVisible()` |
| 4 | member visibility filter | `await expect(page.locator('[data-stable-key="response_email"]')).toHaveCount(0)` |
| 5 | admin visibility filter | `await expect(page.locator('[data-stable-key="public_consent"]')).toHaveCount(0)` |
| 6 | visual snapshot | `await expect(page).toHaveScreenshot('public-member-detail.png')` |

## 4. notFound 分岐テスト

| # | ケース | mock | 期待 |
|---|--------|------|-----|
| N-1 | 404 応答 | `/public/members/missing-id` → 404 | Next.js not-found page 描画 |
| N-2 | 500 応答 | `/public/members/error-id` → 500 | error boundary 描画 |

これらは Playwright spec に追加してもよいし、本 sub-workflow では skip して serial-07 に委譲してもよい。

## 5. テスト suffix の不変条件

CLAUDE.md 不変条件 8: 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` は禁止。

## 6. coverage 方針

- adapter は 100% branch coverage を達成する（pure function かつ branch が限定的）
- page.tsx / primitive は Playwright で end-to-end 担保（unit coverage 対象外）

## 7. 参照

- Phase 4 契約
- Phase 5 実装ガイド
- `apps/web/playwright.config.ts`
