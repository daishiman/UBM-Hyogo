# Phase 5 — Implementation

[実装区分: 実装仕様書]

## 5.1 変更対象ファイル

| path | 変更種別 | 理由 |
|------|----------|------|
| `packages/shared/src/zod/viewmodel.ts` | edit | `AdminDashboardViewZ` に `byZone` optional 追加 |
| `apps/api/src/routes/admin/dashboard.ts` | edit | `aggregatePublicZones` 呼び出し → canonical 3 key へ bucket → response に `byZone` 同梱 |
| `apps/api/src/routes/admin/_shared/byZone.ts` | add (新規) | raw zone → key/label/hint/tone bucket 関数 `buildByZoneSlices(raw, totalMembers): ByZoneSlice[]` |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | edit | `ZoneSlice` 型再定義 + `parseZoneSlices` の shape を新仕様に揃える |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | edit | プロトタイプ準拠 DOM へ書き換え (linear-gradient → `var(--bg)` 上の固定色) |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | read-only 確認 | 404 マスク仕様の同定 (修正は H2 確定時のみ) |
| `apps/web/wrangler.toml` | edit (H1 該当時のみ) | `[env.staging.vars]` / `[env.production.vars]` に `INTERNAL_API_BASE_URL` 追加 |
| `apps/web/src/lib/admin/server-fetch.ts` | edit (H3 該当時のみ) | `resolveApiBase` の trailing-slash 正規化など |

### 新規テストファイル

| path | 種別 | 対応 AC/T |
|------|------|-----------|
| `apps/api/src/routes/admin/__tests__/dashboard-byZone.spec.ts` | unit | T-B-01 |
| `apps/api/src/routes/admin/_shared/__tests__/byZone.spec.ts` | unit | T-B-01 (pure fn) |
| `packages/shared/src/zod/__tests__/admin-dashboard-view-byZone.spec.ts` | unit | T-B-02 |
| `apps/web/src/lib/admin/__tests__/admin-dashboard-ui-byZone.spec.ts` | unit | T-B-03 |
| `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` | unit | T-B-04 (H3 回帰防止) |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` | unit | T-B-05 (H2 回帰防止) |
| `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | component (新規 or 差し替え) | T-B-06 |
| `apps/web/tests/e2e/admin-dashboard-staging.spec.ts` | playwright staging smoke | T-B-07 |

## 5.2 関数 / 型シグネチャ

### `apps/api/src/routes/admin/_shared/byZone.ts`

```ts
export type ByZoneKey = "0to1" | "1to10" | "10to100";

export interface ByZoneSlice {
  key: ByZoneKey;
  label: string;
  hint: string;
  count: number;
  total: number;
  tone: "info" | "accent" | "ok";
}

/**
 * raw zone 集計行 (`aggregatePublicZones` の返値) を canonical 3 key に正規化する。
 * 結果は必ず length=3、key 順序は `0to1` → `1to10` → `10to100` 固定。
 * unknown な raw zone 値は破棄される。
 */
export function buildByZoneSlices(
  rawRows: ReadonlyArray<{ zone: string; count: number }>,
  totalMembers: number,
): ByZoneSlice[];
```

### `apps/web/src/lib/admin/admin-dashboard-ui.ts` (差分)

```ts
export interface ZoneSlice {
  readonly key: "0to1" | "1to10" | "10to100";
  readonly label: string;
  readonly hint: string;
  readonly count: number;
  readonly total: number;
  readonly tone: "info" | "accent" | "ok";
}

export function parseZoneSlices(
  raw: unknown,
): ReadonlyArray<ZoneSlice> | undefined;
```

### `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx`

```tsx
export interface ZoneDistributionProps {
  readonly slices: ReadonlyArray<ZoneSlice> | undefined;
}
export function ZoneDistribution(props: ZoneDistributionProps): JSX.Element;
```

### shared zod 差分

```ts
// packages/shared/src/zod/viewmodel.ts
export const AdminDashboardViewZ = z
  .object({
    // ... 既存 field ...
    byZone: z
      .array(
        z.object({
          key: z.enum(["0to1", "1to10", "10to100"]),
          label: z.string().min(1),
          hint: z.string().min(1),
          count: z.number().int().nonnegative(),
          total: z.number().int().nonnegative(),
          tone: z.enum(["info", "accent", "ok"]),
        }),
      )
      .length(3)
      .optional(),
  })
  .strict();
```

