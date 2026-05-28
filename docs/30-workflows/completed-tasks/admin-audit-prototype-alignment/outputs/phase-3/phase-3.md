# Phase 3: テスト設計

> workflow: admin-audit-prototype-alignment

## 3.1 テストレイヤと責務

| レイヤ | 対象 | フレームワーク | 配置 |
|--------|------|----------------|------|
| Unit (web) | `AuditLogPanel` の primitive 化レンダリング + PII masking 不変 | Vitest + Testing Library | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` |
| Unit (web) | `safe-server-fetch` の 404 reason 分岐 | Vitest | `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` |
| Page (web) | `page.tsx` の searchParams 反映 + `AdminPageHeader` 描画 | Vitest + Testing Library | `apps/web/app/(admin)/admin/audit/page.page.spec.ts`（既存に追記） |
| Contract (api) | `GET /admin/audit` happy path / filter / cursor / 401 | Vitest | `apps/api/src/routes/admin/audit.contract.spec.ts`（既存に追記） |
| Index spec (api) | `app.route` mount で `/admin/audit` が 200 を返す（notFound に到達しない） | Vitest | `apps/api/src/index.spec.ts`（新設または既存に追記） |
| Visual (e2e) | desktop/tablet/mobile での Linux baseline | Playwright (admin-staging-visual project) | `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts`（新設）|

## 3.2 追加 / 更新するテストケース

### 3.2.1 `AuditLogPanel.component.spec.tsx`（追記）

- `renders title via AdminPageHeader, not panel-local h1`
  - assert: `panel.querySelector("header h1")` が null（page 側 header に集約）
- `filter form renders FormField primitives for action / actorEmail / targetType / targetId / from / to / limit`
  - assert: 各 `<label>` テキスト 7 件 + `<input>` 6 件 + `<select>` 1 件
- `reset button is a Button primitive`
  - assert: `getByRole("link", { name: "リセット" })` に Button の token class が当たる
- `error banner uses Banner tone="warning" when reason includes 404`
  - assert: `getByRole("alert")` の textContent に「監査ログを読み込めませんでした」+ recovery hint 行を含む
- `PII masking is preserved for actorEmail / before-after JSON`（既存テスト維持確認）

### 3.2.2 `safe-server-fetch.spec.ts`（追記）

- `404 response surfaces ADMIN_FETCH_404 reason`
  - `fetchAdmin` をモックして 404 throw → `safeServerFetch` の `ok=false` + `error.code === "ADMIN_FETCH_404"` を assert
- `5xx response surfaces ADMIN_FETCH_5xx reason`

### 3.2.3 `audit.contract.spec.ts`（追記）

- 既存 happy/filter/cursor/401/400 ケースを保持
- 追加: `mounted via app.route("/admin", adminAuditRoute) returns 200 for /admin/audit?limit=1`
  - 直接 `createAdminAuditRoute()` を `new Hono().route("/admin", ...)` で wrap して fetch する route-mount 回帰

### 3.2.4 `apps/api/src/index.spec.ts`（新設または更新）

- `GET /admin/audit?limit=1 returns 401 (auth missing) instead of 404`
  - root app をそのまま使い、`requireAdmin` に到達することを confirm（401 = mount ok）

### 3.2.5 Playwright admin-staging-visual audit spec（新設）

- `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts`
  - `desktop` / `tablet` / `mobile` の 3 viewport で `/admin/audit` ログイン済み screenshot
  - `snapshotPathTemplate` は admin-visual の規約に従う（既存 `admin-staging-visual` project 設定を使用）
  - baseline 取得は Linux CI で別途実行（baseline 自体は本 PR では生成しない、user-gated）

## 3.3 既存テストの保護（回帰）

- `AuditLogPanel.component.spec.tsx` の既存 PII masking ケースを削除しない
- `audit.contract.spec.ts` の既存 cursor / 400 / 401 ケースを削除しない
- `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-admin-audit-{desktop,tablet,mobile}-visual-full-chromium-*-linux.png` は今回 visual 整備で baseline 差し替えが発生するため、admin-staging-visual 経路を新設したうえで legacy full-visual baseline は別 wave で扱う（本 task では full-visual baseline 更新は user-gated・後続）

## 3.4 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter web test -- src/lib/admin/__tests__/safe-server-fetch.spec.ts
mise exec -- pnpm --filter web test -- app/\(admin\)/admin/audit/page.page.spec.ts
mise exec -- pnpm --filter api test -- src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter api test -- src/index.spec.ts
# Playwright admin-staging-visual（baseline 取得は user-gated）
# mise exec -- pnpm exec playwright test --project=admin-staging-visual admin-audit
```

## 3.5 DoD（Definition of Done）— Phase 3 観点

- 全 unit / contract / index spec が green
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` green
- `pnpm verify:tokens`（`scripts/verify-design-tokens.ts`）または `pnpm --filter web verify-design-tokens` の audit 関連 grep gate（HEX / bg-[#] / text-[#]）に audit 関連で 0 件
- staging URL `/admin/audit?limit=50` を admin セッションで開いて 200 が返り、UI が prototype design language で表示される（user-gated 検証）
