# Phase 5: 実装手順（TDD GREEN）

Phase 4 の RED テストを GREEN にする最小実装手順。Phase 2 設計を逐語的に実装する。
全変更は **read-only SELECT のみ**（D1 migration なし）・**route 層非変更**・
**endpoint path/method 非変更**・**Google Form schema 非変更**。

## §0 新規作成 / 修正ファイル一覧 [Feedback RT-03]

| 区分 | パス | 変更概要 |
| --- | --- | --- |
| 新規作成 | `apps/web/playwright/tests/issue-1101-attendance-analytics-calc-correction.spec.ts` | Phase 11 local screenshot evidence（desktop/mobile）取得 |
| 修正 | `packages/shared/src/zod/admin-attendance.ts` | `AttendanceZoneZ` enum 再設計・`AttendanceOverviewExtZ` に unique 2 field 追加 |
| 修正 | `apps/api/src/repository/attendance-analytics.ts` | `zoneFromCount` 境界・`normalizeZone`+`LEGACY_ZONE_MAP`・`counts`/`zones`・`OverviewRow`・`fetchOverviewRow` SQL+bind・`computeAttendanceOverviewExt` unique 算出 |
| 修正 | `apps/api/src/lib/parse-attendance-filter.ts` | 旧矢印 `zone` query を新キーへ互換正規化 |
| 修正 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | `ZONE_LABEL`（5 キー）・`SELECTABLE_ZONES`（4 キー）・`ZONE_HELP` 文言 |
| 修正 | `apps/web/src/features/admin/attendance/lib/read-attendance-filter.ts` | web query reader で旧矢印 `zone` を新キーへ互換正規化 |
| 修正 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | unique KPI タイル（`attendance-kpi-unique`）追加 |
| 修正 | `apps/web/playwright/fixtures/auth.ts` | local Playwright mock API の attendance zone fixture / absentee zone を新キーへ同期 |
| 修正 | `docs/00-getting-started-manual/specs/01-api-schema.md` | Zone 派生・集計母数・overview response shape を新仕様へ |
| 修正（テスト） | `attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` / `parse-attendance-filter.spec.ts` / `format-attendance.spec.ts` / `KpiPanel.spec.tsx` / `AttendanceZoneDistributionChart.spec.tsx` / `buildExportUrl.spec.ts` | Phase 4 の RED 仕様（別ファイル参照） |

> **非変更（連動確認のみ）**: `apps/api/src/routes/admin/attendance.ts`（passthrough）/
> `fetch-attendance.ts`。型整合で
> 自動追従し、コードは触らない（Phase 1 §3 連動確認・Phase 2 §4）。
> **絶対非変更（別ドメイン）**: `apps/api/src/routes/admin/_shared/byZone.ts`、
> `apps/web/src/components/public/AboutUbm.tsx` / `MemberFilters.client.tsx` /
> `SelectedFiltersBar.client.tsx`（UBM 事業成長フェーズ zone・`AttendanceZone` を import しない）。

## §1 実装順序（依存に沿った一方向）

shared schema を正本に据え、生成元（API）→ 消費（web）→ doc の順で揃える。

```
1. packages/shared/src/zod/admin-attendance.ts   ← 契約正本（enum + 2 field）
2. apps/api/src/repository/attendance-analytics.ts ← 生成元（zone 判定 + unique SQL）
3. apps/web/.../lib/format-attendance.ts          ← 消費（label / selectable）
4. apps/web/.../components/KpiPanel.tsx            ← 消費（unique タイル）
5. docs/00-getting-started-manual/specs/01-api-schema.md ← 記述
```

## §2 `packages/shared/src/zod/admin-attendance.ts`

### §2.1 `AttendanceZoneZ`（enum 再設計）

```ts
// Before
export const AttendanceZoneZ = z.enum(["0→1", "1→10", "10→100", "unknown"]);

// After
export const AttendanceZoneZ = z.enum([
  "zone_0",
  "zone_1_9",
  "zone_10_99",
  "zone_100_plus",
  "unknown",
]);
```

`export type AttendanceZone = z.infer<typeof AttendanceZoneZ>;` は無変更（型名維持）。

### §2.2 `AttendanceOverviewExtZ`（additive 2 field・`.strict()` 維持）

