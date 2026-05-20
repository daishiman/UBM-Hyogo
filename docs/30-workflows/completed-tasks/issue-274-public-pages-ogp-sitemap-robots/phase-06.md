# Phase 6: 実装 — Metadata Routes (sitemap / robots)

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 | 前 | 5 | 次 | 7 |
| 状態 | completed |

## 目的
`apps/web/app/sitemap.ts` と `apps/web/app/robots.ts` を新規実装する。

## 6.1 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/lib/seo/site-metadata.ts` | 新規（helper 部分のみ Phase 6 で先行） |
| `apps/web/app/sitemap.ts` | 新規 |
| `apps/web/app/robots.ts` | 新規 |

## 6.2 実装手順

### Step 1: `apps/web/src/lib/seo/site-metadata.ts` の helper 部分を先行作成

```ts
// apps/web/src/lib/seo/site-metadata.ts
import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/env";

export const SITE = {
  name: "UBM 兵庫支部会",
  shortName: "UBM Hyogo",
  description: "兵庫を拠点に活動する UBM 支部会のメンバーディレクトリと活動紹介",
  ogImagePath: "/opengraph-image",
  locale: "ja_JP",
} as const;

const SITE_URL_MAP: Record<string, string> = {
  production: "https://ubm-hyogo.daishimanju.workers.dev",
  staging: "https://ubm-hyogo-staging.daishimanju.workers.dev",
  local: "http://localhost:3000",
};

export function getSiteUrl(): URL {
  const env = getPublicEnv();
  return new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
}

// Phase 7 で buildBaseMetadata / buildPageMetadata を追加する
```

### Step 2: `apps/web/app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export const dynamic = "force-dynamic";

interface PublicMembersResponse {
  items: Array<{ memberId: string; fullName: string }>;
  pagination: { hasNext: boolean };
  generatedAt?: string;
}

async function fetchMemberIds(): Promise<PublicMembersResponse["items"]> {
  const all: PublicMembersResponse["items"] = [];
  try {
    const env = getEnv();
    for (let page = 1; page <= 20; page += 1) {
      const url = `${env.INTERNAL_API_BASE_URL}/public/members?limit=100&page=${page}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return all;
      const json = (await res.json()) as PublicMembersResponse;
      if (Array.isArray(json.items)) all.push(...json.items);
      if (!json.pagination?.hasNext) break;
    }
    return all;
  } catch (e) {
    console.warn("[sitemap] failed to fetch /public/members", e);
    return all;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: new URL("/", base).toString(),         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: new URL("/members", base).toString(),  lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: new URL("/register", base).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  const members = await fetchMemberIds();
  const memberEntries: MetadataRoute.Sitemap = members.map((m) => ({
    url: new URL(`/members/${encodeURIComponent(m.memberId)}`, base).toString(),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  return [...staticEntries, ...memberEntries];
}
```

### Step 3: `apps/web/app/robots.ts`

```ts
import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const env = getPublicEnv();
  const base = getSiteUrl();
  if (env.ENVIRONMENT !== "production") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: new URL("/sitemap.xml", base).toString(),
    };
  }
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/members", "/members/", "/register"],
      disallow: ["/admin", "/admin/", "/profile", "/login", "/api"],
    }],
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.host,
  };
}
```

## 6.3 ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web dev &
sleep 5
curl -s http://localhost:3000/sitemap.xml | head -40
curl -s http://localhost:3000/robots.txt
```

## 6.4 DoD
- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- `/sitemap.xml` で 3 件 static + N 件 dynamic を返す（local では fetch fail → 3 件のみで OK）
- `/robots.txt` で `Disallow: /` を返す（local 起動時、ENVIRONMENT=local のため）


## 実行タスク
- [ ] `site-metadata.ts` の site URL helper を作成する
- [ ] `sitemap.ts` を static + dynamic member fallback 付きで実装する
- [ ] `robots.ts` を production / non-production 分岐で実装する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 実装対象 | `apps/web/app/sitemap.ts` | sitemap metadata route |
| 実装対象 | `apps/web/app/robots.ts` | robots metadata route |
| 実装対象 | `apps/web/src/lib/seo/site-metadata.ts` | site URL helper |


## 成果物
- `apps/web/src/lib/seo/site-metadata.ts`, `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts`


## 依存 Phase 参照
- Phase 5 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
