---
phase: 6
title: テスト方針 — adapter unit + Playwright visual + visibility filter assertion
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テスト層

| 層 | 目的 | tool | suffix | 配置 |
|----|-----|------|--------|------|
| Unit | adapter の pure function 検証 | vitest | `*.spec.ts` | `/apps/web/src/lib/adapters/__tests__/` |
| E2E / Visual | 画面描画と visibility filter assertion | Playwright | `*.spec.ts` | `/apps/web/playwright/tests/` |
| Contract | API response shape の維持 | 既存 `apps/api` contract spec | — | （既存・本 sub-workflow では追加しない） |

CLAUDE.md 不変条件 #8 により `*.test.{ts,tsx}` 命名は禁止。lefthook `block-test-suffix` と CI `verify-test-suffix` が reject する。

## 2. adapter unit spec

`/apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`:

### 2.1 ケース表（6 ケース・branch coverage 100% を目標）

| # | ケース | 入力 | 期待 |
|---|--------|-----|------|
| 1 | happy path（fixture 経由） | `samplePublicMemberProfile` | `sections.length >= 1`, `summary` / `attendance` / `tags` がそのまま伝播 |
| 2 | fixture が schema 適合 | `samplePublicMemberProfile` | `PublicMemberProfileZ.parse(...)` が throw しない |
| 3 | visibility=member field 除外 | fixture（contact 内 `response_email`） | 出力 sections のどの field にも `stableKey === "response_email"` が無い |
| 4 | visibility=admin field 除外 / section 丸ごと除外 | fixture（consent section の全 field admin） | 出力 sections に `key === "consent"` が無い |
| 5 | unknown kind silent skip | `structuredClone(fixture)` の 1 field `kind` を `"unknown_kind"` に強制上書き | 該当 field が出力から消える。他 field は保持。throw しない |
| 6 | adapter immutability | fixture を渡したあと input を JSON 比較 | 入力 reference が mutate されない |
| 7 | empty publicSections | `{ ...fixture, publicSections: [] }` | `sections === []`、throw しない |
| 8 | sanitize（visibility/source が出力に出ない） | fixture | 出力 field に `visibility` / `source` キーが含まれない |

> ケース 7・8 を追加し計 8 ケースとする（Phase 8 DoD-13 と整合させるため Phase 8 側を 8 ケース表記に追従）。

### 2.2 テスト構造例

```ts
import { describe, expect, it } from "vitest";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { toMemberDetailProps } from "../member-detail";
import { samplePublicMemberProfile } from "@/fixtures/public-member-profile";

describe("toMemberDetailProps", () => {
  it("fixture は PublicMemberProfileZ.parse を通過する", () => {
    expect(() => PublicMemberProfileZ.parse(samplePublicMemberProfile)).not.toThrow();
  });

  it("visibility=member field を除外する", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    const allFields = result.sections.flatMap((s) => s.fields);
    expect(allFields.find((f) => f.stableKey === "response_email")).toBeUndefined();
  });

  it("visibility=admin のみで構成された section は丸ごと除外", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    expect(result.sections.find((s) => s.key === "consent")).toBeUndefined();
  });

  it("unknown kind を silent skip する", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) = "unknown_kind";
    const result = toMemberDetailProps(tampered);
    const basic = result.sections.find((s) => s.key === "basic");
    expect(basic?.fields.find((f) => f.stableKey === "full_name")).toBeUndefined();
    // 他 field は保持
    expect(basic?.fields.find((f) => f.stableKey === "nickname")).toBeDefined();
  });

  it("入力を mutate しない", () => {
    const snapshot = structuredClone(samplePublicMemberProfile);
    toMemberDetailProps(samplePublicMemberProfile);
    expect(samplePublicMemberProfile).toEqual(snapshot);
  });

  it("publicSections が空のとき sections === []", () => {
    const result = toMemberDetailProps({
      ...samplePublicMemberProfile,
      publicSections: [],
    });
    expect(result.sections).toEqual([]);
  });

  it("出力 field には visibility / source キーが含まれない", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    for (const section of result.sections) {
      for (const field of section.fields) {
        expect(field).not.toHaveProperty("visibility");
        expect(field).not.toHaveProperty("source");
      }
    }
  });
});
```

