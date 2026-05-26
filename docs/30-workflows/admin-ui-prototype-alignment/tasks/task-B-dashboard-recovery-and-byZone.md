[実装区分: 実装仕様書]

# Task B — `/admin` ダッシュボード 404 復旧 + `byZone` 区画分布 supply

| 項目 | 値 |
|------|-----|
| 親 workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| Branch | `feat/admin-ui-prototype-alignment` |
| 単一責務 | `/admin` の ADMIN_FETCH_404 を根本原因切り分けの上で復旧し、プロトタイプ準拠の `byZone`（区画 0→1 / 1→10 / 10→100）分布を表示できる形で **既存 `/admin/dashboard` endpoint の response を拡張**する |
| スコープ外 | layout / sidebar / topbar slot (Task A) / 他 9 画面の AdminPageHeader 統一 (Task C) / 出席分析 (Task D) / visual baseline 再生成 (Task E) |
| 不変条件再確認 | #5 D1 は apps/api に閉じる / 新 endpoint 禁止（既存 endpoint の response 拡張は scope 内）/ OKLch token 正本 / プロトタイプ正本順位 |

---

## Phase 1 — Requirements (ゴール / AC / 非機能)

### 1.1 ゴール
1. staging `/admin` を render したとき AdminSectionError ではなく **DashboardSections が 200 で表示**される
2. `<ZoneDistribution>` がプロトタイプ準拠の 3 行 (0→1 立ち上げ / 1→10 拡大 / 10→100 組織化) を、進捗バーの高さ 8px・`var(--bg)` 上に `info`/`accent`/`ok` で塗り分けて描画する
3. KPI 4 種 (totalMembers / publicMembers / untaggedMembers / unresolvedSchema) と Status 分布 / RecentActions / SchemaAlertCard が引き続き 1 fetch (`GET /admin/dashboard`) で揃う

### 1.2 Acceptance Criteria

| ID | 検証方法 | 期待 |
|----|----------|------|
| AC-B1 | staging で admin cookie 付きの `curl -s -o /tmp/d.json -w "%{http_code}" $WEB_BASE/admin` を実行 | HTTP 200 / response 本文に `admin api /admin/dashboard failed: 404` 文字列が含まれない |
| AC-B2 | staging で admin cookie 付きの `curl -s $API_BASE/admin/dashboard \| jq '.byZone \| length'` | `3`（key=`0to1`/`1to10`/`10to100`） |
| AC-B3 | `AdminDashboardViewZ.safeParse(response).success` が true（byZone は optional 拡張・既存 consumer 後方互換） |
| AC-B4 | playwright smoke で `/admin` を開き `getByRole('img', { name: /zone 別人数/ })` と `getByRole('region', { name: /KPI/ })` がいずれも visible |
| AC-B5 | プロトタイプ `pages-admin.jsx` L80-93 と DOM 比較で、各 zone 行が `Chip (tone=zoneTone) + label + count(mono) + bar(8px)` の構造に一致 |
| AC-B6 | `verify-design-tokens` が pass（HEX 直書き / `bg-[#xxx]` を `ZoneDistribution.tsx` に追加していない） |
| AC-B7 | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test` / `pnpm --filter @ubm-hyogo/web test` 全 green |

### 1.3 非機能
- レイテンシ: `/admin/dashboard` 集計クエリは現状 3 並列に **`aggregatePublicZones` 同等 1 件**を追加するのみ。p50 +50ms 以内に収める
- a11y: `<ZoneDistribution>` は `role="img"` + `aria-label`（既存維持）。追加の Chip は装飾要素として `aria-hidden`
- i18n: ラベルは「立ち上げ / 拡大 / 組織化」を server 側 enum で持たせず web mapper で付与（API は key+count のみ）→ 将来 i18n しやすい

---

## Phase 2 — Design

### 2.1 404 原因切り分け（修正方針確定の前段）

`apps/api/src/routes/admin/dashboard.ts:49` の `app.get("/dashboard")` は **`/admin` prefix mount (apps/api/src/index.ts:263)** で `GET /admin/dashboard` として resolve するのが正。staging で 404 となる原因候補は以下 3 つで、Phase 5 の最初に切り分け手順を踏んでから修正方針を選ぶ:

| Hypothesis | 観察方法 | 期待差 |
|------------|----------|--------|
| H1: 環境変数（`INTERNAL_API_BASE_URL` 未設定 → `127.0.0.1:8787` 解決失敗） | `wrangler tail` で web Worker から「admin api /admin/dashboard failed: 404」が出ているとき URL が `127.0.0.1:8787` か | URL が localhost のままなら `apps/web/wrangler.toml` の staging vars 設定漏れ |
| H2: cookie/auth 転送失敗 → `requireAdmin` で 401 → 404 マスク | `wrangler tail apps/api` で同 path に `401` が記録されるか確認 | 401 が記録されていれば cookie / `x-internal-auth` ヘッダ伝搬が原因 |
| H3: route prefix 解釈の bundle ずれ（`@opennextjs/cloudflare` での `(admin)` group prefix） | web Worker log で fetch URL が `/admin/dashboard` か `/dashboard` かを確認 | path が間違っていれば server-fetch.ts の `path` 引数 / `fetchAdmin` 側 base URL に bug |

> 要確認: 401 を `safeServerFetch` が 404 にマスクしている事実は **未確認**。`normalizeError` は status code をそのまま `ADMIN_FETCH_${status}` に正規化するので、ログ上の `404` が実 status 404 か別事象かを wrangler tail で確定する必要がある。

修正方針は切り分け結果に従い 1 つを選ぶ:

- **H1 該当**: `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `INTERNAL_API_BASE_URL = "https://<api-host>"` を追加。`INTERNAL_AUTH_SECRET` も同様に staging secret 投入確認
- **H2 該当**: `apps/web/src/lib/admin/server-fetch.ts` の cookie 転送 (`(await cookies()).toString()`) が staging で空になっていないか確認。worker-to-worker では Auth.js cookie がそのまま転送できる必要があり、`requireAdmin` middleware の cookie 解釈と齟齬がないか `apps/api/src/middleware/require-admin.ts` を読み合わせる
- **H3 該当**: `safeServerFetch<AdminDashboardView>("/admin/dashboard")` の path 引数を確認の上、`fetchAdmin` の `url = ${resolveApiBase()}${path}` が `https://api.example/admin/dashboard` に組み立たることを Phase 5 で unit test 化

