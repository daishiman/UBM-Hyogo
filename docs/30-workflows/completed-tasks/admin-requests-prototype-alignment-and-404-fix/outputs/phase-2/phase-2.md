# Phase 2 — 設計

> Phase 1 の AC / Inventory を満たすための topology / lane / validation path を確定する。

---

## 1. 404 原因の論理絞り込み（静的解析確定分）

`apps/api/src/index.ts:255-288` の `app.route("/admin", ...)` 順序と `apps/api/src/routes/admin/requests.ts:238-301` を突合した結果:

| H | 仮説 | 静的解析結論 |
|---|------|--------------|
| H1 | staging bundle 欠落 | **要 staging 実機確認**（Phase 5 で curl + `wrangler deployments list` で確定） |
| H2 | cookie domain mismatch で auth が api worker に届かない | `require-admin.ts` は cookie 不在で 401 / 不適格で 403 を返す → **404 にはならない**。除外 |
| H3 | mount 衝突 / 順序問題 | `app.route("/admin", ...)` は Hono が trie ベースで OR 解決。先行 route に `/requests` を吸う handler は存在しない（`adminMembersRoute`=`/members/*` 等で path 違い）→ **除外** |
| H4 | `fetchAdmin` 側で fetch 失敗を 404 に丸めている | `server-fetch.ts` の throw は `failed: ${res.status}` のテンプレなので **真の HTTP status**。除外 |

**結論**: 残る候補は H1（staging bundle drift）。Phase 5 で **`curl https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/requests?...`** を Bearer JWT 付きで叩き、

- 真に 404 → bundle drift → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` で復旧
- 200 / 401 / 403 → 別経路の問題 → web→api 間 URL ルーティング drift（`INTERNAL_API_BASE_URL` 値や `apps/web` 経由の余計な path prefix を疑う）

を判定する。

---

## 2. Task A 設計（API 404 修正）

### topology

```
[browser] → apps/web (Workers) [Server Component]
              ↓ fetchAdmin  
              ↓ INTERNAL_API_BASE_URL = https://ubm-hyogo-api-staging.daishimanju.workers.dev
              ↓ Cookie forward (__Secure-authjs.session-token)
              ↓
            apps/api (Workers) /admin/requests
              ↓ requireAdmin (JWT verify via AUTH_SECRET)
              ↓ writeTagNoteProviderMiddleware
              ↓ adminRequestsRoute GET /requests handler
              ↓ D1: SELECT from member_notes WHERE noteType=? AND requestStatus=?
              ↓
            { ok: true, items, nextCursor, appliedFilters }
```

### 修正アルゴリズム（決定木）

```
1. staging に curl で 404 再現
   ├─ 404 → 2 へ
   └─ 200/401/403 → 5 へ
2. staging api worker の deployments 確認
   ├─ requests route を含む commit が deploy 済 → 3 へ
   └─ deploy なし → 4 へ
3. wrangler tail で request handler の dispatch trace を確認
   ├─ どの handler にも届かず 404 → mount path drift。`apps/api/src/index.ts` の order を見直し
   └─ 別 handler に吸われている → conflict 解消（本タスクスコープではない可能性大）
4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` で deploy
5. apps/web 側の `INTERNAL_API_BASE_URL` を確認、必要なら fix
```

### 変更点候補

| 変更 | 条件 | 内容 |
|------|------|------|
| `apps/api` redeploy | 結論 = bundle drift | code 変更なし、deploy のみ |
| `apps/web/wrangler.toml` `INTERNAL_API_BASE_URL` 修正 | URL drift 検出時 | staging worker name と一致 |
| `apps/api/src/index.ts` mount 順序整理 | conflict 検出時 | mount 順を adjust |
| `apps/api/src/routes/admin/requests.spec.ts` 新規 | regression guard 不変 | route mount + 200 path を保証 |

### regression vitest spec 設計

`apps/api/src/routes/admin/requests.spec.ts`（既存ファイルがあれば追記、なければ新規）:

```ts
describe("admin requests route mount", () => {
  it("GET /admin/requests returns 200 with valid admin auth", async () => {
    // 既存の test harness（app.fetch with x-internal-auth or Bearer）を使う
    // Expected: { ok: true, items: [], nextCursor: null, appliedFilters: {...} }
  });
  
  it("returns 401 when no auth token provided", async () => { /* ... */ });
  it("returns 403 when token is non-admin", async () => { /* ... */ });
  it("validates ?type= as enum", async () => { /* status 400 */ });
});
```

実行: `pnpm --filter @repo/api test -- requests`

---

## 3. Task B 設計（UI プロトタイプ整合）

### 既存構造 → 目標構造の diff

