# Phase 9: テスト追加 — unit / contract

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 | 前 | 8 | 次 | 10 |
| 状態 | completed |

## 目的
`site-metadata.ts` helper の pure 関数を unit test で固定し、sitemap / robots の純粋ロジックを契約として記録する。

## 9.1 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 新規 |

> 注: CLAUDE.md 不変条件 #8 により `*.spec.ts` のみ許可、`*.test.ts` 禁止。

## 9.2 spec 内容

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as envMod from "@/lib/env";
import { buildBaseMetadata, buildPageMetadata, getSiteUrl, SITE } from "@/lib/seo/site-metadata";

describe("site-metadata", () => {
  let publicEnvSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    publicEnvSpy = vi.spyOn(envMod, "getPublicEnv");
  });
  afterEach(() => vi.restoreAllMocks());

  describe("getSiteUrl", () => {
    it("returns production URL when ENVIRONMENT=production", () => {
      publicEnvSpy.mockReturnValue({ ENVIRONMENT: "production", NEXT_PUBLIC_API_BASE_URL: "https://x" });
      expect(getSiteUrl().host).toMatch(/ubm-hyogo/);
    });
    it("returns localhost for ENVIRONMENT=local", () => {
      publicEnvSpy.mockReturnValue({ ENVIRONMENT: "local", NEXT_PUBLIC_API_BASE_URL: "http://x" });
      expect(getSiteUrl().toString()).toContain("localhost:3000");
    });
  });

  describe("buildBaseMetadata", () => {
    it("sets noindex for non-production", () => {
      publicEnvSpy.mockReturnValue({ ENVIRONMENT: "staging", NEXT_PUBLIC_API_BASE_URL: "https://x" });
      const md = buildBaseMetadata();
      expect(md.robots).toEqual({ index: false, follow: false });
      expect(md.openGraph?.siteName).toBe(SITE.name);
      expect(md.twitter?.card).toBe("summary_large_image");
    });
    it("sets index:true for production", () => {
      publicEnvSpy.mockReturnValue({ ENVIRONMENT: "production", NEXT_PUBLIC_API_BASE_URL: "https://x" });
      expect(buildBaseMetadata().robots).toEqual({ index: true, follow: true });
    });
  });

  describe("buildPageMetadata", () => {
    beforeEach(() => publicEnvSpy.mockReturnValue({ ENVIRONMENT: "local", NEXT_PUBLIC_API_BASE_URL: "http://x" }));
    it("includes title and OG image", () => {
      const md = buildPageMetadata({ title: "T", description: "D", path: "/x" });
      expect(md.title).toBe("T");
      expect((md.openGraph as any).url).toContain("/x");
      expect(md.twitter?.card).toBe("summary_large_image");
    });
    it("supports twitterCard override to summary", () => {
      const md = buildPageMetadata({ title: "T", path: "/x", twitterCard: "summary" });
      expect(md.twitter?.card).toBe("summary");
    });
  });
});
```

## 9.3 sitemap / robots の contract test 検討
- `sitemap.ts` / `robots.ts` は Next.js が直接呼ぶため、unit test では `default export` を import して mock fetch で実行する
- スコープが小さいため、本サイクルでは Playwright smoke（Phase 10）で end-to-end に検証する方針とし、unit 側は helper に集中

## 9.4 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/seo
```

## 9.5 DoD
- 上記 spec 全件 PASS
- `pnpm --filter @ubm-hyogo/web typecheck` PASS（test ファイル含む）


## 実行タスク
- [ ] SEO helper の unit spec を `*.spec.ts` で追加する
- [ ] production / staging / local の metadata 分岐を固定する
- [ ] focused test と typecheck を実行する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| テスト対象 | `apps/web/src/lib/seo/site-metadata.ts` | helper unit contract |
| テスト対象 | `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 新規 unit spec |
| Test suffix rule | `CLAUDE.md` | `*.spec.*` naming invariant |


## 成果物
- `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` と focused test log


## 依存 Phase 参照
- Phase 5 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
