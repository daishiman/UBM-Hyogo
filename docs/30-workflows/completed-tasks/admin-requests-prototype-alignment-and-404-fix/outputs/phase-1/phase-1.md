# Phase 1 — 要件定義

> `/admin/requests` の UI/UX プロトタイプ整合 + staging `ADMIN_FETCH_404` 修正を 1 サイクルで完結させるための AC / inventory / 命名規則 / scope 固定。

---

## 1. P50 前提確認

| 項目 | 状態 | 対応 |
|------|------|------|
| current branch に実装存在 | あり（`RequestQueuePanel.tsx` / `apps/api/src/routes/admin/requests.ts` 既存） | 差分修正で進む |
| upstream マージ済み | dev に上流既存 | base=dev で派生 |
| 前提タスク完了 | 親 `admin-ui-prototype-alignment` Task A〜D 完了済 | 依存解消不要 |

**implementation_mode**: `new`（UI 整合と API 404 修正の両方でコード差分発生）。

---

## 2. タスク分類

| 軸 | 区分 |
|----|------|
| UI / docs | UI task（VISUAL — 管理画面 primitive 整合） |
| visual_mode | VISUAL（admin-staging-visual project に `/admin/requests` を追加） |
| sub-task | Task A（API 404 修正・apps/api 内）/ Task B（UI 整合・apps/web 内） |
| canonical naming | TS / TSX = camelCase、ファイル = kebab-case、CSS = OKLch design tokens（`tokens.css`） |

---

## 3. 受入条件（Acceptance Criteria）

### AC-1 — API 404 復旧
- staging `/admin/requests?status=pending&type=visibility_request` が 200 を返す。
- `ADMIN_FETCH_404` が消える（page render fail せず `RequestQueuePanel` が表示される）。
- 既存 `/admin/requests/:noteId/resolve` の挙動は不変。
- 不変条件 #1（新規 endpoint 追加禁止）/ #5（D1 直接アクセス禁止）違反なし。

### AC-2 — UI プロトタイプ整合
- `/admin/requests` ページ root が `<div className="page-enter stack-lg">` 配下に置かれる。
- `page-head`（eyebrow `ADMIN / REQUESTS`、title `依頼キュー`）が他 admin 画面と同形で表示される。
- `card card-pad-lg` の中に FilterBar / Queue list / DetailDrawer が収まる。
- `btn-row` を承認/却下ボタンの container として使う。
- 空状態は `card-flat` + `EmptyState` 既存 component。
- 新 design token・新 primitive を追加しない（不変条件 #2 / #3）。

### AC-3 — Visual regression baseline
- `apps/web/playwright/tests/visual/admin-staging.spec.ts`（or 同等）に `/admin/requests` の baseline screenshot 追加。
- `admin-staging-visual` project の CI matrix で pass。

### AC-4 — Regression vitest（API）
- `apps/api` に `/admin/requests` の存在を保証する vitest spec 追加（route mount + 200 path）。
- Cookie / Bearer JWT 両方の認証経路で 200 を返すこと。
- `*.spec.ts` 命名（不変条件 #8）。

### AC-5 — DoD（Definition of Done）
- `pnpm typecheck` / `pnpm lint` green。
- `pnpm --filter @repo/api test -- requests` green。
- Playwright admin-staging-visual で `/admin/requests` snapshot 取得済み。
- CONST_002: commit / push / PR は user 明示承認後のみ。

---

## 4. Inventory

### Task A（API 404）対象ファイル

| パス | 役割 | 変更種別 |
|------|------|----------|
| `apps/api/src/routes/admin/requests.ts` | `/admin/requests` route 本体 | 確認 + 必要なら fix |
| `apps/api/src/index.ts:281` 周辺 | `app.route("/admin", adminRequestsRoute)` mount | 確認（順序 / 重複） |
| `apps/api/src/middleware/require-admin.ts` | JWT 検証 + admin gate | 確認（404 を出すパスなし） |
| `apps/web/src/lib/admin/server-fetch.ts` | `fetchAdmin` URL 組立 + cookie forward | 必要なら error code propagation 修正 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | `ADMIN_FETCH_*` code prefix | 不変 |
| `apps/web/wrangler.toml` | staging `INTERNAL_API_BASE_URL` 確認 | 確認のみ |
| `apps/api/wrangler.toml` | staging worker name 確認 | 確認のみ |
| **新規** `apps/api/src/routes/admin/requests.spec.ts` 内 mount/200 case 追加 | regression guard | 追加 |

