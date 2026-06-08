# Phase 6: テスト拡充（fail path / 回帰 guard）

Phase 4 は happy path の RED/GREEN を確定した。Phase 6 は **境界の off-by-one・無効値・
ゼロ除算・旧 enum 値消失の回帰 guard・4 面一致の property 的検証** を追加し、再発を機械検知できる
ようにする。全て既存 4 テストファイルへの追記（新規ファイルなし・`*.spec.ts(x)` のみ）。

## §0 追加テスト一覧

| # | ファイル | 追加カテゴリ | 目的 |
| --- | --- | --- | --- |
| A1 | `attendance-analytics-internals.spec.ts` | off-by-one 境界 | `99/100` の分岐確定 |
| A2 | `attendance-analytics-internals.spec.ts` | 無効値 fail path | 負値 / NaN / Infinity → unknown |
| A3 | `attendance-analytics-internals.spec.ts` | 4 面一致 property | `zoneFromCount` 返り値が `AttendanceZoneZ.safeParse` を必ず通る |
| A4 | `attendance-analytics-internals.spec.ts` | 旧 enum 消失 回帰 guard | 旧矢印値が `AttendanceZoneZ` enum から消えた |
| A5 | `attendance-analytics.repository.spec.ts` | ゼロ除算 guard | `totalMembers=0` で `uniqueAttendanceRate=0` |
| A6 | `format-attendance.spec.ts` | label 網羅 回帰 guard | `ZONE_LABEL` が新 5 キーのみ・旧矢印キー不在 |

## §1 A1: off-by-one 境界（`99` / `100`）

`zone_10_99`（10..99）と `zone_100_plus`（>=100）の分岐は最も誤りやすい off-by-one。境界 4 点を固定。

```ts
it("zoneFromCount: off-by-one at the 99/100 boundary", () => {
  expect(zoneFromCount(98)).toBe("zone_10_99");
  expect(zoneFromCount(99)).toBe("zone_10_99");   // 上端
  expect(zoneFromCount(100)).toBe("zone_100_plus"); // 下端（旧バグの誤分類点）
  expect(zoneFromCount(101)).toBe("zone_100_plus");
});

it("zoneFromCount: off-by-one at the 9/10 boundary", () => {
  expect(zoneFromCount(9)).toBe("zone_1_9");
  expect(zoneFromCount(10)).toBe("zone_10_99");
});

it("zoneFromCount: off-by-one at the 0/1 boundary", () => {
  expect(zoneFromCount(0)).toBe("zone_0");
  expect(zoneFromCount(1)).toBe("zone_1_9");
});
```

| 入力 | 期待 |
| --- | --- |
| `98` / `99` | `zone_10_99` |
| `100` / `101` | `zone_100_plus` |
| `9` → `10` | `zone_1_9` → `zone_10_99` |
| `0` → `1` | `zone_0` → `zone_1_9` |

## §2 A2: 無効値 fail path（防御的実装の確認）

```ts
it("zoneFromCount: invalid inputs fall back to unknown (no throw)", () => {
  expect(zoneFromCount(-1)).toBe("unknown");
  expect(zoneFromCount(-0.5)).toBe("unknown");
  expect(zoneFromCount(Number.NaN)).toBe("unknown");
  expect(zoneFromCount(Number.POSITIVE_INFINITY)).toBe("unknown");
  expect(zoneFromCount(Number.NEGATIVE_INFINITY)).toBe("unknown");
  // 例外を投げないこと
  expect(() => zoneFromCount(Number.NaN)).not.toThrow();
});

it("normalizeZone: non-string and unknown strings fall back without throw", () => {
  expect(normalizeZone(undefined)).toBe("unknown");
  expect(normalizeZone({})).toBe("unknown");
  expect(normalizeZone([])).toBe("unknown");
  expect(normalizeZone(NaN)).toBe("unknown");
  expect(() => normalizeZone(Symbol("x"))).not.toThrow();
});
```

> `unknown` は **分類不能フォールバック専用**（Phase 2 §0 真の論点）であり、正常な高頻度帯
> （100+）が誤って落ちないことを A1 と合わせて保証する。

## §3 A3: 4 面一致 property（`zoneFromCount` × `AttendanceZoneZ`）

`zoneFromCount` の返り値が **必ず** `AttendanceZoneZ` の enum メンバーであることを、代表値の広い範囲で
property 的に検証する（AC-4：enum 集合と返り値集合の完全一致）。

```ts
import { AttendanceZoneZ } from "@ubm-hyogo/shared";

it("zoneFromCount: every output parses against AttendanceZoneZ (AC-4)", () => {
  const samples = [
    -100, -1, 0, 1, 5, 9, 10, 50, 99, 100, 101, 1000, 100000,
    Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY,
  ];
  for (const n of samples) {
    const zone = zoneFromCount(n);
    expect(AttendanceZoneZ.safeParse(zone).success).toBe(true);
  }
});

it("zoneFromCount: covers exactly the 5 expected zone keys across the range", () => {
  const produced = new Set(
    [0, 5, 50, 100, -1].map((n) => zoneFromCount(n)),
  );
  expect(produced).toEqual(
    new Set(["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown"]),
  );
});
```

import 追加が必要（internals spec に shared を持ち込む）：

```ts
import { AttendanceZoneZ } from "@ubm-hyogo/shared";
```

| 検証 | 期待 |
| --- | --- |
| 全サンプルの返り値 | `AttendanceZoneZ.safeParse().success === true` |
| 5 代表値の返り値集合 | `{zone_0, zone_1_9, zone_10_99, zone_100_plus, unknown}` と完全一致 |

## §4 A4: 旧 enum 値消失の回帰 guard

旧矢印値が `AttendanceZoneZ` の enum メンバーから消えたことを明示的に固定（再導入を検知）。

