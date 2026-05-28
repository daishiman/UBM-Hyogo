# Phase 2: 設計

[実装区分: 実装仕様書]

## Lane A: API 404 修復調査

### 切り分け手順（実行順）

| Step | 手段 | 期待 | 判定 |
|------|------|------|------|
| A1 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` | `/admin/schema/diff` リクエスト到達ログ | 到達ありなら A2 / なしなら A4 |
| A2 | 認証 cookie 付きで `curl https://ubm-hyogo-api-staging.../admin/schema/diff -H "Cookie: ..."` | 200 + JSON | 200 ならクライアント側問題 / 404 なら A3 / 401 なら認証層 |
| A3 | `apps/api/src/index.ts:275` 周辺の route mount 順を確認 | `app.route("/admin", adminSchemaRoute)` が `/admin/healthz` より後ろにあるか | mount 順問題なら index.ts 整理 |
| A4 | staging deploy バージョン確認 — `wrangler deployments list` | 最新 commit が反映済み | 古いなら redeploy |
| A5 | `apps/web` 側の `safeServerFetch` base URL 解決を確認 | `getPublicFetchEnv().NEXT_PUBLIC_API_BASE_URL` が staging api を指す | 不一致なら env を staging Cloudflare Vars に修正 |

### 修復方針（順位）

1. **最有力仮説: staging deploy 同期不全**（feature ブランチ実装が staging に反映されていない）→ `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
2. **次点: API ベース URL 不一致**（web staging から api production を見ている等）→ wrangler vars 修正
3. **保険: route mount 順序**（`/admin/:tail*` 系が `/admin/schema/diff` を吸収するパターンがあれば順序入れ替え）

### 再発防止

- 既存 `apps/api/src/routes/admin/schema.contract.spec.ts` の `GET /schema/diff` **200 契約**を確認し、D1 lane の回帰として維持する
- 既存 `/admin/schema` Playwright specs / page object を新 heading / landmark へ更新し、旧 fallback DOM を前提にしない

## Lane B: page.tsx 構造リライト

### 出力 DOM ツリー（pages-admin.jsx `SchemaDiffPage` 準拠）

```
<>
  <PageHead eyebrow="ADMIN / SCHEMA" title="スキーマ差分のレビュー" description="...">

  <SchemaCurrentRevisionCard
    revisionId={diff.revisionId}
    hash={diff.hash}
    capturedAt={diff.capturedAt}
    isActive={true}
  />

  <SchemaDiffStatsGrid
    unresolved={stats.unresolved}
    added={stats.added}
    changed={stats.changed}
    removed={stats.removed}
  /> {/* grid-4 stat cards */}

  <SchemaDiffPanel initial={diff} hideInlineStats /> {/* 既存・stats のみ抑止 */}

  <div class="grid-2">
    <SchemaRevisionsList revisions={diff.revisions} />
    <SchemaAliasHistoryList aliases={diff.aliases ?? []} />
  </div>
</>
```

### 取得方針

- `safeServerFetch<SchemaDiffListView>("/admin/schema/diff")` 1 回で revisions / aliases / items を同時に取得（既存レスポンスに `revisions[]` / `aliases[]` が含まれない場合は `safeServerFetch<...>("/admin/schema/history")` を 並列追加。実装時に判断 / **追加 endpoint は呼ばないこと**）
- 取得失敗 (`!result.ok`) 時は `AdminSectionErrorClient` を `<PageHead>` 直下に配置し、CURRENT REVISION / stats / panel / grid-2 は描画しない（致命扱い）

### コンポーネント新設（page.tsx 内 file-local が標準。export 不要）

| 名称 | 位置 | 責務 |
|------|------|------|
| `PageHead` | page.tsx 内 | eyebrow + h-page + muted（既存 admin pages と同型・`_shared` から再利用可なら優先） |
| `SchemaCurrentRevisionCard` | page.tsx 内 | revisionId / hash / capturedAt / active Chip 表示 |
| `SchemaDiffStatsGrid` | page.tsx 内 | 4 つの stat（既存 `AdminStat` を 4 枚並べる）。`hideInlineStats` で SchemaDiffPanel と二重カウント防止 |
| `SchemaRevisionsList` | page.tsx 内 | 直近 N 件の revisionId + capturedAt 一覧 |
| `SchemaAliasHistoryList` | page.tsx 内 | 既存 `SchemaDiffHistoryPanel` の subset 表示 or 直接埋め込み |

> 既存 `_shared/AdminSectionCard` / `AdminStat` / `AdminTable` を最優先で再利用する。新 primitive は禁止。

## Lane C: SchemaDiffPanel の primitive 整合

### 改修箇所

`apps/web/src/components/admin/SchemaDiffPanel.tsx` の diff カード描画部:

- card root に `className="schema-field-card diff-{added|changed|removed}"` を付与
- 旧 inline color / hex を削除し、tokens.css で定義済みの OKLch class を使用
- 差分種別バッジを既存 `<Chip tone={"green"|"amber"|"red"|"cool"}>` に置換（`green=added`, `amber=changed`, `red=removed`, `cool=unresolved`）
- `hideInlineStats: boolean` prop を追加。default false（後方互換）。`true` なら panel 内の stats 行をレンダしない

### 後方互換

- prop interface は新 prop 追加のみ。既存 caller (`SchemaDiffHistoryPanel` 等) は default false で従前挙動を維持

## Lane D: AdminSidebar 表記統一

`apps/web/src/components/layout/AdminSidebar.tsx:10`:

```diff
- { href: "/admin/schema", label: "schema" },
+ { href: "/admin/schema", label: "スキーマ" },
```

既存テスト `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` の label assertion を併修。

## Lane E: 回帰テスト追加

詳細は phase-4 / phase-6 に記述。新規 4 spec ファイル:

1. `apps/web/app/(admin)/admin/schema/page.spec.tsx`（vitest, ok / error 両分岐）
2. `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` + existing admin smoke specs（visual + a11y）
3. `apps/api/src/routes/admin/schema.contract.spec.ts`（既存 contract 確認）
4. `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（hideInlineStats 分岐）

## デザイントークン参照表

| 用途 | token |
|------|------|
| page-head bg | `var(--admin-surface)` |
| revision card bg | `var(--admin-card-bg)` |
| stat ok | `var(--admin-stat-ok)` |
| stat warn | `var(--admin-stat-warn)` |
| stat danger | `var(--admin-stat-danger)` |
| stat info | `var(--admin-stat-info)` |

> 実 token 名は `apps/web/src/styles/tokens.css` で確認し、不在なら既存 `_shared` で使われている等価 token を流用（新 token を生やさない）。
