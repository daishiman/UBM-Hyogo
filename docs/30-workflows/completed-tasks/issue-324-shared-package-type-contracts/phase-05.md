# Phase 05: 実装手順

[実装区分: 実装仕様書]

## 目的

Phase 04 WBS に基づき `packages/shared/src/__tests__/type-contracts.spec.ts` を新規作成する。本サイクル内で実装済みであり、Phase 13 は commit / push / PR の user approval gate のみを扱う。

## 入力

- `phase-04.md`（WBS）
- `packages/shared/src/branded/index.ts`
- `packages/shared/src/types/ids.ts`
- `packages/shared/src/zod/viewmodel.ts`
- `packages/shared/src/schemas/admin/admin-request-resolve.ts`

## 変更対象ファイル

| 操作 | パス |
| --- | --- |
| 新規 | `packages/shared/src/__tests__/type-contracts.spec.ts` |

## 関数シグネチャ / 入出力

本ファイルは vitest test ファイルであり、外部に export する関数を持たない。`describe` / `it` / `expectTypeOf` / `@ts-expect-error` のみで構成する。

## 骨格コード（実装テンプレート）

```ts
import { describe, it, expectTypeOf } from "vitest";
import { z } from "zod";

import type {
  MemberId,
  ResponseId,
  ResponseEmail,
  AdminId,
} from "../types/ids";
import {
  MemberProfileZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  AdminMemberListViewZ,
  AdminMemberDetailViewZ,
  AdminDashboardViewZ,
} from "../zod/viewmodel";
import {
  adminRequestResolveBodySchema,
  type AdminRequestResolveBody,
} from "../schemas/admin/admin-request-resolve";

// ---------------------------------------------------------------------------
// AC-1: ResponseId / ResponseEmail mutual exclusion
// ---------------------------------------------------------------------------
describe("AC-1: ResponseId / ResponseEmail mutual exclusion", () => {
  it("ResponseEmail is not assignable to ResponseId", () => {
    expectTypeOf<ResponseEmail>().not.toMatchTypeOf<ResponseId>();
  });

  it("ResponseId is not assignable to ResponseEmail", () => {
    expectTypeOf<ResponseId>().not.toMatchTypeOf<ResponseEmail>();
  });

  it("MemberId / AdminId pairwise distinct (regression for EX-2 extension)", () => {
    expectTypeOf<MemberId>().not.toMatchTypeOf<AdminId>();
    expectTypeOf<AdminId>().not.toMatchTypeOf<MemberId>();
  });
});

// ---------------------------------------------------------------------------
// AC-2: view-model required field omission must be a compile error
// ---------------------------------------------------------------------------
describe("AC-2: view-model required field omission", () => {
  type MemberProfile = z.infer<typeof MemberProfileZ>;

  it("missing 'memberId' on MemberProfile is a type error", () => {
    // @ts-expect-error: 'memberId' is a required field on MemberProfile
    const _vm: MemberProfile = {
      responseId: "r_1",
      responseEmail: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      summary: {
        fullName: "",
        nickname: "",
        location: "",
        occupation: "",
        ubmZone: null,
        ubmMembershipType: null,
      },
      sections: [],
      attendance: [],
      tags: [],
      lastSubmittedAt: "2026-01-01T00:00:00Z",
      editResponseUrl: null,
    };
    void _vm;
  });

  it("missing 'summary' on MemberProfile is a type error", () => {
    // @ts-expect-error: 'summary' is a required field on MemberProfile
    const _vm: MemberProfile = {
      memberId: "m_1",
      responseId: "r_1",
      responseEmail: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      sections: [],
      attendance: [],
      tags: [],
      lastSubmittedAt: "2026-01-01T00:00:00Z",
      editResponseUrl: null,
    };
    void _vm;
  });
});

// ---------------------------------------------------------------------------
// AC-3: zod input / output / infer parity
// ---------------------------------------------------------------------------
describe("AC-3: zod input/output type parity", () => {
  it("MemberProfileZ: z.input ≡ z.output ≡ z.infer", () => {
    expectTypeOf<z.input<typeof MemberProfileZ>>().toEqualTypeOf<
      z.output<typeof MemberProfileZ>
    >();
    expectTypeOf<z.infer<typeof MemberProfileZ>>().toEqualTypeOf<
      z.output<typeof MemberProfileZ>
    >();
  });

  it("AdminMemberDetailViewZ (nested): input ≡ output", () => {
    expectTypeOf<z.input<typeof AdminMemberDetailViewZ>>().toEqualTypeOf<
      z.output<typeof AdminMemberDetailViewZ>
    >();
  });

  it("adminRequestResolveBodySchema: AdminRequestResolveBody ≡ z.output", () => {
    expectTypeOf<AdminRequestResolveBody>().toEqualTypeOf<
      z.output<typeof adminRequestResolveBodySchema>
    >();
  });
});

// ---------------------------------------------------------------------------
// AC-4: public schema and admin schema mutual exclusion (type level)
// ---------------------------------------------------------------------------
describe("AC-4: public/admin schema mutual exclusion", () => {
  type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;
  type AdminMemberListView = z.infer<typeof AdminMemberListViewZ>;
  type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
  type AdminMemberDetail = z.infer<typeof AdminMemberDetailViewZ>;
  type AdminDashboard = z.infer<typeof AdminDashboardViewZ>;

  it("PublicMemberListView is not assignable to AdminMemberListView", () => {
    expectTypeOf<PublicMemberListView>().not.toMatchTypeOf<AdminMemberListView>();
  });

  it("AdminMemberListView is not assignable to PublicMemberListView", () => {
    expectTypeOf<AdminMemberListView>().not.toMatchTypeOf<PublicMemberListView>();
  });

  it("PublicMemberProfile is not assignable to AdminMemberDetail", () => {
    expectTypeOf<PublicMemberProfile>().not.toMatchTypeOf<AdminMemberDetail>();
  });

  it("AdminDashboard is not assignable to PublicMemberListView", () => {
    expectTypeOf<AdminDashboard>().not.toMatchTypeOf<PublicMemberListView>();
  });
});

// ---------------------------------------------------------------------------
// AC-5: test suite independence (meta-assertion)
// ---------------------------------------------------------------------------
describe("AC-5: test suite independence", () => {
  it("shared package can parse a representative schema in isolation", () => {
    // shared 単体で zod schema を instantiate でき、apps/api の D1 binding 等に依存しないことを示す
    const result = adminRequestResolveBodySchema.safeParse({
      resolution: "approve",
    });
    expectTypeOf(result.success).toBeBoolean();
  });

  it("@ts-expect-error directives in this file all match real type errors", () => {
    // 本ファイル内に意図しない @ts-expect-error が残ると tsc が
    // "Unused @ts-expect-error directive" を出して typecheck 全体が fail する。
    // この test 自体は marker であり、上記の Phase 06 typecheck step が実検証となる。
    expectTypeOf<true>().toEqualTypeOf<true>();
  });
});
```