**現状** (`page.tsx`):
```tsx
return (
  <>
    <Breadcrumb items={[{ label: "依頼キュー" }]} />
    <RequestQueuePanel initial={data} type={type} />
  </>
);
```

**目標** (`page.tsx`):
```tsx
return (
  <div className="page-enter stack-lg">
    <Breadcrumb items={[{ label: "依頼キュー" }]} />
    <header className="page-head">
      <p className="eyebrow">ADMIN / REQUESTS</p>
      <h1>依頼キュー</h1>
      <p className="lede">公開状態の変更依頼・退会依頼を確認・承認します。</p>
    </header>
    <RequestQueuePanel initial={data} type={type} />
  </div>
);
```

**現状** (`RequestQueuePanel.tsx`):
```tsx
<section aria-labelledby="admin-requests-h">
  <h1 id="admin-requests-h">依頼キュー</h1>
  <div role="group" aria-label="依頼種別">...</div>
  <div className="admin-requests-grid">
    <ul>...</ul>
    <RequestQueueDetail .../>
  </div>
</section>
```

**目標** (`RequestQueuePanel.tsx`):
```tsx
<section className="stack-lg" aria-labelledby="admin-requests-h">
  {/* page.tsx が h1 を持つので h2 へ降格、または aria 紐付け維持しつつ visually-hidden */}
  <div className="card card-pad">
    <h2 className="h-section" id="admin-requests-h">依頼種別</h2>
    <div className="btn-row" role="group" aria-label="依頼種別">
      {/* aria-pressed のフィルターボタン */}
    </div>
  </div>
  {toast && <p role="status" className="card card-pad-sm">{toast}</p>}
  <div className="admin-requests-grid">
    <div className="card card-pad-lg">
      <h3 className="h-card">依頼一覧</h3>
      <ul>...</ul>
      {/* Pagination */}
    </div>
    <RequestQueueDetail .../>
  </div>
  <RequestConfirmDialog .../>
</section>
```

**`RequestQueueDetail.tsx`**:
- 外側 wrapper を `<aside className="card card-pad-lg">` に。
- 詳細見出しを `<h3 className="h-card">`。
- 承認 / 却下ボタン群を `<div className="btn-row">` でまとめる。
- 空状態は `<div className="card-flat"><EmptyState .../></div>`。

### Playwright visual spec 設計

`apps/web/playwright/tests/visual/admin-staging.spec.ts` に追加:

```ts
test("admin requests page renders with prototype primitives", async ({ page }) => {
  await page.goto("/admin/requests?type=visibility_request");
  await expect(page.locator(".page-head h1")).toHaveText("依頼キュー");
  await expect(page).toHaveScreenshot("admin-requests.png", {
    maxDiffPixelRatio: 0.02,
  });
});
```

`admin-staging-visual` project の `playwright.config.ts` testMatch / snapshotPathTemplate には変更不要（既存 admin-staging.spec.ts に同居）。

---

## 4. lane（並列実行設計）

| lane | 責務 | 依存 |
|------|------|------|
| Lane-A | Task A: API route 確認 + regression spec 追加 + staging redeploy（必要時） | 独立 |
| Lane-B1 | Task B1: page.tsx + RequestQueuePanel primitive 適用 | 独立 |
| Lane-B2 | Task B2: RequestQueueDetail + RequestConfirmDialog primitive 適用 | 独立 |
| Lane-B3 | Task B3: Playwright admin-staging-visual に `/admin/requests` baseline 追加 | B1 / B2 完了後 |

Phase 5（実装）では Lane-A / B1 / B2 を並列、B3 は直列で last。

---

## 5. validation path

| 段階 | コマンド | 期待 |
|------|---------|------|
| static | `pnpm typecheck` | green |
| static | `pnpm lint` | green |
| unit | `pnpm --filter @repo/api test -- requests` | green（新 spec 含む） |
| build | `pnpm --filter web build` | green |
| runtime（手動） | staging `curl /admin/requests?...` with Bearer JWT | 200 |
| visual | Playwright `admin-staging-visual` project | green（baseline 採取 + diff 0） |

---

## 6. リスクと縮約

| リスク | 縮約策 |
|--------|--------|
| staging deploy が permission gated | user 明示承認下で `bash scripts/cf.sh deploy` を実行（CONST_002 準拠） |
| Playwright baseline が Linux と macOS で異なる | `-linux.png` を正本とする既存ルール踏襲（aiworkflow lessons L-I902） |
| 既存 `admin-requests-grid` CSS が tokens.css 外なら token 化が必要 | Phase 5 冒頭で grep 確認、token 不在なら既存 grid class を温存し新 token は足さない |
