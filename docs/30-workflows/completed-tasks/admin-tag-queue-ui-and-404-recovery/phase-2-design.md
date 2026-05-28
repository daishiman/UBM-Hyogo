# Phase 2: Design

## アーキテクチャ

```
Browser
  └─ /admin/tags  (Next.js Server Component)
        └─ apps/web/app/(admin)/admin/tags/page.tsx
              └─ safeServerFetch<QueueListView>('/admin/tags/queue?status=...')
                    └─ apps/web/src/lib/admin/server-fetch.ts
                          └─ fetch(INTERNAL_API_BASE_URL + path, { headers: { cookie, x-internal-auth } })
                                ↓
                          apps/api  (Cloudflare Worker, Hono)
                                └─ app.route('/admin', adminTagsQueueRoute)
                                      ├─ securityHeaders / cors
                                      ├─ requireAdmin (JWT verify)  ── 401/403
                                      ├─ idempotency()              ── GET は no-op
                                      ├─ writeTagNoteProviderMiddleware
                                      └─ GET /tags/queue            ── tagQueueProvider.listQueue
```

## 404 切り分け設計

`GET /admin/tags/queue` が 404 を返しうる経路を列挙し、Web 層で識別可能にする:

| # | 経路 | 期待 status | 現状 | 対応 |
|---|------|-------------|------|------|
| 1 | apps/api 未デプロイ（route mount 不在） | 404 (Hono notFoundHandler `UBM-1404`) | `ADMIN_FETCH_404` | route mount 確認 + デプロイ |
| 2 | `INTERNAL_API_BASE_URL` が `apps/api` 以外を指す | 404 (Worker 側 not found) | `ADMIN_FETCH_404` | wrangler env 検証 + dev-only debug log |
| 3 | requireAdmin: token 無し | 401 | 想定通り | UI 側で 401 を「セッション切れ」表示に切替 |
| 4 | requireAdmin: claims.isAdmin=false | 403 | 想定通り | UI 側で 403 を「権限不足」表示に切替 |
| 5 | AUTH_SECRET 未設定 | 500 | 想定通り | UI 側で 5xx を「設定エラー」表示に切替 |

**今回の staging 観測（404）** は #1 か #2 のいずれか。`apps/api` 側ルート mount は `apps/api/src/index.ts:273` `app.route("/admin", adminTagsQueueRoute)` で正しく存在。よって最有力は **#2（staging `INTERNAL_API_BASE_URL` が誤った Worker を指す、または最新が未デプロイ）**。

## エラー細分化方針

`apps/web/src/lib/server-fetch/safe-fetch.ts` の `normalizeError` は既に `${codePrefix}_${status}` を返す。これを利用し、`AdminSectionErrorClient` の表示文を `code` ごとに分岐する:

```
ADMIN_FETCH_401 → "セッションが切れています。ログインし直してください。"
ADMIN_FETCH_403 → "この操作を行う権限がありません。"
ADMIN_FETCH_404 → "API endpoint に到達できません（INTERNAL_API_BASE_URL / route mount を確認）。"
ADMIN_FETCH_5xx → "サーバー設定に問題があります（AUTH_SECRET / 環境変数を確認）。"
```

dev / staging に限り、`apps/web/src/lib/admin/server-fetch.ts` の 404 path で `console.warn` に `INTERNAL_API_BASE_URL`（host 部のみ・credentials は出さない）を残す。production では出さない。

## UI 設計（プロトタイプ整合）

### 構造（DOM 階層）

```
<section className="page-enter">
  <PageHead eyebrow="ADMIN / TAGS" title="タグキュー" muted="...">
    <ChipRow>
      <Chip tone="warn" dot>未解決 {queuedCount}件</Chip>
      <Chip tone="ok">解決済 {resolvedCount}件</Chip>
      <Chip tone="danger">DLQ {dlqCount}件</Chip>
    </ChipRow>
  </PageHead>

  <StatusFilterChips />                       {/* 既存 contract 保持 */}
  {focusMemberId && <FocusBanner />}

  <div className="grid-2 tag-queue-grid">
    <Card padding="lg" aria-label="キュー一覧">
      <SectionHeader title="割当キュー" rightChip={`${visible.length}件`} />
      {items.length === 0 ? <EmptyState ... /> : items.map(QueueCard)}
      {resolved.length > 0 && <ResolvedSubsection items={resolved.slice(0, 4)} />}
    </Card>

    <Card padding="lg" sticky aria-label="レビューパネル">
      {!current ? <EmptyState icon="tag" title="左のキューから項目を選択してください。" />
       : <ReviewPanel current={current} tags={currentTags} onResolve={() => setDrawerOpen(true)} />}
    </Card>
  </div>

  {current && <TagsQueueResolveDrawer ... />}
</section>
```

### Primitives マッピング

| プロトタイプ要素 | 既存 apps/web primitive | 備考 |
|------------------|-------------------------|------|
| `Chip tone="warn"` | `apps/web/src/components/ui/Chip.tsx` | 既存 |
| `Avatar` | `apps/web/src/components/ui/Avatar.tsx` | 既存 |
| `EmptyState` | `apps/web/src/components/ui/EmptyState.tsx` | 既存（TagQueuePanel が既に使用） |
| `Icon name="chevronRight"` | `apps/web/src/components/ui/Icon.tsx` | 既存 |
| `page-head` / `h-page` / `eyebrow` | `apps/web/src/components/admin/PageHead.tsx`（または既存 admin primitive） | 既存 admin primitive を使用 |
| `card card-pad-lg` | `apps/web/src/components/ui/Card.tsx` ＋ size variant | 既存 |
| `grid-2` | tokens.css の grid utility | 既存 |
| sticky 右ペイン | `className` で `sticky top-5` 等（token） | tailwind / CSS module |

> 既存 primitive を実装段階で grep し（`apps/web/src/components/ui/` と `apps/web/src/components/admin/`）、無いものだけ最小限 inline する。新規 primitive を生やさない（不変条件: 既存 primitives 群で構成）。

### Status フィルタ

既存の `["", "queued", "reviewing", "resolved", "rejected", "dlq"]` chip 群を保持する。`role="group"` / `aria-pressed` も維持。プロトタイプには無いが管理画面 UX 上必要。

### TAGGED 補足セクション

- `initial.items` のうち `status === "resolved"` を取り、最大 4 件を `card-flat` の下に「解決済み」セクションとして補足表示する。
- プロトタイプの該当部分は対象配列が `tagged` だが、API 層では `resolved` queue が同義（resolve 済み = タグ割当完了）。

## 既存 contract 保持の確認

- `Props { initial, filter, focusMemberId }` シグネチャは据え置き。
- `data-testid="admin-tag-queue-list"` / `data-testid="admin-tag-review-panel"` を保持（既存 Playwright spec 互換）。
- `aria-labelledby="tag-queue-h"` / `<h1 id="tag-queue-h">` を維持。

## DoD（Phase 2 完了条件）

- 404 経路 #1〜#5 の切り分けマトリクスが存在する
- UI primitive マッピング表が既存ファイルパスを指している
- 既存 contract（props / data-testid / aria）破壊なし