### 2.2 `byZone` API 拡張仕様（方針 A: 推奨）

#### 2.2.1 shared zod 拡張

現行コードでは `apps/web/src/lib/admin/admin-dashboard-ui.ts` が `byZone` / `byStatus` を shared schema 外の optional UI mapper として受けている。一方、API 側 `apps/api/src/routes/admin/dashboard.ts` は `AdminDashboardViewZ.safeParse(view)` の `.strict()` を通すため、API response に `byZone` を同梱するには shared schema 側にも optional field を追加する必要がある。したがって本タスクでは `packages/shared/src/zod/viewmodel.ts` の `AdminDashboardViewZ` に optional field `byZone` を追加し、web local mapper の「API 未提供時は undefined」契約を維持する:

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

- `.optional()` により既存 API 経路 / 既存 fixture / 既存 vitest snapshot は破壊しない（後方互換）
- 配列長は常に 3 件固定（fix された区画 3 種を欠落させない）
- `tone` を server で固定（プロトタイプ準拠: `0to1=info` / `1to10=accent` / `10to100=ok`）し UI 側 mapping を 1 箇所に閉じる

#### 2.2.2 server 集計仕様

`apps/api/src/routes/admin/dashboard.ts`:

- 既存 `aggregatePublicZones(dbCtx)` を呼び、value（生 zone 文字列。"0→1" / "1→10" / "10→100" など）を **canonical key 3 種にバケット化**
- canonical key と表示用 label / hint / tone は server 側で固定 enum を持つ:

| raw zone value 候補 | key | label | hint | tone |
|----------------------|------|-------|------|------|
| `0→1` / `0-1` / `0to1` | `0to1` | `"0→1"` | `"立ち上げ"` | `info` |
| `1→10` / `1-10` / `1to10` | `1to10` | `"1→10"` | `"拡大"` | `accent` |
| `10→100` / `10-100` / `10to100` | `10to100` | `"10→100"` | `"組織化"` | `ok` |
| 上記いずれにも該当しない `unknown` 行 | （捨てる）| — | — | — |

- 3 key とも 0 件でも必ず 3 件返す（UI placeholder 表示を確実にする）
- `total` は `totals.totalMembers` を載せる（バーの分母は visible.length 相当）
- 集計クエリは既存 `aggregatePublicZones` を再利用するため Phase 5 で **新クエリ追加なし**

#### 2.2.3 UI mapper 改修

`apps/web/src/lib/admin/admin-dashboard-ui.ts`:

- `ZoneSlice` 型をプロトタイプ準拠に再定義（破壊的変更ではないが本 task の責務として置き換え）:

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