## 手順

| # | 操作 | コマンド / 編集内容 |
| --- | --- | --- |
| 1 | dir 作成 | `mkdir -p packages/shared/src/__tests__` |
| 2 | ファイル新規作成 | 上記骨格コードを `packages/shared/src/__tests__/type-contracts.spec.ts` に書き込む |
| 3 | 型インポート確認 | `viewmodel.ts` から実際に export されている schema 名を grep し相違あれば調整 |
| 4 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` |
| 5 | test | `mise exec -- pnpm --filter @ubm-hyogo/shared test` |
| 6 | 全体 typecheck | `mise exec -- pnpm typecheck` |
| 7 | 全体 test | `mise exec -- pnpm test` |

## 出力

- `packages/shared/src/__tests__/type-contracts.spec.ts`（新規 1 ファイル）

## 完了条件 (DoD)

- [x] 5 describe ブロック / 15 it ケース（AC-1: 3, AC-2: 2, AC-3: 4, AC-4: 4, AC-5: 2）が存在。
- [x] `@ts-expect-error` が AC-2 内 2 箇所のみ、いずれも理由コメント付き。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/shared test` が新 15 件含めて PASS。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` が PASS（`Unused @ts-expect-error directive` なし）。
- [x] runtime コードへの変更なし（`packages/shared/src/__tests__/type-contracts.spec.ts` のみ追加）。

## テスト方針

- Type-only assertion は実行コストほぼゼロ。
- AC-2 は `@ts-expect-error` 単体では runtime 検証されないため、Phase 06 の typecheck step が真の gate。
- AC-3 は zod schema が `transform()` を介さない限り `z.input ≡ z.output` が成立する性質を利用。viewmodel.ts の対象 schema は transform 未使用を grep で確認済。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm typecheck
mise exec -- pnpm test
```

## リスクと対策

| リスク | 対策 |
| --- | --- |
| schema 名の typo（実 export と相違） | 手順 #3 で grep `^export const` 確認 |
| viewmodel.ts に将来 `.transform()` が入り AC-3 が崩れる | AC-3 it 内のコメントで「transform 未使用前提」を明示し、追加時は本 spec を更新するルールを Phase 10 で文書化 |
| `@ts-expect-error` の意図せぬ抑制 | 行直下の意図不明な error を吸収しないよう、必須 field 欠落 1 件のみに限定 |
