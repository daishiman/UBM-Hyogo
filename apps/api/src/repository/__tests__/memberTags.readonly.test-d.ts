// ut-02a-tag-assignment-queue-management:
//   02a memberTags.ts read-only 制約の type-level test (AC-5)。
//   `insert*` / `update*` / `delete*` / `upsert*` 接頭辞の export を新規追加することを禁止する。
//   既存 `assignTagsToMember` は 07a tagQueueResolve workflow 専用 helper として allow list で許可する。
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
});