- `parseZoneSlices(v)` を上記 schema に対応させる（既存 `{zone:string,count:number}` の loose 互換は破棄し、API 拡張の正規 shape のみ受け付ける）
- API が `byZone` を返さない時は **`undefined` を返し UI placeholder へ degrade**（=AC-B1 の 404 復旧の補助・回帰防止）

### 2.3 `ZoneDistribution` props 再設計（プロトタイプ準拠）

| props | 型 | 用途 |
|-------|----|------|
| `slices` | `ReadonlyArray<ZoneSlice> \| undefined` | 既存維持 |

DOM 構造（プロトタイプ pages-admin.jsx L70-107 と pixel-conformant）:

```
<section class="ui-card ...">
  <div class="row-between">
    <div>
      <div class="eyebrow">DISTRIBUTION</div>
      <h2 class="h-section">UBM区画の分布</h2>
    </div>
    {/* 右上アイコン枠は OKLch token のみで bar-chart icon を表示 (Task A の icon registry 利用可) */}
  </div>
  <ul>
    {slices.map(s => (
      <li key={s.key}>
        <div class="row-between">
          <div class="row">
            <Chip tone={s.tone} dot>{s.label}</Chip>
            <span class="small">{s.hint}</span>
          </div>
          <span class="mono">{s.count}名</span>
        </div>
        <div style="height:8px;background:var(--ubm-color-bg);border-radius:4px;overflow:hidden">
          <div style={{ height:"100%", width:`${(count/total)*100}%`, background:`var(--ubm-color-${tone})`, borderRadius:4 }} />
        </div>
      </li>
    ))}
  </ul>
</section>
```

- 既存の linear-gradient による塗り分けは破棄し、**プロトタイプの `var(--bg)` 上に固定色 (info/accent/ok)** で塗る形に変更
- color token は `apps/web/src/styles/tokens.css` で `--ubm-color-info` / `--ubm-color-accent` / `--ubm-color-ok` を expose しているかを Phase 5 で確認し、未定義の場合は `tokens.css` に **追加せず Task E に escalate**（本 task ではブロッカーとして報告）
- `Chip` primitive 不在の場合は最小の `<span>` で代替し Task A の primitive 整備に bridge する

### 2.4 方針 B（fallback）

API を変えず web の `toAdminDashboardUi` で `byStatus` + member 件数から推定:

- `aggregatePublicZones` が server で動かないリスクが顕在化した時のみ採用
- ただし adapter response から zone が取れないため、すべて 0 件の placeholder 風 3 行を出すしかなく **プロトタイプ忠実度を満たさない**
- 採用条件: AC-B2 が staging で確認できない、または `aggregatePublicZones` が空配列を返し続ける場合のみ

---

## Phase 3 — Design Review

- 不変条件 #5（D1 access は apps/api に閉じる）: 既存 endpoint の response field 追加のみで、新 endpoint も新 D1 query 経路も増えない → 維持
- プロトタイプ正本順位: pages-admin.jsx L70-107 と Phase 2.3 の DOM 仕様を 1:1 で対応付け済
- 後方互換: `AdminDashboardViewZ` 拡張は optional・`AdminDashboardView` を import している箇所への impact なし
- OKLch token: `var(--ubm-color-info|accent|ok|bg)` のみを使用・HEX 0
- 401→404 マスクの可能性は Phase 5 で wrangler tail / unit test で確定する。確定前のコード修正は不可

---

## Phase 4 — Test Plan

| ID | 種別 | 対象 | 内容 |
|----|------|------|------|
| T-B-01 | unit (api) | `apps/api/src/routes/admin/dashboard.ts` | `byZone` が 3 key 固定で返ること（fixture: zone 値混在 / 空 / 上記範囲外） |
| T-B-02 | unit (shared) | `packages/shared/src/zod/viewmodel.ts` | `AdminDashboardViewZ` が byZone なしも byZone ありも両方 parse 成功 |
| T-B-03 | unit (web mapper) | `apps/web/src/lib/admin/admin-dashboard-ui.ts` | `parseZoneSlices` が新 shape を通し、旧 shape を undefined に落とす |
| T-B-04 | unit (web fetch) | `apps/web/src/lib/admin/server-fetch.ts` | URL 組み立てが `${resolveApiBase()}/admin/dashboard` に確実に一致（H3 回帰防止） |
| T-B-05 | unit (web safe) | `apps/web/src/lib/admin/safe-server-fetch.ts` | 404 文字列マスクが正しく `ADMIN_FETCH_404` code を返すこと（401→404 ではないことの assertion） |
| T-B-06 | component (web) | `_dashboard/ZoneDistribution.spec.tsx` | slices=3 件で `Chip+label+hint+count+bar` DOM が一致・slices=undefined で placeholder |
| T-B-07 | smoke (playwright staging) | `/admin` | 200 + `zone 別人数` aria-label visible + KPI 4 件 visible |
| T-B-08 | curl (staging) | `GET /admin/dashboard` admin cookie | `byZone` 配列長 3・各 key in enum |