```ts
// Before
export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
}).strict();

// After
export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
  uniqueAttendeeCount: z.number().int().nonnegative(),
  uniqueAttendanceRate: z.number().min(0).max(1),
}).strict();
```

- `AttendanceOverviewZ`（viewmodel・`overallRate` 所有）は **非変更**。
- additive のため既存 consumer（route passthrough）は素通し。required 追加だが UI fixture とコード両方
  で必ず供給するため OK（[UT-W3] consumer wiring は KpiPanel で完結）。

## §3 `apps/api/src/repository/attendance-analytics.ts`

### §3.1 `zoneFromCount`（境界バグ修正）

```ts
// Before
const zoneFromCount = (count: number): AttendanceZone => {
  if (count <= 0) return "0→1";
  if (count <= 9) return "1→10";
  if (count <= 99) return "10→100";
  return "unknown";
};

// After
const zoneFromCount = (count: number): AttendanceZone => {
  if (!Number.isFinite(count) || count < 0) return "unknown";
  if (count === 0) return "zone_0";
  if (count <= 9) return "zone_1_9";
  if (count <= 99) return "zone_10_99";
  return "zone_100_plus";
};
```

- 入力: メンバーの累計（または期間内）出席回数。
- 出力: 5 種 `AttendanceZone`。
- 副作用: なし（純粋）。
- エラーハンドリング: 例外を投げず、無効値（負値 / 非有限）は `unknown` を返す（防御的）。
- 境界: `99 → zone_10_99` / `100 → zone_100_plus`（off-by-one に注意・Phase 6 で guard）。

### §3.2 `normalizeZone` + `LEGACY_ZONE_MAP`

```ts
// After（LEGACY_ZONE_MAP を新設し normalizeZone を全面置換）
const LEGACY_ZONE_MAP: Record<string, AttendanceZone> = {
  "0→1": "zone_0",
  "1→10": "zone_1_9",
  "10→100": "zone_10_99",
};

const normalizeZone = (raw: unknown): AttendanceZone => {
  if (typeof raw !== "string") return "unknown";
  if (
    raw === "zone_0" ||
    raw === "zone_1_9" ||
    raw === "zone_10_99" ||
    raw === "zone_100_plus" ||
    raw === "unknown"
  ) {
    return raw;
  }
  return LEGACY_ZONE_MAP[raw] ?? "unknown";
};
```

- 新キーは passthrough、旧矢印値は互換マッピング、未知値は `unknown`。
- `__testInternals` の export はそのまま（`zoneFromCount` / `normalizeZone` / `sessionPeriodClause`）。

### §3.3 `counts` Record / `zones` 配列（`listZoneDistribution` 内）

```ts
// Before
const counts: Record<AttendanceZone, number> = {
  "0→1": 0, "1→10": 0, "10→100": 0, unknown: 0,
};
const zones: AttendanceZone[] = ["0→1", "1→10", "10→100", "unknown"];

// After
const counts: Record<AttendanceZone, number> = {
  zone_0: 0, zone_1_9: 0, zone_10_99: 0, zone_100_plus: 0, unknown: 0,
};
const zones: AttendanceZone[] = ["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown"];
```

- 既存 `.filter((row) => row.zone !== "unknown" || row.attendeeCount > 0)`（unknown 間引き）は
  **踏襲**。`zone_100_plus` は常時表示（Phase 3 M-2 の方針通り）。

### §3.4 `OverviewRow` interface

```ts
// Before
interface OverviewRow {
  totalSessions: number;
  totalMembers: number;
  attendCount: number;
}

// After
interface OverviewRow {
  totalSessions: number;
  totalMembers: number;
  attendCount: number;
  uniqueAttendeeCount: number;
}
```

### §3.5 `fetchOverviewRow`（SQL に DISTINCT サブクエリ追加 + bind 3 セット）

