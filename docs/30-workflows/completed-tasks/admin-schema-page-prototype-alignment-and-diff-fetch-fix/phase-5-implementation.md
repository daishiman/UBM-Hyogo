# Phase 5: 実装手順

[実装区分: 実装仕様書]

## 変更対象ファイル一覧

| Path | 種別 | Lane | 操作 |
|------|------|------|------|
| `apps/web/app/(admin)/admin/schema/page.tsx` | source | B | 全面リライト |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | source | C | `hideInlineStats` prop 追加 + diff カード markup を `schema-field-card diff-{type}` + `Chip` 化 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | source | D | label `"schema"` → `"スキーマ"` |
| `apps/web/src/lib/admin/server-fetch.ts` | source | E | `PLAYWRIGHT_TEST=1` の `/admin/schema/diff` fixture fallback を追加 |
| `apps/web/src/styles/globals.css` | styles | B/C | schema cards / grid / stack helper を既存 OKLch token で追加 |
| `apps/web/app/(admin)/admin/schema/page.spec.tsx` | spec | E | 新規 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | spec | E | 既存 spec に追記 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | spec | E | 追記 |
| `apps/web/playwright/page-objects/AdminSchemaPage.ts` | e2e page object | E | stale `admin-schema-section` assertion を新 shell assertion へ更新 |
| `apps/web/playwright/tests/admin-pages.spec.ts` / `apps/web/playwright/tests/full-smoke.spec.ts` / `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` / `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` / `apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts` | e2e spec | E | 旧 heading / landmark を新 UI に同期 |
| `apps/api/src/routes/admin/schema.contract.spec.ts` | spec | A | 既存 `GET /schema/diff` contract を確認・維持 |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | spec doc | B | `/admin/schema` 節を新 UI 構造に同期 |

## Lane A 実行手順

1. `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` を別 terminal で起動
2. ブラウザで staging `/admin/schema` を読み込み、tail のリクエストログを観察
3. 観察結果を `outputs/phase-11/lane-a-curl-investigation.md` に記録
4. 仮説確定後、対応する修復を実施:
   - **仮説 1 (deploy 同期不全)**: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
   - **仮説 2 (env mismatch)**: `apps/web/wrangler.toml` の `[env.staging.vars]` `NEXT_PUBLIC_API_BASE_URL` を確認 → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
   - **仮説 3 (mount 順)**: `apps/api/src/index.ts:275` 前後で `app.route("/admin", adminSchemaRoute)` を schema 系より広い `/admin/*` キャッチオールより前に移動
5. regression spec を確認（既存 `apps/api/src/routes/admin/schema.contract.spec.ts` に `GET /schema/diff` 401 / 200 + items / recommendedStableKeys が存在）

### Lane A spec シグネチャ

```ts
// apps/api/src/routes/admin/schema.contract.spec.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createTestApp } from "../../../__test-helpers__/app";
import { adminSessionCookie } from "../../../__test-helpers__/auth";

describe("GET /admin/schema/diff contract", () => {
  let app: ReturnType<typeof createTestApp>;
  beforeAll(() => { app = createTestApp(); });

  it("authenticated admin gets 200 with DiffListView", async () => {
    const res = await app.request("/admin/schema/diff", {
      headers: { Cookie: await adminSessionCookie() },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body).toMatchObject({
      revisionId: expect.any(String),
      hash: expect.any(String),
      items: expect.any(Array),
    });
  });

  it("rejects unauthenticated with 401", async () => {
    const res = await app.request("/admin/schema/diff");
    expect(res.status).toBe(401);
  });
});
```

> **重要**: `*.contract.spec.ts` は D1 lane で実行される。`apps/api/vitest.d1.config.ts` の `include` を確認し、必要なら glob を維持。

## Lane B 実行手順

### `apps/web/app/(admin)/admin/schema/page.tsx` リライト後シグネチャ

