# Phase 4: テスト計画（TDD RED 仕様）

Phase 2 設計を正本とし、実装前に **失敗する（RED）テスト** を確定する。本タスクは
全て既存 4 テストファイルの編集であり、新規テストファイルは作成しない（不変条件 #8：
`*.spec.ts(x)` のみ）。

## §0 対象テストファイルと役割

| # | テストファイル | 対象 | 主検証 |
| --- | --- | --- | --- |
| T1 | `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts` | `zoneFromCount` / `normalizeZone`（純粋関数） | 境界値・互換マッピング |
| T2 | `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` | `computeAttendanceOverviewExt` / `listZoneDistribution`（D1 集計） | overallRate（延べ率）/ unique 指標 / 新キー zone 集計 |
| T3 | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` | label 文言・選択可能 zone |
| T4 | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | `KpiPanel`（unique タイル） | `attendance-kpi-unique` 表示 |

> **重要（現状認識）**: T2（`attendance-analytics.repository.spec.ts`）は現状 `attendance.ts` の
> legacy 関数（`computeAttendanceOverview` / `listSessionAttendanceStats` /
> `listMemberAttendanceRanking`）のみを検証しており、**Ext 系（`computeAttendanceOverviewExt` /
> `listZoneDistribution`）の集計テストは存在しない**。本 Phase で Ext 系の `describe` ブロックを
> 追加する。`seedBase` / `setupD1` / EXPLAIN QUERY PLAN セクションは既存のまま保持する。

## §1 命名規則整合（前提確認）

| 種別 | 規則 | 値 |
| --- | --- | --- |
| zod enum キー | snake_case 機械可読 | `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown` |
| repository helper | camelCase | `zoneFromCount` / `normalizeZone` |
| web additive field | camelCase | `uniqueAttendeeCount` / `uniqueAttendanceRate` |
| test ファイル | `*.spec.ts(x)` のみ | 既存踏襲（新規作成なし） |

テスト内で zone を参照する際は **必ず snake_case リテラル**（`"zone_0"` 等）を使い、旧矢印リテラル
（`"0→1"` 等）は LEGACY 互換テスト（§2.2）以外で使用しない。

## §2 T1: `attendance-analytics-internals.spec.ts`（RED 仕様）

### §2.1 `zoneFromCount` 境界（既存 it を全面置換）

既存テスト（`expect(zoneFromCount(0)).toBe("0→1")` 等）は旧キー期待値のため RED になる。
以下へ置換する。

```ts
it("zoneFromCount: boundaries", () => {
  // 0 回 → zone_0
  expect(zoneFromCount(0)).toBe("zone_0");
  // 1..9 → zone_1_9
  expect(zoneFromCount(1)).toBe("zone_1_9");
  expect(zoneFromCount(9)).toBe("zone_1_9");
  // 10..99 → zone_10_99
  expect(zoneFromCount(10)).toBe("zone_10_99");
  expect(zoneFromCount(99)).toBe("zone_10_99");
  // >=100 → zone_100_plus（旧実装では unknown へ誤分類されていた・本タスクの核心）
  expect(zoneFromCount(100)).toBe("zone_100_plus");
  expect(zoneFromCount(1000)).toBe("zone_100_plus");
  // 無効値（負値 / 非有限）のみ unknown
  expect(zoneFromCount(-1)).toBe("unknown");
  expect(zoneFromCount(Number.NaN)).toBe("unknown");
  expect(zoneFromCount(Number.POSITIVE_INFINITY)).toBe("unknown");
});
```

| 入力 | 期待出力 | 副作用 | 根拠 |
| --- | --- | --- | --- |
| `0` | `"zone_0"` | なし（純粋） | count===0 |
| `1` / `9` | `"zone_1_9"` | なし | 1..9 |
| `10` / `99` | `"zone_10_99"` | なし | 10..99 |
| `100` / `1000` | `"zone_100_plus"` | なし | >=100（AC-1） |
| `-1` | `"unknown"` | なし | count<0 |
| `NaN` / `Infinity` | `"unknown"` | なし | `!Number.isFinite` |

### §2.2 `normalizeZone`（既存 it を全面置換 + 互換テスト追加）

```ts
it("normalizeZone: new keys passthrough", () => {
  expect(normalizeZone("zone_0")).toBe("zone_0");
  expect(normalizeZone("zone_1_9")).toBe("zone_1_9");
  expect(normalizeZone("zone_10_99")).toBe("zone_10_99");
  expect(normalizeZone("zone_100_plus")).toBe("zone_100_plus");
  expect(normalizeZone("unknown")).toBe("unknown");
});