> Test ファイルは `*.spec.{ts,tsx}` 拡張子で作成（不変条件 #8）

---

## Phase 5 — Implementation

### 5.1 変更対象ファイル

| path | 変更種別 | 理由 |
|------|----------|------|
| `packages/shared/src/zod/viewmodel.ts` | edit | `AdminDashboardViewZ` に `byZone` optional 追加 |
| `apps/api/src/routes/admin/dashboard.ts` | edit | `aggregatePublicZones` 呼び出し → canonical 3 key へ bucket → response に `byZone` 同梱 |
| `apps/api/src/routes/admin/_shared/byZone.ts`（新規） | add | raw zone → key/label/hint/tone bucket 関数 `buildByZoneSlices(raw, totalMembers): ByZoneSlice[]` |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | edit | `ZoneSlice` 型再定義 + `parseZoneSlices` の shape を新仕様に揃える |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | edit | プロトタイプ準拠 DOM へ書き換え |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | （read-only 確認） | 404 マスク仕様の同定（修正は H2 確定時のみ） |
| `apps/web/wrangler.toml` | edit（H1 該当時のみ） | staging/production `[env.*.vars]` に `INTERNAL_API_BASE_URL` 追加 |
| `apps/web/src/lib/admin/server-fetch.ts` | edit（H3 該当時のみ） | `resolveApiBase` の trailing-slash 正規化追記など |

### 5.2 シグネチャ

```ts
// apps/api/src/routes/admin/_shared/byZone.ts
export type ByZoneKey = "0to1" | "1to10" | "10to100";
export interface ByZoneSlice {
  key: ByZoneKey;
  label: string;
  hint: string;
  count: number;
  total: number;
  tone: "info" | "accent" | "ok";
}
export function buildByZoneSlices(
  rawRows: ReadonlyArray<{ zone: string; count: number }>,
  totalMembers: number,
): ByZoneSlice[]; // 必ず length=3, key 順序固定
```

```ts
// apps/web/src/lib/admin/admin-dashboard-ui.ts （差分のみ）
export interface ZoneSlice {
  readonly key: "0to1" | "1to10" | "10to100";
  readonly label: string;
  readonly hint: string;
  readonly count: number;
  readonly total: number;
  readonly tone: "info" | "accent" | "ok";
}
```

```tsx
// apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx
export interface ZoneDistributionProps {
  readonly slices: ReadonlyArray<ZoneSlice> | undefined;
}
```

### 5.3 実装手順

1. **切り分け**: `bash scripts/cf.sh tail apps/web/wrangler.toml --env staging` と `... apps/api/wrangler.toml --env staging` を 2 タブで張り、staging で `/admin` を開く。404 直前の log を採取 → H1/H2/H3 確定
2. **shared schema 拡張** → `pnpm --filter @ubm-hyogo/shared test`
3. **api 集計拡張** → `pnpm --filter @ubm-hyogo/api test`
4. **web mapper / ZoneDistribution 改修** → `pnpm --filter @ubm-hyogo/web test`
5. **環境変数修正（H1 該当時）または server-fetch 修正（H3 該当時）**
6. **staging deploy → AC-B1/B2/B7 verify**

---

## Phase 6 — Test Additions

- `apps/api/src/routes/admin/__tests__/dashboard-byZone.spec.ts`（新規）
- `packages/shared/src/zod/__tests__/admin-dashboard-view-byZone.spec.ts`（新規）
- `apps/web/src/lib/admin/__tests__/admin-dashboard-ui-byZone.spec.ts`（新規）
- `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts`（新規・H3 回帰防止）
- `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts`（新規・H2 回帰防止）
- `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx`（新規 or 既存差し替え）
- staging smoke: `apps/web/tests/e2e/admin-dashboard-staging.spec.ts`（既存 staging-visual ハーネスに 1 ケース追加）

---

## Phase 7 — Coverage

