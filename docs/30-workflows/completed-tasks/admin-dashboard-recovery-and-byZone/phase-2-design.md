# Phase 2 — Design

[実装区分: 実装仕様書]

## 2.1 404 原因切り分け (修正方針確定の前段)

`apps/api/src/routes/admin/dashboard.ts:49` の `app.get("/dashboard")` は `apps/api/src/index.ts:263` の `/admin` prefix mount により `GET /admin/dashboard` として resolve するのが正。staging で 404 となる原因候補は以下 3 件で、Phase 5 の最初に切り分け手順を踏んでから 1 系統のみ修正する。

| Hypothesis | 観察方法 | 期待差 / 確定根拠 |
|------------|----------|-------------------|
| **H1**: 環境変数 (`INTERNAL_API_BASE_URL` 未設定 → `127.0.0.1:8787` のまま staging で resolve 失敗) | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で web Worker log の URL が `127.0.0.1:8787` か | URL が localhost のままなら `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` の設定漏れ |
| **H2**: cookie / auth 転送失敗 → `requireAdmin` で 401 → `safeServerFetch` の `normalizeError` で 404 にマスク (要確認) | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で同 path に `401` が記録されるか | 401 が記録されていれば cookie / `x-internal-auth` ヘッダ伝搬が原因。`apps/web/src/lib/admin/server-fetch.ts` の `(await cookies()).toString()` 出力が空でないか確認 |
| **H3**: route prefix 解釈の bundle ずれ (`@opennextjs/cloudflare` での `(admin)` group prefix) | web Worker log の fetch URL が `/admin/dashboard` か `/dashboard` か確認 | path が `/dashboard` 等になっていれば `apps/web/src/lib/admin/server-fetch.ts` の `path` 引数 / `resolveApiBase()` 組み立てに bug |

> **要確認 / 未確認事項**: 401 を `safeServerFetch` が 404 にマスクしている事実は未確認。`normalizeError` は status code をそのまま `ADMIN_FETCH_${status}` に正規化する設計なので、ログ上の `404` が実 status 404 か別事象かは wrangler tail で確定する必要がある。**Phase 5.1 完了まで H1 以外のコード修正に着手しない**。

### 修正方針 (切り分け結果に従い 1 系統のみ採用)

- **H1 該当**: `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `INTERNAL_API_BASE_URL = "https://<api-host>"` を追加。`INTERNAL_AUTH_SECRET` も staging secret 投入確認 (`bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging`)。
- **H2 該当**: `apps/web/src/lib/admin/server-fetch.ts` の cookie 転送が staging で空になっていないか確認。worker-to-worker では Auth.js cookie がそのまま転送できる必要があり、`requireAdmin` middleware (`apps/api/src/middleware/require-admin.ts`) の cookie 解釈と齟齬がないか読み合わせる。
- **H3 該当**: `safeServerFetch<AdminDashboardView>("/admin/dashboard")` の path 引数を確認の上、`fetchAdmin` の `url = ${resolveApiBase()}${path}` が `https://<api-host>/admin/dashboard` に組み上がることを Phase 5 で unit test 化 (T-B-04)。

## 2.2 `byZone` API 拡張仕様 (方針 A: 推奨)

### 2.2.1 shared zod schema 拡張

現行: `apps/web/src/lib/admin/admin-dashboard-ui.ts` が `byZone` / `byStatus` を shared schema 外の optional UI mapper として受けている。一方、API 側 `apps/api/src/routes/admin/dashboard.ts` は `AdminDashboardViewZ.safeParse(view)` の `.strict()` を通すため、API response に `byZone` を同梱するには shared schema 側にも optional field 追加が必要。

`packages/shared/src/zod/viewmodel.ts` の `AdminDashboardViewZ` に下記 optional field を追加する:

```ts
byZone: z
  .array(
    z.object({
      key: z.enum(["0to1", "1to10", "10to100"]),
      label: z.string().min(1),       // "0→1" など UI 表記文字列
      hint: z.string().min(1),        // "立ち上げ" / "拡大" / "組織化"
      count: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(), // 分母 (= totalMembers)
      tone: z.enum(["info", "accent", "ok"]),
    }),
  )
  .length(3)
  .optional(),
```

- `.optional()` により既存 API 経路 / 既存 fixture / 既存 vitest snapshot は破壊しない (後方互換)。
- 配列長は常に 3 件固定 (fixed 区画 3 種を欠落させない)。
- `tone` を server で固定 (`0to1=info` / `1to10=accent` / `10to100=ok`) し UI 側 mapping を 1 箇所に閉じる。

### 2.2.2 server 集計仕様

`apps/api/src/routes/admin/dashboard.ts`:

- 既存 `aggregatePublicZones(dbCtx)` を呼び、value (raw zone 文字列。"0→1" / "1→10" / "10→100" 等) を **canonical key 3 種にバケット化**。
- canonical key と表示用 label / hint / tone は server 側で固定 enum を持つ:

| raw zone value 候補 | key | label | hint | tone |
|---------------------|-----|-------|------|------|
| `0→1` / `0-1` / `0to1` | `0to1` | `"0→1"` | `"立ち上げ"` | `info` |
| `1→10` / `1-10` / `1to10` | `1to10` | `"1→10"` | `"拡大"` | `accent` |
| `10→100` / `10-100` / `10to100` | `10to100` | `"10→100"` | `"組織化"` | `ok` |
| 上記いずれにも該当しない `unknown` 行 | (捨てる) | — | — | — |

- 3 key とも 0 件でも必ず 3 件返す (UI placeholder 表示を確実にする)。
- `total` は `totals.totalMembers` を載せる (バーの分母は visible.length 相当)。
- 集計クエリは既存 `aggregatePublicZones` を再利用するため Phase 5 で **新 D1 クエリ追加なし**。

### 2.2.3 UI mapper 改修

`apps/web/src/lib/admin/admin-dashboard-ui.ts`:

- `ZoneSlice` 型をプロトタイプ準拠に再定義:

```ts
export interface ZoneSlice {
  readonly key: "0to1" | "1to10" | "10to100";
  readonly label: string;     // "0→1"
  readonly hint: string;      // "立ち上げ"
  readonly count: number;
  readonly total: number;
  readonly tone: "info" | "accent" | "ok";
}
```

- `parseZoneSlices(v)` を上記 schema に対応させる (既存 `{zone:string, count:number}` の loose 互換は破棄し、API 拡張の正規 shape のみ受け付ける)。
- API が `byZone` を返さない時は `undefined` を返し UI placeholder へ degrade (AC-B1 の 404 復旧の補助・回帰防止)。

## 2.3 `ZoneDistribution` props 再設計 (プロトタイプ準拠)

| props | 型 | 用途 |
|-------|----|------|
| `slices` | `ReadonlyArray<ZoneSlice> \| undefined` | 既存維持 |

DOM 構造 (プロトタイプ `pages-admin.jsx` L70-107 と pixel-conformant):

```jsx
<section role="img" aria-label="zone 別人数" className="ui-card ...">
  <div className="row-between">
    <div>
      <div className="eyebrow">DISTRIBUTION</div>
      <h2 className="h-section">UBM区画の分布</h2>
    </div>
    {/* 右上アイコン枠は OKLch token のみで bar-chart icon を表示 (Task A の icon registry 利用可) */}
  </div>
  <ul>
    {slices.map((s) => (
      <li key={s.key}>
        <div className="row-between">
          <div className="row">
            <Chip tone={s.tone} dot aria-hidden>{s.label}</Chip>
            <span className="small">{s.hint}</span>
          </div>
          <span className="mono">{s.count}名</span>
        </div>
        <div
          style={{ height: 8, background: "var(--ubm-color-bg)", borderRadius: 4, overflow: "hidden" }}
        >
          <div
            style={{
              height: "100%",
              width: `${(s.count / Math.max(s.total, 1)) * 100}%`,
              background: `var(--ubm-color-${s.tone})`,
              borderRadius: 4,
            }}
          />
        </div>
      </li>
    ))}
  </ul>
</section>
```

- 既存の linear-gradient 塗り分けは破棄し、**プロトタイプの `var(--ubm-color-bg)` 上に固定色 (`info`/`accent`/`ok`)** で塗る形に変更。
- color token は `apps/web/src/styles/tokens.css` で `--ubm-color-info` / `--ubm-color-accent` / `--ubm-color-ok` / `--ubm-color-bg` を expose しているか Phase 5 で確認する。未定義の場合は、本 component が直接依存する最小 alias だけを本 task 内で追加し、広域 token redesign や visual baseline 更新は行わない。
- `Chip` primitive 不在の場合は最小の `<span>` で代替し、Task A の primitive 整備に bridge する。

## 2.4 方針 B (fallback)

API を変えず web の `toAdminDashboardUi` 内で `byStatus` + member 件数から推定:

- `aggregatePublicZones` が server で動かないリスクが顕在化した時のみ採用。
- adapter response から zone が取れないため、すべて 0 件の placeholder 風 3 行を出すしかなく **プロトタイプ忠実度を満たさない**。
- 採用条件: AC-B2 が staging で確認できない、または `aggregatePublicZones` が空配列を返し続ける場合のみ。