it("normalizeZone: legacy arrow values are absorbed (AC-2)", () => {
  expect(normalizeZone("0→1")).toBe("zone_0");
  expect(normalizeZone("1→10")).toBe("zone_1_9");
  expect(normalizeZone("10→100")).toBe("zone_10_99");
});

it("normalizeZone: garbage → unknown", () => {
  expect(normalizeZone(null)).toBe("unknown");
  expect(normalizeZone(undefined)).toBe("unknown");
  expect(normalizeZone(42)).toBe("unknown");
  expect(normalizeZone("bogus")).toBe("unknown");
  // 旧 unknown 文字列ではない arbitrary 矢印は救済しない
  expect(normalizeZone("100→1000")).toBe("unknown");
});
```

| 入力 | 期待出力 | 根拠 |
| --- | --- | --- |
| `"zone_0"`..`"unknown"`（新 5 キー） | 同値 passthrough | normalizeZone 仕様 |
| `"0→1"` | `"zone_0"` | LEGACY_ZONE_MAP |
| `"1→10"` | `"zone_1_9"` | LEGACY_ZONE_MAP |
| `"10→100"` | `"zone_10_99"` | LEGACY_ZONE_MAP |
| `null` / `undefined` / `42` / `"bogus"` / `"100→1000"` | `"unknown"` | 防御的フォールバック |

### §2.3 `sessionPeriodClause` / `clampAnalyticsLimit` / `clampLastN`

**変更なし**（zone 再設計と独立）。既存 it をそのまま保持する。これらが GREEN のまま維持される
ことを回帰として確認する。

## §3 T2: `attendance-analytics.repository.spec.ts`（RED 仕様・Ext 系 describe 追加）

既存 import に Ext 関数を追加し、新 `describe` ブロックを追加する。`seedBase` は **既存のまま再利用**
（3 sessions[s3 deleted] / 3 members[m3 deleted] / m1→s1,s2・m2→s1・m2→s3[deleted session]・
m3→s2[deleted member]）。

### §3.1 import 追加

```ts
import {
  computeAttendanceOverviewExt,
  listZoneDistribution,
} from "../attendance-analytics";
```

### §3.2 `seedBase` から導かれる期待値（active のみ）

active session = `s1`, `s2`（s3 は deleted）→ `totalSessions = 2`。
active member = `m1`, `m2`（m3 は deleted）→ `totalMembers = 2`。
active 出席イベント = m1→s1 / m1→s2 / m2→s1（m2→s3 は deleted session 除外・m3→s2 は deleted
member 除外）→ `attendCount = 3`。

| 指標 | 計算 | 期待値 |
| --- | --- | --- |
| `totalSessions` | active session 数 | `2` |
| `totalMembers` | active member 数 | `2` |
| `overallRate`（延べ率） | `attendCount / (totalSessions × totalMembers)` = `3 / (2×2)` | `0.75` |
| `uniqueAttendeeCount` | 期間内 1 回以上出席した active member の `COUNT(DISTINCT member_id)`（m1, m2） | `2` |
| `uniqueAttendanceRate` | `uniqueAttendeeCount / totalMembers` = `2 / 2` | `1` |

### §3.3 `computeAttendanceOverviewExt` テスト

```ts
describe("computeAttendanceOverviewExt", () => {
  it("空テーブル時は 0 を返し unique も 0", async () => {
    const r = await computeAttendanceOverviewExt(env.ctx);
    expect(r.totalSessions).toBe(0);
    expect(r.totalMembers).toBe(0);
    expect(r.overallRate).toBe(0);
    expect(r.uniqueAttendeeCount).toBe(0);
    expect(r.uniqueAttendanceRate).toBe(0); // totalMembers=0 のゼロ除算回避
  });

  it("延べ率（overallRate）と unique 指標を分離して算出する", async () => {
    await seedBase(env);
    const r = await computeAttendanceOverviewExt(env.ctx);
    expect(r.totalSessions).toBe(2);
    expect(r.totalMembers).toBe(2);
    // 延べ率: 3 出席イベント / (2 sessions × 2 members) = 0.75
    expect(r.overallRate).toBe(0.75);
    // unique: 1 回以上出席した active member = m1, m2
    expect(r.uniqueAttendeeCount).toBe(2);
    // unique rate: 2 / 2 = 1.0
    expect(r.uniqueAttendanceRate).toBe(1);
  });
});
```

| テスト | 入力 | 期待出力 | 副作用 |
| --- | --- | --- | --- |
| 空テーブル | seed なし | `{totalSessions:0, totalMembers:0, overallRate:0, uniqueAttendeeCount:0, uniqueAttendanceRate:0}` | D1 SELECT のみ |
| seedBase | §3.2 seed | `overallRate:0.75 / uniqueAttendeeCount:2 / uniqueAttendanceRate:1` | D1 SELECT のみ |

> **bind 順序の RED 担保**: 実装で bind を 3 セットに揃え損ねると（period 未指定でも binds は空配列
> のため失敗が見えにくいが）、period 指定時に SQL の `?` 位置がずれて誤集計する。period clause を
> 効かせるテストを 1 本追加して bind 整合を担保する：

```ts
it("period 指定時も延べ率と unique が bind ずれなく算出される", async () => {
  await seedBase(env);
  // s1(2026-01-10) のみを含む半開区間 [2026-01-01, 2026-02-01)
  const r = await computeAttendanceOverviewExt(env.ctx, {
    periodFrom: "2026-01-01",
    periodTo: "2026-02-01",
    zone: null,
  });
  expect(r.totalSessions).toBe(1); // s1 のみ
  // 期間内 active 出席イベント = m1→s1, m2→s1 = 2 / (1 session × 2 members) = 1.0
  expect(r.overallRate).toBe(1);
  // 期間内 1 回以上出席 = m1, m2
  expect(r.uniqueAttendeeCount).toBe(2);
  expect(r.uniqueAttendanceRate).toBe(1);
});
```

### §3.4 `listZoneDistribution` テスト（新キー集計）

`seedBase` の active member 別 attendedCount（active session のみ・deleted 除外）:
m1 = s1,s2 = `2` 回 → `zone_1_9`、m2 = s1 = `1` 回 → `zone_1_9`。
よって `zone_1_9` が 2 名、他正常帯は 0 名、`unknown` は 0（count===0 のため間引きされ行に残らない）。

```ts
describe("listZoneDistribution", () => {
  it("active member の attendedCount を新キー zone へ集計する", async () => {
    await seedBase(env);
    const r = await listZoneDistribution(env.ctx);
    const byZone = Object.fromEntries(r.rows.map((row) => [row.zone, row.attendeeCount]));
    // m1=2回, m2=1回 → ともに zone_1_9
    expect(byZone["zone_1_9"]).toBe(2);
    expect(byZone["zone_0"]).toBe(0);
    expect(byZone["zone_10_99"]).toBe(0);
    expect(byZone["zone_100_plus"]).toBe(0);
    // unknown は count===0 のため間引かれ行に出ない
    expect(r.rows.some((row) => row.zone === "unknown")).toBe(false);
    // 旧矢印キーが行に混入しないこと（回帰 guard）
    expect(r.rows.some((row) => String(row.zone).includes("→"))).toBe(false);
  });

  it("rows の各 zone は AttendanceZoneZ で parse 可能（4面一致）", async () => {
    await seedBase(env);
    const r = await listZoneDistribution(env.ctx);
    for (const row of r.rows) {
      expect(AttendanceZoneZ.safeParse(row.zone).success).toBe(true);
    }
  });
});
```

`AttendanceZoneZ` を import に追加：

```ts
import { AttendanceZoneZ } from "@ubm-hyogo/shared";
```

| テスト | 期待出力 |
| --- | --- |
| 新キー集計 | `zone_1_9 = 2`、他正常帯 0、`unknown` 行なし、矢印キーなし |
| parse 整合 | 全 `row.zone` が `AttendanceZoneZ.safeParse().success === true` |

### §3.5 既存 legacy / EXPLAIN セクションの保持

`computeAttendanceOverview`（legacy）/ `listSessionAttendanceStats` / `listMemberAttendanceRanking` /
`AC-1` / `AC-3` の既存 describe は **無変更で GREEN 維持**（zone 表記に依存しないため回帰しない）。

## §4 T3: `format-attendance.spec.ts`（RED 仕様）

既存 `ZONE_LABEL covers known zones` は旧キー（`ZONE_LABEL["0→1"]`）参照のため RED。
以下へ置換し、`SELECTABLE_ZONES` テストを追加する。

```ts
import {
  formatRate,
  formatDelta,
  presetToPeriod,
  ZONE_LABEL,
  ZONE_HELP,
  SELECTABLE_ZONES,
} from "../lib/format-attendance";

