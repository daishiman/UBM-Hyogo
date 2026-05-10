// AliasQueueAdapter contract test (DT-11〜DT-14)
// 03a 本体実装に依存せず interface 契約のみを固定する。
// fake adapter は vi.fn() のみで構成し、D1 / fetch は一切使わない。

import { describe, expect, it, vi } from "vitest";
import {
  GeneratedManifestResolver,
  defaultMetadataResolver,
  type AliasQueueAdapter,
} from "../metadata";

describe("AliasQueueAdapter contract", () => {
  it("DT-11: dryRun success — adapter から resolvedKey が返る", async () => {
    const adapter: AliasQueueAdapter = {
      dryRunAlias: vi
        .fn<AliasQueueAdapter["dryRunAlias"]>()
        .mockResolvedValue({ ok: true, resolvedKey: "future_key_v2" }),
    };
    const resolver = new GeneratedManifestResolver({ aliasAdapter: adapter });
    const result = await resolver.getAliasAdapter()!.dryRunAlias("future_key");
    expect(result).toEqual({ ok: true, resolvedKey: "future_key_v2" });
    expect(adapter.dryRunAlias).toHaveBeenCalledWith("future_key");
  });

  it("DT-12: dryRun failure — adapter が { ok:false, reason } を返した場合に伝搬", async () => {
    const adapter: AliasQueueAdapter = {
      dryRunAlias: vi
        .fn<AliasQueueAdapter["dryRunAlias"]>()
        .mockResolvedValue({ ok: false, reason: "no_alias_found" }),
    };
    const resolver = new GeneratedManifestResolver({ aliasAdapter: adapter });
    const result = await resolver.getAliasAdapter()!.dryRunAlias("bad_key");
    expect(result).toEqual({ ok: false, reason: "no_alias_found" });
  });

  it("DT-13: unknownStableKey transit — manifest 未定義 key で resolver は unknownStableKey を返し adapter は dryRun 用フックとして観測可能", async () => {
    const adapter: AliasQueueAdapter = {
      dryRunAlias: vi
        .fn<AliasQueueAdapter["dryRunAlias"]>()
        .mockResolvedValue({ ok: true, resolvedKey: "x_resolved" }),
    };
    const resolver = new GeneratedManifestResolver({ aliasAdapter: adapter });

    // manifest 未定義 stableKey は resolver から unknownStableKey で返る (現 baseline 仕様)。
    const r = resolver.resolveSectionKey("totally_unknown_z");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("unknownStableKey");
    }

    // adapter は注入経由で取得でき、dryRun に同じ key を渡すと resolved がパスする (transit 経路の契約)。
    const transit = await resolver.getAliasAdapter()!.dryRunAlias("totally_unknown_z");
    expect(transit).toEqual({ ok: true, resolvedKey: "x_resolved" });
    expect(adapter.dryRunAlias).toHaveBeenCalledWith("totally_unknown_z");
  });

  it("DT-14: adapter 未注入時 — defaultMetadataResolver で adapter は undefined", () => {
    expect(
      (defaultMetadataResolver as GeneratedManifestResolver).getAliasAdapter?.(),
    ).toBeUndefined();
    const r = defaultMetadataResolver.resolveSectionKey("totally_unknown_w");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unknownStableKey");
  });
});
