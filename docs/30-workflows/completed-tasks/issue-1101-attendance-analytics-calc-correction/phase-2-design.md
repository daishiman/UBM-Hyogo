# Phase 2: 設計

本タスクの**正本設計**。Phase 4 以降の全 Phase はこの設計に従う。

## §0 要件レビュー（真の論点）

1. **真の論点**: 「`AttendanceZone` という単一文字列型が、API 内部分類 / shared schema / web ラベル / filter 入力 の 4 役割を兼ねているため、`unknown` の責務（分類不能フォールバック）と正常な高頻度帯（100+）が衝突している」。表記の問題ではなく**型の責務過負荷**が主問題。
2. **依存・境界**: enum は API repository（生成元）→ shared schema（契約正本）→ web label/filter（消費）→ doc（記述）へ一方向に流れる。shared schema を正本に据え、生成元と消費を同一変更セットで揃えれば乖離は閉じる。
3. **価値とコスト**: 価値 = 管理者が 100+ 出席者を「不明」と誤認しなくなる + 延べ/unique を正しく読める。コスト最大部品 = enum 値変更による既存テスト・filter 互換の波及。→ 互換マッピングをテストで固定して吸収。
4. **改善優先順位**: (a) zone 境界バグ修正（誤分類の解消）> (b) enum 機械可読化（乖離防止の構造改善）> (c) unique 指標追加（情報拡充）。3 つは同一型・同一ファイル群に触れるため 1 サイクル 1 PR で完結させる（CONST_007）。
5. **4 条件評価**: 価値性○（誤分類解消）/ 実現性○（read-only SELECT のみ・migration 無し）/ 整合性○（shared 正本で 4 面同期）/ 運用性○（grep gate で旧値残存を検出）。

## §1 AttendanceZone enum 再設計（ユーザー確定・推奨案）

### 新 enum 定義（`packages/shared/src/zod/admin-attendance.ts`）

```ts
export const AttendanceZoneZ = z.enum([
  "zone_0",        // 0 回（未出席）
  "zone_1_9",      // 1〜9 回
  "zone_10_99",    // 10〜99 回
  "zone_100_plus", // 100 回以上（新設・旧 unknown 誤分類の解消先）
  "unknown",       // 分類不能（負値 / NaN 等のフォールバック専用）
]);
export type AttendanceZone = z.infer<typeof AttendanceZoneZ>;
```

### `zoneFromCount`（`attendance-analytics.ts`）

```ts
const zoneFromCount = (count: number): AttendanceZone => {
  if (!Number.isFinite(count) || count < 0) return "unknown";
  if (count === 0) return "zone_0";
  if (count <= 9) return "zone_1_9";
  if (count <= 99) return "zone_10_99";
  return "zone_100_plus";
};
```

- 入力: メンバーの累計（または期間内）出席回数。
- 出力: 5 種の `AttendanceZone`。
- 副作用: なし（純粋関数）。
- ガード戦略: 無効値は例外を投げず `unknown` を返す（防御的・[WEEKGRD-02] 準拠）。

### `normalizeZone`（旧矢印値の互換吸収）

```ts
const LEGACY_ZONE_MAP: Record<string, AttendanceZone> = {
  "0→1": "zone_0",
  "1→10": "zone_1_9",
  "10→100": "zone_10_99",
};

const normalizeZone = (raw: unknown): AttendanceZone => {
  if (typeof raw !== "string") return "unknown";
  if (
    raw === "zone_0" || raw === "zone_1_9" ||
    raw === "zone_10_99" || raw === "zone_100_plus" || raw === "unknown"
  ) {
    return raw;
  }
  return LEGACY_ZONE_MAP[raw] ?? "unknown";
};
```

- 旧矢印値（`"0→1"` 等）は互換マッピングで新キーへ。未知値は `unknown`。
- これにより AC-2「互換入力として残す場合は明示的にテスト」を満たす。

### `counts` Record / `zones` 配列（`listZoneDistribution`）

```ts
const counts: Record<AttendanceZone, number> = {
  zone_0: 0, zone_1_9: 0, zone_10_99: 0, zone_100_plus: 0, unknown: 0,
};
const zones: AttendanceZone[] = ["zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown"];
// 既存の filter（unknown は count>0 の時だけ行に残す）は踏襲
```

## §2 overallRate / unique 指標の定義（ユーザー確定・推奨案）

### overview response shape（additive）

`AttendanceOverviewExtZ` に 2 field を additive で追加（`.strict()` 維持）:

```ts
export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
  uniqueAttendeeCount: z.number().int().nonnegative(),   // 新規
  uniqueAttendanceRate: z.number().min(0).max(1),        // 新規
}).strict();
```

> `AttendanceOverviewZ`（viewmodel.ts）= `{ totalSessions, totalMembers, overallRate }`。`overallRate` はここに既存。本タスクでは viewmodel は変更せず、Ext 側に unique を追加する。

### 定義（4 面一致の正本）

| 指標 | 定義 | 分母 | 分子 |
| --- | --- | --- | --- |
| `overallRate`（延べ率） | 出席イベント総数 / 出席可能枠総数 | `totalSessions × totalMembers` | `attendCount`（延べ出席数） |
| `uniqueAttendeeCount` | 期間内に 1 回以上出席した active member の実人数 | — | `COUNT(DISTINCT member_id)` |
| `uniqueAttendanceRate` | 期間内に 1 回以上出席した会員割合 | `totalMembers` | `uniqueAttendeeCount` |