### Task B（UI 整合）対象ファイル

| パス | 役割 | 変更種別 |
|------|------|----------|
| `apps/web/app/(admin)/admin/requests/page.tsx` | Server Component | wrapper を `page-enter stack-lg` + `page-head` に整形 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | Queue list + detail container | primitive 適用（`card card-pad-lg` / `h-section` / `btn-row`） |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | Detail pane | `card-flat` + `h-card` 適用 |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 確認 dialog | primitive 整合（btn-row 適用） |
| `apps/web/playwright/tests/visual/admin-staging.spec.ts` | visual project | `/admin/requests` シナリオ追加 |
| `apps/web/playwright/_helpers/admin-storage-state.ts`（既存） | storage state | 不変（再利用） |

---

## 5. 既存命名規則の記録

| 領域 | 規則 |
|------|------|
| Hono ハンドラー関数 | camelCase（`createAdminRequestsRoute`） |
| Server Component file | `page.tsx` 固定（App Router） |
| Client Component file | PascalCase（`RequestQueuePanel.tsx`） |
| primitive class | kebab-case（`page-enter` / `card-pad-lg` / `h-section`） |
| design token | `--color-*` / `--space-*` OKLch（`tokens.css`） |
| vitest spec | `*.spec.ts`（不変条件 #8） |
| Playwright spec | `*.spec.ts` |

---

## 6. スコープ（CONST_007 — 1 サイクル）

### 含む

- Task A: `/admin/requests` 404 の root cause 特定 + 修正 + regression vitest。
- Task B: page.tsx + RequestQueuePanel.tsx + RequestQueueDetail.tsx + RequestConfirmDialog.tsx の primitive 適用 + Playwright visual baseline。

### 含まない（明示）

- 新 API endpoint 追加（不変条件 #1）。
- D1 schema 変更（不変条件 #5）。
- 新 design token / 新 primitive 追加（不変条件 #2 / #3）。
- 通知 / outbox 挙動変更（不変条件 #4）。
- resolve flow の挙動変更（既存仕様温存）。

---

## 7. リスクと仮説（Phase 2 へ引き継ぐ調査項目）

| ID | 仮説 | Phase 2 で確定する事項 |
|----|------|------------------------|
| H1 | 404 の root cause = staging api worker bundle に `requests` route が未含有 | staging deploy log / `wrangler deployments list` で最新 bundle に含まれるか確認 |
| H2 | 404 の root cause = cookie domain mismatch で `__Secure-authjs.session-token` が api worker へ届かず別 handler に落ちる | staging request trace / `fetchAdmin` の cookie header dump |
| H3 | 404 の root cause = `app.route("/admin", adminRequestsRoute)` の mount 順 / 他 admin route との path 衝突 | `apps/api/src/index.ts` 全 mount 列挙 + Hono dispatcher 挙動確認 |
| H4 | UI 側で `safeServerFetch` の error code が真の HTTP 404 ではなく fetch 失敗を 404 に丸めている | `server-fetch.ts` の throw path 全列挙 |

Phase 2 は **H3 / H4 を先に静的解析で潰し、H1 / H2 を staging deploy 確認で決める** 順序。

---

## 8. 不変条件チェックリスト（実装後検証）

- [ ] 不変条件 #1: 新規 API endpoint 追加なし。
- [ ] 不変条件 #2: `tokens.css` 改変なし、HEX 直書きなし。
- [ ] 不変条件 #3: `claude-design-prototype` primitive 群のみ使用。
- [ ] 不変条件 #5: D1 binding は `apps/api` 内のみ。
- [ ] 不変条件 #8: 新規 test は `*.spec.{ts,tsx}` のみ。
- [ ] 不変条件 #9: admin form input は `FormField` 経由（本タスクでは新規 form 追加なし）。
- [ ] 不変条件 #10: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（既に準拠）。