## 3. Playwright visual spec

`/apps/web/playwright/tests/serial-06-member-detail.spec.ts`:

### 3.1 fixture 接続戦略

Playwright 実行時は 2 通りの戦略を選択可能。本 sub-workflow では **戦略 B (in-process mock API fixture)** を採用する。実 D1 seed を使った production-equivalent baseline 確定は `serial-07-regression-evidence` に委譲する。

| 戦略 | 説明 | 採否 |
|------|------|------|
| A: 実 D1 seed | `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --local --command "INSERT ..."` | serial-07 で採用 |
| B: in-process mock API fixture | `apps/web/playwright/fixtures/auth.ts` の `mockApi` が SSR fetch 先 `http://127.0.0.1:8787/public/members/sample-001` を返す | **本 sub-workflow で採用** |

### 3.2 assertion

| # | 観点 | assertion |
|---|------|-----------|
| 1 | 描画完了 | `await expect(page.locator('[data-page="public-member-detail"]')).toBeVisible()` |
| 2 | section 描画 | `await expect(page.locator('[data-section]')).toHaveCount({ min: 1, max: 6 })` 相当（実装は `.count()` で取得して assertion） |
| 3 | public field 表示 | `await expect(page.locator('[data-stable-key="member_display_name"]')).toBeVisible()` |
| 4 | activity bridge 表示 | `await expect(page.locator('[data-stable-key="attendance:session_task18"]')).toBeVisible()` |
| 5 | visibility filter | adapter unit spec で `member` / `admin` field 除外を検証 |
| 6 | admin visibility filter (consent section) | `await expect(page.locator('[data-section="consent"]')).toHaveCount(0)` |
| 7 | visual snapshot | `outputs/phase-11/screenshots/public-member-detail.png` に `page.screenshot` で保存 |

### 3.3 spec 雛形

```ts
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "../fixtures/auth";

test.describe("serial-06 public member detail binding", () => {
  test("API-backed 詳細を描画し screenshot を保存する", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/members/sample-001");
    await expect(page.locator('[data-page="public-member-detail"]')).toBeVisible();
    await expect(page.locator('[data-stable-key="member_display_name"]')).toBeVisible();
    await expect(page.locator('[data-stable-key="attendance:session_task18"]')).toBeVisible();
    await mkdir("docs/.../outputs/phase-11/screenshots", { recursive: true });
    await page.screenshot({ path: path.join("docs/.../outputs/phase-11/screenshots", "public-member-detail.png"), fullPage: true });
  });
});
```

> spec は `data-stable-key="..."` 等の属性が既存 `MemberDetailSections` の出力に含まれることを前提とする。含まれていない場合は serial-05 内で属性を追加する依頼を出す（本 sub-workflow では primitive 編集禁止）。

## 4. notFound / error 分岐テスト

| # | ケース | mock | 期待 | スコープ |
|---|--------|------|-----|---------|
| N-1 | 404 応答 | `/public/members/missing-id` → status 404 | Next.js not-found 画面 | 本 sub-workflow（任意） |
| N-2 | 500 応答 | `/public/members/error-id` → status 500 | `(public)/error.tsx` boundary | serial-07 に委譲可 |

N-1 は最低 1 ケース本 sub-workflow に含めることを推奨。N-2 は serial-07 と二重実装にならないよう調整する。

## 5. テスト suffix の不変条件

CLAUDE.md 不変条件 #8: 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` は禁止。違反時は lefthook `block-test-suffix` で reject される。

## 6. coverage 方針

- adapter は **100% branch coverage** を達成する（pure function かつ branch が限定的）
- page.tsx / primitive は Playwright で end-to-end 担保（unit coverage 対象外）
- coverage drop は `scripts/coverage-guard.sh` で検知（sync-merge 例外あり / CLAUDE.md 参照）

## 7. 参照

- Phase 4 契約
- Phase 5 実装ガイド
- Phase 8 DoD
- `apps/web/playwright.config.ts`
- `apps/web/vitest.config.ts`
- CLAUDE.md「sync-merge 時の hook 挙動」（coverage-guard 例外）