### `computeAttendanceOverviewExt` の SQL 追加

`fetchOverviewRow` の SELECT に DISTINCT 集計を 1 列追加（read-only・既存 period clause / active 条件踏襲）:

```sql
(SELECT COUNT(DISTINCT ma.member_id)
   FROM member_attendance ma
   JOIN meeting_sessions s ON s.session_id = ma.session_id
   JOIN member_identities mi ON mi.member_id = ma.member_id
   LEFT JOIN member_status ms ON ms.member_id = mi.member_id
   WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0 <period>) AS uniqueAttendeeCount
```

```ts
// computeAttendanceOverviewExt 内
const uniqueAttendeeCount = cur.uniqueAttendeeCount ?? 0;
const uniqueAttendanceRate = cur.totalMembers > 0
  ? Math.min(1, Math.max(0, uniqueAttendeeCount / cur.totalMembers))
  : 0;
```

`OverviewRow` interface に `uniqueAttendeeCount: number` を追加。`bind` の period binds は **3 セット**になる（totalSessions / attendCount / uniqueAttendeeCount の各サブクエリ）。既存は 2 セット bind のため bind 順序を SELECT 出現順に合わせて修正する（**実装時の最大の注意点**・Phase 5 §注意 参照）。

## §3 web label / KPI 追従

### `format-attendance.ts`

```ts
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
  "zone_0", "zone_1_9", "zone_10_99", "zone_100_plus",
];
```

### `KpiPanel.tsx`（unique タイル追加）

`KpiPanel` の `<section>` 内に Card を 1 枚追加（`overview.uniqueAttendanceRate` / `overview.uniqueAttendeeCount` を consume）:

```tsx
<Card
  label="unique 出席率"
  value={formatRate(overview.uniqueAttendanceRate)}
  hint={`期間内 1 回以上出席した会員割合（${overview.uniqueAttendeeCount} 名）`}
  testId="attendance-kpi-unique"
/>
```

- 既存 4 タイル（rate / attendees / avg / sessions）は維持。unique タイルを追加して 5 タイルにする。
- props は `AttendanceOverviewExt`（unique field 追加済み）から読むため、KpiPanel の props 追加は不要。

## §4 filter 互換（旧 bookmark URL）の扱い

- web 側 `read-attendance-filter.ts` / API 側 `parse-attendance-filter.ts` は `SELECTABLE_ZONES` / `AttendanceZoneZ.safeParse` 経由。新キーへ更新すれば**新 URL は整合**する。
- 旧 bookmark（`?zone=0→1`）は `AttendanceZoneZ.safeParse("0→1")` が fail → その zone は無視（filter 適用されず全件）。これは「400 を返さない・不正値は fallback」の既存方針（doc §400 は返さない）と整合し、**実害なし**（フィルタが緩くなるだけ）。
- 設計判断: API filter parse 層（`parse-attendance-filter.ts`）でも旧矢印値を救済するかは **任意**。AC-2 は repository `normalizeZone` の互換マッピング + テストで満たすため、`parse-attendance-filter.ts` の旧値救済は **本タスクでは行わない**（scope を repository 内 normalize に限定）。旧 URL 救済が必要なら未タスク候補（Phase 12 で記録）。

## §5 4 面一致マップ（zone enum）

| キー | API `zoneFromCount` | shared `AttendanceZoneZ` | web `ZONE_LABEL` | doc `01-api-schema.md` |
| --- | --- | --- | --- | --- |
| `zone_0` | count===0 | member | 0 回（未出席） | `0 → 'zone_0'` |
| `zone_1_9` | 1..9 | member | 1〜9 回 | `1..9 → 'zone_1_9'` |
| `zone_10_99` | 10..99 | member | 10〜99 回 | `10..99 → 'zone_10_99'` |
| `zone_100_plus` | >=100 | member | 100 回以上 | `>=100 → 'zone_100_plus'` |
| `unknown` | <0 / NaN | member | 分類不能 | フォールバック専用 |

## §6 状態所有権・データフロー

```
member_attendance (D1, read-only)
  └─ attendance-analytics.ts [生成: zoneFromCount / unique 集計]   ← API
       └─ AttendanceOverviewExtZ / AttendanceZoneZ [契約正本]      ← shared
            ├─ KpiPanel / ZONE_LABEL / filter [消費・表示]          ← web
            └─ 01-api-schema.md [記述]                              ← doc
```

- D1 は SELECT のみ（不変条件 #5 / migration 無し）。
- route 層（`attendance.ts`）は passthrough のみ・**非変更**。

## §7 ライブラリ選定

- 新規ライブラリ採用なし。zod / 既存 SQL のみ。

## 完了条件（Phase 2）

- [ ] enum 再設計・rate 定義・SQL・web 追従・doc 追従・4 面一致マップが確定。
- [ ] bind 順序修正（unique サブクエリ追加に伴う period binds 3 セット）が明記された。
- [ ] filter 互換方針（repository normalize で吸収・parse 層は scope 外）が確定。
- [ ] 別ドメイン zone（成長フェーズ）非変更が再確認された。