```ts
const fetchOverviewRow = async (
  c: DbCtx,
  f: AttendanceFilter,
): Promise<OverviewRow> => {
  const period = sessionPeriodClause(f);
  const row = await c.db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM meeting_sessions s WHERE s.deleted_at IS NULL${period.sql}) AS totalSessions,
         (SELECT COUNT(*) FROM member_identities mi
            LEFT JOIN member_status ms ON ms.member_id = mi.member_id
            WHERE COALESCE(ms.is_deleted, 0) = 0) AS totalMembers,
         (SELECT COUNT(*) FROM member_attendance ma
            JOIN meeting_sessions s ON s.session_id = ma.session_id
            JOIN member_identities mi ON mi.member_id = ma.member_id
            LEFT JOIN member_status ms ON ms.member_id = mi.member_id
            WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0${period.sql}) AS attendCount,
         (SELECT COUNT(DISTINCT ma.member_id) FROM member_attendance ma
            JOIN meeting_sessions s ON s.session_id = ma.session_id
            JOIN member_identities mi ON mi.member_id = ma.member_id
            LEFT JOIN member_status ms ON ms.member_id = mi.member_id
            WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0${period.sql}) AS uniqueAttendeeCount
      `,
    )
    .bind(...period.binds, ...period.binds, ...period.binds)
    .first<OverviewRow>();
  return {
    totalSessions: row?.totalSessions ?? 0,
    totalMembers: row?.totalMembers ?? 0,
    attendCount: row?.attendCount ?? 0,
    uniqueAttendeeCount: row?.uniqueAttendeeCount ?? 0,
  };
};
```

> `totalMembers` サブクエリは period clause を含まないため bind を消費しない。period を消費するのは
> `totalSessions` / `attendCount` / `uniqueAttendeeCount` の **3 サブクエリ**。

### §3.6 `computeAttendanceOverviewExt`（unique 算出 + 返却）

`overallRate` の算出は無変更。unique を追加し返却 object に 2 field を足す。

```ts
export async function computeAttendanceOverviewExt(
  c: DbCtx,
  f: AttendanceFilter = EMPTY_FILTER,
): Promise<AttendanceOverviewExt> {
  const cur = await fetchOverviewRow(c, f);
  const denom = cur.totalSessions * cur.totalMembers;
  const overallRate = denom > 0 ? cur.attendCount / denom : 0;

  // 既存 previousPeriodRate ブロックは無変更
  // ...

  const uniqueAttendeeCount = cur.uniqueAttendeeCount ?? 0;
  const uniqueAttendanceRate =
    cur.totalMembers > 0
      ? Math.min(1, Math.max(0, uniqueAttendeeCount / cur.totalMembers))
      : 0;

  return {
    totalSessions: cur.totalSessions,
    totalMembers: cur.totalMembers,
    overallRate: Math.min(1, Math.max(0, overallRate)),
    previousPeriodRate,
    uniqueAttendeeCount,
    uniqueAttendanceRate,
    filter: filterEcho(f),
  };
}
```

- `totalMembers === 0` 時は `uniqueAttendanceRate = 0`（ゼロ除算回避）。
- `previousPeriodRate` の前期間集計は overallRate のみ使用するため、unique は **現期間のみ**算出
  （`prev` の `uniqueAttendeeCount` は使わない・無変更）。

## §4 §注意（最重要）— `fetchOverviewRow` の bind 順序

> **本タスク実装時の最大の落とし穴**。SQL サブクエリの出現順と `.bind(...)` の引数順を必ず一致させる。

### 現状と変更

| 項目 | Before | After |
| --- | --- | --- |
| period を消費するサブクエリ | `totalSessions`, `attendCount`（2 個） | `totalSessions`, `attendCount`, `uniqueAttendeeCount`（3 個） |
| `.bind` の period セット数 | `.bind(...period.binds, ...period.binds)`（2 セット） | `.bind(...period.binds, ...period.binds, ...period.binds)`（3 セット） |

`totalMembers` サブクエリは `WHERE COALESCE(ms.is_deleted, 0) = 0` のみで `${period.sql}` を含まない
ため bind を消費しない。`uniqueAttendeeCount` サブクエリを **`attendCount` の直後**（SELECT の最後）
に置き、bind 配列も同じ順序（`period × 3`）で並べること。

### 並び順一致の検証手順

1. SQL 文字列内で `${period.sql}` が出現する位置を上から数える（After は 3 箇所：totalSessions /
   attendCount / uniqueAttendeeCount。totalMembers には無い）。
2. `.bind(...)` のスプレッド回数が同数（3）であることを目視確認する。
3. `sessionPeriodClause` は `periodFrom` → `periodTo` の順に最大 2 binds を返すため、各セット内の
   bind 順序は SQL の `held_on >= ?` → `held_on < ?` と一致する（無変更・既存挙動）。
4. Phase 4 §3.3 の「period 指定時テスト」（`periodFrom:"2026-01-01" / periodTo:"2026-02-01"`）が
   GREEN になることで bind ずれが無いことをランタイム検証する。`totalSessions=1 / overallRate=1 /
   uniqueAttendeeCount=2` が出れば整合。

### よくある誤り（回避すべき）

- bind を 2 セットのまま残す → period 指定時に `uniqueAttendeeCount` サブクエリへ binding が渡らず
  D1 が「too few parameters」エラー、または `?` 位置ずれで誤集計。
- `uniqueAttendeeCount` サブクエリを `totalMembers`（bind なし）の前後に挿入し、bind 順序が SQL の
  `?` 出現順とずれる → 期間が誤った列に適用される。**必ず SELECT 末尾に追加**。

## §5 `apps/web/src/features/admin/attendance/lib/format-attendance.ts`

```ts
// Before
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0 回（未出席）",
  "1→10": "1〜9 回",
  "10→100": "10〜99 回",
  unknown: "100 回以上",   // ← unknown に 100+ を誤割当（バグ）
};
export const ZONE_HELP =
  "出席回数帯は、各メンバーの累計出席回数を現行の集計境界で分類したものです。";