| package | 既存 threshold | 追加カバレッジ |
|---------|----------------|----------------|
| `apps/api` | 既存 lines 70% / branches 70% を維持 | `buildByZoneSlices` 100% / dashboard.ts 既存 + byZone path |
| `apps/web` | 既存 threshold を維持 | mapper + safe-server-fetch + ZoneDistribution の追加分 |

`pnpm verify:vitest-runtime` を Phase 5 着手前に 1 回実行（esbuild/arch isolation 確認）

---

## Phase 8 — Refactor

- `apps/api/src/routes/admin/_shared/byZone.ts` を `_shared` に置くことで attendance route 等から再利用可能な形にしておく（ただし本 task では reuse 強制しない）
- `ZoneSlice` 型は将来 i18n / 区画追加に備え `key` を centeralized enum として `apps/web/src/lib/admin/zone-keys.ts` に切り出すかを Phase 10 で検討（本 task では mapper 内に閉じる）

---

## Phase 9 — QA

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
# staging deploy 後
bash scripts/cf.sh whoami
curl -s -o /tmp/dash.json -w "%{http_code}\n" \
  -H "cookie: $ADMIN_COOKIE" \
  "$API_BASE/admin/dashboard"
jq '.byZone | length, [.byZone[].key]' /tmp/dash.json
# 期待: 3 / ["0to1","1to10","10to100"]
```

`verify-design-tokens` / `playwright-smoke / smoke (chromium)` も既定の required check として fail しないこと

---

## Phase 10 — Final Review

- AC-B1..B7 全 green
- プロトタイプ pages-admin.jsx L70-107 と DOM 比較で差分なし
- 不変条件 #5 維持確認（grep `apps/web/src/**` で D1 binding 直接 import がないこと）
- 404 切り分け結果（H1/H2/H3 どれだったか）を `outputs/phase-10/root-cause.md` に追記

---

## Phase 11 — Manual Test

`outputs/phase-11/` に以下のスクリーンショットを残す:

1. `admin-dashboard-200-overview.png`（staging `/admin` 全景）
2. `admin-dashboard-byZone-detail.png`（区画分布 3 行・進捗バー）
3. `curl-byZone-jq.txt`（上記 jq 結果コピペ）
4. （H1/H2/H3 該当時）`wrangler-tail-evidence.txt`

スクリーンショットがない項目は PR 本文の Phase 11 evidence 表から行ごと削除（CLAUDE.md「PR作成前チェック」準拠）

---

## Phase 12 — Documentation

- canonical 9 headings（Goal / Scope / Non-Goals / Inputs / Outputs / Acceptance Criteria / Risks / Rollback / References）
- 中学生レベル説明: 「区画」とは UBM メンバーの活動フェーズの分類（始めたばかり=0→1, 拡大中=1→10, 組織化フェーズ=10→100）。ダッシュボードはこの 3 段階で何人ずついるかを棒グラフで見せる
- References:
  - `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L3-159
  - `docs/00-getting-started-manual/specs/00-overview.md`
  - 親 workflow phase-2-design.md

---

## Phase 13 — PR

- base: `dev`
- title 案: `feat(admin): /admin dashboard 404 recovery + byZone supply (Task B)`
- body 必須セクション: Summary / 変更点 / 404 切り分け結果 / 検証ログ（curl + jq + playwright） / スクリーンショット / DoD checklist

### DoD

- [ ] staging `/admin` が 200 + KPI 4 + Zone 3 bar + Status 3 + Activity timeline + SchemaAlertCard を表示
- [ ] `AdminDashboardViewZ` の byZone 拡張が optional・既存 consumer 全て green
- [ ] H1/H2/H3 のいずれかに原因特定が完了・該当修正のみ commit に含まれている
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift 0
- [ ] プロトタイプ pages-admin.jsx と DOM 比較で差分なし
- [ ] OKLch token のみ使用（HEX / `bg-[#xxx]` 0 件・`verify-design-tokens` green）

---

## Risks / 要確認

- 401→404 のマスクが本当に起きているかは未確認。Phase 5.1 の wrangler tail で確定するまでコード修正は H1 のみ先行しない
- `aggregatePublicZones` の raw value（"0→1" など全角矢印か `0-1` か `0to1` か）は staging D1 の実データで確認必要。Phase 5.2 着手前に `bash scripts/cf.sh d1 --env staging --command "SELECT DISTINCT value_json FROM response_fields WHERE stable_key='ubm_zone'"` で確定
- `var(--ubm-color-info|accent|ok|bg)` の token が `tokens.css` 未定義の場合、本 task ではブロッカーとして Task E に escalate（独断追加禁止）