```ts
it("AttendanceZoneZ: legacy arrow values are no longer enum members (AC-2)", () => {
  expect(AttendanceZoneZ.safeParse("0→1").success).toBe(false);
  expect(AttendanceZoneZ.safeParse("1→10").success).toBe(false);
  expect(AttendanceZoneZ.safeParse("10→100").success).toBe(false);
  // 新キーは valid
  expect(AttendanceZoneZ.safeParse("zone_0").success).toBe(true);
  expect(AttendanceZoneZ.safeParse("zone_100_plus").success).toBe(true);
});

it("AttendanceZoneZ: enum option set is exactly the 5 new keys", () => {
  expect(new Set(AttendanceZoneZ.options)).toEqual(
    new Set(["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown"]),
  );
});
```

> 旧矢印値は **`normalizeZone` の互換マッピング経由でのみ** 受理される（enum メンバーではない）。
> A4 と Phase 4 §2.2 の互換テストを併せて「enum からは消したが入力互換は残す」AC-2 を二面で固定する。

## §5 A5: ゼロ除算 guard（`uniqueAttendanceRate`）

`totalMembers === 0`（active member ゼロ）時に `uniqueAttendeeCount / totalMembers` の NaN/Infinity を
作らず `0` を返すことを D1 集計で確認する。空テーブルが最も自然な再現。

```ts
it("uniqueAttendanceRate is 0 when there are no active members (no division by zero)", async () => {
  // seed なし → totalMembers = 0
  const r = await computeAttendanceOverviewExt(env.ctx);
  expect(r.totalMembers).toBe(0);
  expect(r.uniqueAttendeeCount).toBe(0);
  expect(r.uniqueAttendanceRate).toBe(0);
  expect(Number.isFinite(r.uniqueAttendanceRate)).toBe(true);
});

it("uniqueAttendanceRate stays within [0,1] clamp", async () => {
  await seedBase(env);
  const r = await computeAttendanceOverviewExt(env.ctx);
  expect(r.uniqueAttendanceRate).toBeGreaterThanOrEqual(0);
  expect(r.uniqueAttendanceRate).toBeLessThanOrEqual(1);
});
```

| 入力 | 期待 |
| --- | --- |
| 空テーブル | `uniqueAttendanceRate = 0`（有限値・NaN/Infinity でない） |
| seedBase | `0 <= uniqueAttendanceRate <= 1` |

## §6 A6: `ZONE_LABEL` 網羅 回帰 guard（web）

`ZONE_LABEL` のキー集合が新 5 キーちょうどであり、旧矢印キーが残存しないことを固定。

```ts
it("ZONE_LABEL: keys are exactly the 5 new zone keys (no legacy arrows)", () => {
  expect(new Set(Object.keys(ZONE_LABEL))).toEqual(
    new Set(["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown"]),
  );
  expect(Object.keys(ZONE_LABEL).some((k) => k.includes("→"))).toBe(false);
});

it("SELECTABLE_ZONES: 4 selectable keys, unknown excluded, no arrows", () => {
  expect(SELECTABLE_ZONES).toEqual(["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus"]);
  expect(SELECTABLE_ZONES.some((z) => z.includes("→"))).toBe(false);
});
```

## §7 補助コマンド・対象範囲

```bash
# Phase 6 追加分を含む 4 ファイルの全 GREEN（focused）
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx

# 旧矢印値が enum / label / selectable / doc から消えたことの最終 grep
#（LEGACY_ZONE_MAP の互換キーのみ attendance-analytics.ts に残るのは正当）
rg -n '0→1|1→10|10→100' \
  packages/shared/src/zod/admin-attendance.ts \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts \
  docs/00-getting-started-manual/specs/01-api-schema.md
# → ヒット 0 を期待

# 型網羅性（Record<AttendanceZone,...> の 5 キー欠落検知）
mise exec -- pnpm typecheck
```

### 対象範囲（明示）

- **対象**: 出席回数帯 `AttendanceZone`（`@ubm-hyogo/shared`）に関わる API internals / repository 集計 /
  web label / KPI のみ。
- **非対象（テストも触れない）**: UBM 事業成長フェーズ zone（`byZone.ts` / `AboutUbm.tsx` /
  `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx`）。これらは `AttendanceZone` を import
  しないため、本 Phase の追加テストは一切参照しない。

## §8 回帰 guard サマリ（再発防止マップ）

| 再発リスク | 検知テスト |
| --- | --- |
| 100+ が `unknown` へ誤分類（元バグ） | A1（`100 → zone_100_plus`）・A3（property） |
| 99/100 の off-by-one | A1 |
| 無効値で例外 throw | A2 |
| `zoneFromCount` 返り値が enum 外 | A3 |
| 旧矢印値の enum 再導入 | A4 |
| `totalMembers=0` でゼロ除算（NaN/Infinity） | A5 |
| `ZONE_LABEL` への旧キー残存・キー欠落 | A6・typecheck |

## 完了条件（Phase 6）

- [ ] off-by-one（99/100・9/10・0/1）境界テストが追加された（A1）。
- [ ] 負値 / NaN / Infinity の fail path（throw しない）が固定された（A2）。
- [ ] `zoneFromCount` 返り値 × `AttendanceZoneZ.safeParse` の property 的 4 面一致テストが追加された（A3）。
- [ ] 旧矢印 enum 値が enum から消えたことの回帰 guard が追加された（A4）。
- [ ] `totalMembers=0` のゼロ除算回避（`uniqueAttendanceRate=0`）が固定された（A5）。
- [ ] `ZONE_LABEL` / `SELECTABLE_ZONES` の旧キー不在・網羅 guard が追加された（A6）。
- [ ] 別ドメイン zone を一切参照していないことが対象範囲で明示された。