```tsx
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import {
  AdminSectionCard,
  AdminSectionErrorClient,
  AdminStat,
} from "../../../../src/features/admin/components/_shared";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type { SchemaDiffListView } from "../../../../src/components/admin/SchemaDiffPanel";
import { SchemaDiffHistoryPanel } from "../../../../src/components/admin/SchemaDiffHistoryPanel";

export const dynamic = "force-dynamic";

interface SchemaRevision { revisionId: string; capturedAt: string; }
interface SchemaAliasEntry { id: string; from: string; to: string; appliedAt: string; }

interface FullDiff extends SchemaDiffListView {
  revisions?: SchemaRevision[];
  aliases?: SchemaAliasEntry[];
}

function PageHead({ eyebrow, title, description }: {
  eyebrow: string; title: string; description: string;
}) { /* ... eyebrow + h-page + muted ... */ }

function SchemaCurrentRevisionCard({ revisionId, hash, capturedAt }: {
  revisionId: string; hash: string; capturedAt: string;
}) { /* AdminSectionCard wrapper + revision metadata + active Chip */ }

function SchemaDiffStatsGrid({ items }: { items: FullDiff["items"] }) {
  // derive counts: unresolved / added / changed / removed
  // render 4 x <AdminStat />
}

function SchemaRevisionsList({ revisions }: { revisions: SchemaRevision[] | undefined }) { /* ... */ }

export default async function AdminSchemaPage() {
  const result = await safeServerFetch<FullDiff>("/admin/schema/diff");

  return (
    <>
      <Breadcrumb items={[{ label: "スキーマ" }]} />
      <PageHead
        eyebrow="ADMIN / SCHEMA"
        title="スキーマ差分のレビュー"
        description="Google フォーム最新 schema と D1 上の登録 schema を突合します。"
      />
      {!result.ok ? (
        <AdminSectionErrorClient
          sectionLabel="Schema diff"
          code={result.error.code}
          message={result.error.message}
        />
      ) : (
        <>
          <SchemaCurrentRevisionCard
            revisionId={result.data.revisionId}
            hash={result.data.hash}
            capturedAt={result.data.capturedAt ?? ""}
          />
          <SchemaDiffStatsGrid items={result.data.items} />
          <SchemaDiffPanel initial={result.data} hideInlineStats />
          <div data-testid="admin-schema-bottom-grid" className="admin-grid-2">
            <SchemaRevisionsList revisions={result.data.revisions} />
            <SchemaDiffHistoryPanel aliases={result.data.aliases} />
          </div>
        </>
      )}
    </>
  );
}
```

### 入出力

- 入力: server-side authenticated request to `GET /admin/schema/diff`
- 出力: React Server Component 描画。 失敗時は AdminSectionErrorClient 1 つのみ

## Lane C 実行手順

1. `SchemaDiffPanel.tsx` の Props 型定義に `hideInlineStats?: boolean` を追加（default false）
2. 既存の stats 行を `{!hideInlineStats && <StatsRow ... />}` で wrap
3. diff card 描画ループの root element の className に `schema-field-card diff-${item.type}` を追加（既存 className を維持しつつ append）
4. 種別バッジ（"追加"/"変更"/"削除"）を既存 `Chip` コンポーネントに置換: `<Chip tone={toneFor(item.type)}>{labelFor(item.type)}</Chip>`
5. inline style の HEX があれば tokens.css 既存 OKLch 変数に差し替え

## Lane D 実行手順

```diff
// apps/web/src/components/layout/AdminSidebar.tsx:10
- { href: "/admin/schema", label: "schema" },
+ { href: "/admin/schema", label: "スキーマ" },
```

`apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` の対応 assertion も同 commit で更新。

## ローカル実行コマンド

```bash
# 全 type & lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 該当 spec
mise exec -- pnpm --filter @ubm-hyogo/web test --run 'apps/web/app/(admin)/admin/schema/page.spec.tsx'
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/api test --run apps/api/src/routes/admin/schema.contract.spec.ts

# Playwright visual baseline (Linux baseline は CI 経由)
ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-11/screenshots mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium --update-snapshots

# tokens 違反 grep
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens

# build (OpenNext webpack)
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## DoD（Phase 5）

- 変更対象実ファイルがすべて編集済み
- `pnpm typecheck` / `pnpm lint` exit 0
- 該当 4 spec が全 PASS
- HEX 直書きの新規導入 0
- `verify-design-tokens` PASS
- Playwright baseline (`-linux.png`) は CI で生成（local は darwin baseline のみ）
- Phase 6 のテスト追加と Phase 8 のリファクタはそれぞれ後段で完了させる