it("ZONE_LABEL covers all 5 new zone keys", () => {
  expect(ZONE_LABEL["zone_0"]).toBe("0 回（未出席）");
  expect(ZONE_LABEL["zone_1_9"]).toBe("1〜9 回");
  expect(ZONE_LABEL["zone_10_99"]).toBe("10〜99 回");
  expect(ZONE_LABEL["zone_100_plus"]).toBe("100 回以上");
  expect(ZONE_LABEL["unknown"]).toBe("分類不能");
});

it("ZONE_HELP describes the new boundaries", () => {
  expect(ZONE_HELP).toContain("累計出席回数");
  expect(ZONE_HELP).toContain("100 回以上");
  expect(ZONE_HELP).toContain("分類不能");
});

it("SELECTABLE_ZONES excludes unknown", () => {
  expect(SELECTABLE_ZONES).toEqual(["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus"]);
  expect(SELECTABLE_ZONES).not.toContain("unknown");
});
```

| 入力 | 期待出力 |
| --- | --- |
| `ZONE_LABEL["zone_0"]` | `"0 回（未出席）"` |
| `ZONE_LABEL["zone_1_9"]` | `"1〜9 回"` |
| `ZONE_LABEL["zone_10_99"]` | `"10〜99 回"` |
| `ZONE_LABEL["zone_100_plus"]` | `"100 回以上"` |
| `ZONE_LABEL["unknown"]` | `"分類不能"` |
| `SELECTABLE_ZONES` | `["zone_0","zone_1_9","zone_10_99","zone_100_plus"]`（unknown 除外） |
| `ZONE_HELP` | 新境界文言（`累計出席回数` / `100 回以上` / `分類不能` を含む） |

`formatRate` / `formatDelta` / `presetToPeriod` の既存 it は **無変更で GREEN 維持**。

## §5 T4: `KpiPanel.spec.tsx`（RED 仕様）

`baseOverview` fixture は `AttendanceOverviewExt` 型のため、schema へ `uniqueAttendeeCount` /
`uniqueAttendanceRate` が required 追加されると **型エラー（compile-time RED）** になる。fixture に
両 field を足す必要があることを明示する。

```ts
const baseOverview: AttendanceOverviewExt = {
  totalSessions: 10,
  totalMembers: 50,
  overallRate: 0.42,
  previousPeriodRate: 0.35,
  uniqueAttendeeCount: 30,        // 追加（required）
  uniqueAttendanceRate: 0.6,      // 追加（required・30/50）
  filter: { periodFrom: null, periodTo: null, zoneFilter: null },
};
```

unique タイル表示テストを追加：

```ts
it("renders the unique attendance KPI tile", () => {
  render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
  const tile = screen.getByTestId("attendance-kpi-unique");
  // value = formatRate(0.6) = "60.0%"
  expect(tile.textContent).toContain("60.0%");
  // hint に unique 人数（30 名）
  expect(tile.textContent).toContain("30");
});
```

> 既存の `renders 4 KPI cards ...` テストは、unique タイル追加後も rate / attendees / avg /
> sessions の 4 testId を引き続き検証できるため文言期待値は変更不要（タイルが 5 枚に増えるだけで
> 既存 testId は不変）。ただし `baseOverview` への 2 field 追加は全テストで共有される。

| テスト | 入力 | 期待出力 | 副作用 |
| --- | --- | --- | --- |
| unique タイル | `uniqueAttendanceRate:0.6 / uniqueAttendeeCount:30` | `data-testid="attendance-kpi-unique"` に `"60.0%"` と `"30"` | DOM render のみ |
| 既存 4 タイル | baseOverview | rate `42.0%` / attendees `120` / avg `12.0` / sessions `10` | DOM render のみ |

## §6 テスト実行コマンド（RED 確認）

D1 in-memory を使う T2 は repo ルートからフルパス実行する（MEMORY 既知慣習）。

```bash
# API internals + repository（D1）
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts

# web format + KpiPanel
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx

# 4 ファイル一括
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

## §7 RED 期待（このフェーズ完了時点の状態）

| テスト | RED 理由 |
| --- | --- |
| T1 zoneFromCount | 実装が `100 → unknown`・新キー未対応 |
| T1 normalizeZone | LEGACY_ZONE_MAP 未実装・新キー passthrough 未対応 |
| T2 Ext overview | `uniqueAttendeeCount` / `uniqueAttendanceRate` field が型・実装に存在しない |
| T2 zone-distribution | `counts` Record / `zones` 配列が旧キー |
| T3 format | `ZONE_LABEL` が旧キー・`unknown="100 回以上"` の誤割当・`SELECTABLE_ZONES` 旧キー |
| T4 KpiPanel | `attendance-kpi-unique` タイル未実装・fixture に 2 field 不足（型エラー） |

## 完了条件（Phase 4）

- [ ] T1〜T4 の RED 仕様（追加/変更 it・期待値）がコード例付きで確定した。
- [ ] `seedBase`（3 sessions[1 deleted]/3 members[m3 deleted]）から導く具体的期待値
      （overallRate=0.75 / uniqueAttendeeCount=2 / uniqueAttendanceRate=1 / zone_1_9=2）が明記された。
- [ ] snake_case enum キー / camelCase field の命名整合がテスト内で徹底された。
- [ ] 各テストの入力 / 期待出力 / 副作用が表で整理された。
- [ ] RED 確認用の vitest 実行コマンド（4 ファイル）が記載された。