export const SELECTABLE_ZONES: readonly AttendanceZone[] = ["0→1", "1→10", "10→100"];

// After
export const ZONE_LABEL: Record<AttendanceZone, string> = {
  zone_0: "0 回（未出席）",
  zone_1_9: "1〜9 回",
  zone_10_99: "10〜99 回",
  zone_100_plus: "100 回以上",
  unknown: "分類不能",
};
export const ZONE_HELP =
  "出席回数帯は、各メンバーの累計出席回数を 0 / 1〜9 / 10〜99 / 100 回以上 で分類したものです。分類不能は集計対象外の異常値です。";
export const SELECTABLE_ZONES: readonly AttendanceZone[] = [
  "zone_0",
  "zone_1_9",
  "zone_10_99",
  "zone_100_plus",
];
```

- `formatRate` / `formatDelta` / `PERIOD_PRESETS` / `presetToPeriod` は無変更。
- `ZONE_LABEL` は `Record<AttendanceZone, string>` 型なので、5 キー網羅しないと型エラーになる
  （網羅性が型で担保される）。

## §6 `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`

既存 `<section>` 内の最後（セッション数タイルの後）に Card を 1 枚追加する。props 追加は不要
（`overview` から unique field を読む）。

```tsx
<Card
  label="unique 出席率"
  value={formatRate(overview.uniqueAttendanceRate)}
  hint={`期間内 1 回以上出席した会員割合（${overview.uniqueAttendeeCount} 名）`}
  testId="attendance-kpi-unique"