## 5.3 実装手順

### Step 1: 切り分け (Phase 2.1 H1/H2/H3 確定)

```bash
# タブ1: web tail
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging
# タブ2: api tail
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
# 別タブで staging /admin を admin cookie 付きで開く
# 404 直前の log を採取 → H1 / H2 / H3 のいずれか確定 → outputs/phase-10/root-cause.md に記録
```

切り分け結果が確定するまで H1 以外のコード修正は禁止。

### Step 2: shared schema 拡張

`packages/shared/src/zod/viewmodel.ts` の `AdminDashboardViewZ` に Phase 5.2 の `byZone` field を追加。

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test
```

### Step 3: api 集計拡張

1. `apps/api/src/routes/admin/_shared/byZone.ts` を新規作成 (Phase 5.2 シグネチャ)。
2. `apps/api/src/routes/admin/dashboard.ts` で `aggregatePublicZones(dbCtx)` を呼び、結果と `totals.totalMembers` を `buildByZoneSlices` に渡し response に `byZone` を同梱。
3. test を追加 (`dashboard-byZone.spec.ts`, `_shared/__tests__/byZone.spec.ts`)。

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
```

### Step 4: web mapper / ZoneDistribution 改修

1. `apps/web/src/lib/admin/admin-dashboard-ui.ts` の `ZoneSlice` 型と `parseZoneSlices` を新 shape に揃える。
2. `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` を Phase 2.3 DOM に書き換え (linear-gradient 撤去・`var(--ubm-color-bg)` 上に `var(--ubm-color-${tone})` 塗り)。
3. test を追加 (`admin-dashboard-ui-byZone.spec.ts`, `ZoneDistribution.spec.tsx`, `server-fetch-url.spec.ts`, `safe-server-fetch-404-vs-401.spec.ts`)。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
```

### Step 5: 404 該当系統の修正 (H1 / H2 / H3 のいずれか 1 系統)

- **H1**: `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `INTERNAL_API_BASE_URL` を追加 (実 URL は staging で確認した host)。
- **H2**: `apps/web/src/lib/admin/server-fetch.ts` の cookie 転送を確認・補正。`(await cookies()).toString()` が空になっていれば原因の cookie key を補完。`apps/api/src/middleware/require-admin.ts` の cookie 解釈と読み合わせ。
- **H3**: `apps/web/src/lib/admin/server-fetch.ts` の `resolveApiBase` を正規化 (trailing slash 削除・path 結合の二重 slash 防止)。T-B-04 で URL 組み立てを assert。

### Step 6: staging deploy & AC 検証

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# AC-B1
curl -s -o /tmp/d.html -w "%{http_code}\n" -H "cookie: $ADMIN_COOKIE" "$WEB_BASE/admin"
# AC-B2 / T-B-08
curl -s -H "cookie: $ADMIN_COOKIE" "$API_BASE/admin/dashboard" | jq '.byZone | length, [.byZone[].key]'
# AC-B4 / T-B-07
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/admin-dashboard-staging.spec.ts
```

## 5.4 副作用・エラーハンドリング

- `buildByZoneSlices` は pure function。例外を throw しない (unknown 入力は無視)。
- `aggregatePublicZones` の throw は既存 `dashboard.ts` の try/catch でハンドル済み。`byZone` 追加で新規 catch を増やさない。
- `parseZoneSlices` は parse 失敗時 `undefined` を返す (UI placeholder へ degrade)。throw しない。
- `ZoneDistribution` は `slices === undefined` のとき placeholder 描画。空配列 (`length=0`) は仕様上発生しないが、安全側として placeholder 扱い。

## 5.5 ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

## 5.6 DoD (Phase 5 単体)

- [ ] H1/H2/H3 のいずれかが Step 1 で確定し `outputs/phase-10/root-cause.md` に記録
- [ ] `AdminDashboardViewZ` に `byZone` optional 追加 (`pnpm --filter shared test` green)
- [ ] `_shared/byZone.ts` 新規・`dashboard.ts` 拡張 (`pnpm --filter api test` green)
- [ ] `ZoneSlice` / `parseZoneSlices` / `ZoneDistribution` 改修 (`pnpm --filter web test` green)
- [ ] 該当 1 系統 (H1/H2/H3) の修正のみが diff に含まれる (他系統への先行 fix なし)
- [ ] staging deploy 後 AC-B1 / AC-B2 が pass
