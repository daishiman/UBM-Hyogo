// ut-02a-tag-assignment-queue-management:
//   02a memberTags.ts read-only 制約の type-level test (AC-5)。
//   `insert*` / `update*` / `delete*` / `upsert*` 接頭辞の export を新規追加することを禁止する。
//   `assign*` 接頭辞は (1) 既存 `assignTagsToMember`（07a tagQueueResolve workflow 専用 helper）と
//   (2) `assignTagToMemberByAdmin`（issue-982 で再定義した admin manual 経路の audit 付き helper）の
//   2 つのみ allow list で許可し、それ以外の派生 helper の追加を禁止する。
//
//   このファイルは vitest typecheck（`pnpm test -- --typecheck`）で評価される。
//   ts-expect-error コメントが想定通り発火しなければ test 失敗となる。

import { describe, it, expectTypeOf } from "vitest";
import * as memberTags from "../memberTags";

type ModuleExports = typeof memberTags;
type ExportKey = keyof ModuleExports;

// 接頭辞ベースの write keyword 検出
type WriteKeyword<K extends string> = K extends `insert${string}`
  ? K
  : K extends `update${string}`
    ? K
    : K extends `delete${string}`
      ? K
      : K extends `upsert${string}`
        ? K
        : never;

type WriteExports = {
  [K in ExportKey]: K extends string ? WriteKeyword<K> : never;
}[ExportKey];

type AssignKeyword<K extends string> = K extends `assign${string}` ? K : never;

type AssignExports = {
  [K in ExportKey]: K extends string ? AssignKeyword<K> : never;
}[ExportKey];

// 不変条件 #13 再定義（issue-982）: admin manual 経路 `assignTagToMemberByAdmin` は
// audit 付き専用 endpoint からのみ呼ばれる例外として allow list 化する。
// （`unassignTagFromMemberByAdmin` は `assign*` 接頭辞に該当しないため allow list 不要だが、
//   同じ admin manual 経路の対として認識すること。）
type UnauthorizedAssignExports = Exclude<
  AssignExports,
  "assignTagsToMember" | "assignTagToMemberByAdmin"
>;

describe("memberTags.ts read-only 規約 (ut-02a / AC-5)", () => {
  it("insert* / update* / delete* / upsert* 接頭辞の export を持たない", () => {
    expectTypeOf<WriteExports>().toEqualTypeOf<never>();
  });

  it("listTagsByMemberId / listTagsByMemberIds は read 用 export として存在する", () => {
    expectTypeOf<ModuleExports["listTagsByMemberId"]>().not.toBeAny();
    expectTypeOf<ModuleExports["listTagsByMemberIds"]>().not.toBeAny();
  });

  // 既存 `assignTagsToMember` は 07a tagQueueResolve workflow 経由でのみ呼び出される helper。
  // これは新規 write 関数追加禁止の例外として allow list 化する（spec-extraction-map.md 参照）。
  it("既存 helper assignTagsToMember は allow list で許可されている (allow list)", () => {
    expectTypeOf<ModuleExports["assignTagsToMember"]>().not.toBeAny();
  });

  it("assign* 接頭辞の export は allow list（assignTagsToMember / assignTagToMemberByAdmin）以外に増やさない", () => {
    expectTypeOf<UnauthorizedAssignExports>().toEqualTypeOf<never>();
  });

  it("admin manual 経路 assignTagToMemberByAdmin / unassignTagFromMemberByAdmin が export として存在する", () => {
    expectTypeOf<ModuleExports["assignTagToMemberByAdmin"]>().not.toBeAny();
    expectTypeOf<ModuleExports["unassignTagFromMemberByAdmin"]>().not.toBeAny();
  });

  // 不変条件 #13 第3経路（issue-1036）: bulk admin manual write helper。
  // `bulk*` 接頭辞は write keyword（insert/update/delete/upsert）にも `assign*` にも該当しないため
  // gate に抵触しないが、第3経路の write 入口として allow list に明示参照しておく。
  it("bulk admin 経路 bulkApplyMemberTagsByAdmin が export として存在する (allow list)", () => {
    expectTypeOf<ModuleExports["bulkApplyMemberTagsByAdmin"]>().not.toBeAny();
  });
});