/>
```

- 既存 4 タイル（rate / attendees / avg / sessions）は維持し 5 タイルにする。
- `Card` コンポーネント・`Props` interface は無変更。

## §7 `docs/00-getting-started-manual/specs/01-api-schema.md`

| 箇所 | Before | After |
| --- | --- | --- |
| 共通クエリ規約 `zone` 行（L252） | `カンマ区切り 0→1 / 1→10 / 10→100` | `カンマ区切り zone_0 / zone_1_9 / zone_10_99 / zone_100_plus` |
| overview Response（L262） | `{ totalSessions, totalMembers, overallRate, previousPeriodRate \| null, filter }` | 末尾に `uniqueAttendeeCount, uniqueAttendanceRate` を追加 |
| Zone 派生（L273） | `0 → '0→1'、1..9 → '1→10'、10..99 → '10→100'、>=100 → 'unknown'` | `0 → 'zone_0'、1..9 → 'zone_1_9'、10..99 → 'zone_10_99'、>=100 → 'zone_100_plus'。負値/非有限のみ 'unknown'` |
| 集計母数（L277） | overallRate 定義のみ | `uniqueAttendeeCount = 期間内 1 回以上出席 active member の COUNT(DISTINCT member_id)。uniqueAttendanceRate = uniqueAttendeeCount / totalMembers（0..1 clamp）` を追記 |

文言は Phase 2 §1/§2 と 4 面一致マップ（§5）に厳密整合させる。

## §8 入力 / 出力 / 副作用 / エラーハンドリング（横断）

| 関数 | 入力 | 出力 | 副作用 | エラー |
| --- | --- | --- | --- | --- |
| `zoneFromCount` | `number` | `AttendanceZone` | なし | 例外なし・無効値は `unknown` |
| `normalizeZone` | `unknown` | `AttendanceZone` | なし | 例外なし・未知値は `unknown` |
| `fetchOverviewRow` | `DbCtx`, `AttendanceFilter` | `OverviewRow` | D1 SELECT（read-only） | row null 時は各 field 0 fallback |
| `computeAttendanceOverviewExt` | `DbCtx`, `AttendanceFilter` | `AttendanceOverviewExt` | D1 SELECT | totalMembers=0 で rate=0 |
| `KpiPanel` | `AttendanceOverviewExt`, `attendeeCount` | JSX | DOM render | — |

## §9 TDD GREEN の手順

1. Phase 4 の RED テスト（4 ファイル）が失敗することを確認（§Phase 4 §6 コマンド）。
2. §2（shared schema）を実装 → KpiPanel fixture の型エラーが消えることを確認。
3. §3（API repository）を実装 → §4 の bind 順序を二重チェック。
4. T1 / T2 を focused 実行し GREEN 化。
5. §5 / §6（web）を実装 → T3 / T4 を focused 実行し GREEN 化。
6. §7（doc）を更新。
7. 4 ファイル一括 vitest で全 GREEN を確認。

## §10 ローカル実行・検証コマンド

```bash
# focused vitest（GREEN 確認）
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 不変条件 grep（D1 migration / route 不変）
git diff --name-only -- apps/api/migrations apps/api/src/routes   # 空であること

# 旧矢印値が実装から消えたこと（テストの LEGACY 互換期待値は除く）
rg -n '"0→1"|"1→10"|"10→100"' \
  apps/api/src/repository/attendance-analytics.ts \
  packages/shared/src/zod/admin-attendance.ts \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts \
  apps/web/src/features/admin/attendance/components/KpiPanel.tsx \
  docs/00-getting-started-manual/specs/01-api-schema.md
# → ヒット 0（LEGACY_ZONE_MAP のキーのみ attendance-analytics.ts に残るのは正当・下記注記）

# 別ドメイン zone 非変更
git diff --name-only -- \
  apps/api/src/routes/admin/_shared/byZone.ts \
  apps/web/src/components/public/AboutUbm.tsx \
  apps/web/src/components/public/MemberFilters.client.tsx \
  apps/web/src/components/public/SelectedFiltersBar.client.tsx   # 空であること
```

> **grep 注記**: `LEGACY_ZONE_MAP` は旧矢印キー（`"0→1"` 等）を **互換マッピングの key** として
> 意図的に保持する（AC-2）。よって「旧矢印値 grep ゼロ」は厳密には
> `attendance-analytics.ts` の `LEGACY_ZONE_MAP` 定義行を除外した上で評価する。enum メンバー・
> `ZONE_LABEL` キー・`SELECTABLE_ZONES` 要素・doc の派生表に旧矢印が残っていないことが本質。

## §11 DoD（完了の定義）

- [ ] `pnpm build` 成功。
- [ ] focused vitest（4 ファイル）全 GREEN。
- [ ] `pnpm typecheck` PASS（`Record<AttendanceZone,...>` の網羅性含む）。
- [ ] `pnpm lint` PASS。
- [ ] `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空。
- [ ] 別ドメイン zone 4 ファイルの diff が空。
- [ ] 旧矢印 enum 値が enum / ZONE_LABEL / SELECTABLE_ZONES / doc 派生表から消えた
      （`LEGACY_ZONE_MAP` の互換キーのみ残存・正当）。
- [ ] `AttendanceOverviewExt` の overview response に `uniqueAttendeeCount` /
      `uniqueAttendanceRate` が含まれ KpiPanel が consume する。

## 完了条件（Phase 5）

- [ ] 新規/修正ファイル一覧が記載された [RT-03]。
- [ ] 各ファイルの Before/After 差分方針が関数・型シグネチャ単位で確定した。
- [ ] §注意（bind 3 セット・SELECT 出現順一致・検証手順）が明記された。
- [ ] 入力/出力/副作用/防御的エラーハンドリングが整理された。
- [ ] TDD GREEN 手順・検証コマンド・DoD が確定した。
