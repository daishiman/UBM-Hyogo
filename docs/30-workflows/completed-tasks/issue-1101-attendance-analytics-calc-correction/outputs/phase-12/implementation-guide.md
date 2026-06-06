# 実装ガイド（issue-1101-attendance-analytics-calc-correction）

出席分析の計算意味論（zone 境界・延べ/unique rate）是正の実装ガイド。
Part 1 は中学生レベルの例え話、Part 2 は開発者向けの型・SQL・定数・エラーハンドリングを示す。

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に理由）

学校の部活で「今学期、何回練習に来たか」を 0 回 / 1〜9 回 / 10〜99 回 / 100 回以上 のグループに分けて貼り出すとします。
ところが今のシステムは、いちばん熱心に来た「100 回以上の人」を、なぜか **「よくわからない人（分類できない人）」** の箱に入れてしまっています。
本当は「すごくたくさん来た人」なのに「正体不明の人」扱いになってしまう。これはおかしいので直す必要があります。

### 何が壊れているか（たとえば）

たとえば、出席回数を仕分けする係の人が「99 回までは仕分けできるけど、100 回を超えたらルールに書いてないから『わからない箱』に入れる」という間違った手順書を持っている状態です。
「わからない箱」は本来、回数がマイナスだったり、数えられない壊れたデータ（NaN）のような **本当に異常なもの専用** の箱です。
そこに「いちばん頑張った人」が混ざってしまうと、管理者が名簿を見たとき「この熱心な人、なんで不明なの？」と誤解してしまいます。

### 何をするか（やること）

1. 仕分けのルールに「100 回以上の人は『100 回以上』の箱に入れる」という新しい箱（`zone_100_plus`）を追加します。
2. 「わからない箱（unknown）」は、回数がマイナスや壊れたデータのときだけ使うように戻します。
3. 箱の名前を、矢印つきの見た目だけの名前（`0→1` など）から、機械が読みやすい名前（`zone_0` など）に付け替えます。表示用の日本語（「0 回（未出席）」など）は別に持ちます。
4. 昔の名前でブックマークしていた人のために、古い矢印名 → 新しい名前の **言い換え表**（互換マッピング）を用意して、混乱しないようにします。

### 延べ（のべ）と実人数のちがい（たとえば）

もうひとつ直すのは「人数の数え方」です。
たとえば、ある会に「太郎くんが 3 回、花子さんが 2 回」来たとします。

- **延べ（のべ）出席**: 来た回数を全部足したもの。3 + 2 = **5 回ぶん**。「述べ率」はこの 5 を、開催回数 × 全会員数で割った割合です。
- **実人数（ユニーク）**: 1 回でも来た人の **頭数**。太郎くんと花子さんで **2 人**。「ユニーク出席率」はこの 2 人を全会員数で割った割合です。

同じ出席でも「のべ 5」と「実 2 人」は意味が違います。今は「のべ」しか出ていないので、「実際に何人が顔を出したか」を表す数字（`uniqueAttendeeCount` / `uniqueAttendanceRate`）を新しく足します。

### やること・やらないこと

- やること: 出席分析の zone 仕分け・延べ/実人数の指標・画面のラベルと KPI タイルの追従。
- やらないこと: 会員企業の「成長フェーズ（立ち上げ→拡大→組織化）」の zone。これも見た目が `0→1` などで似ていますが、出席回数とは **まったく別の話** なので絶対に触りません。

### 専門用語セルフチェック

| 用語 | やさしい言い換え |
| --- | --- |
| zone（ゾーン） | 出席回数の仕分けの箱 |
| unknown（アンノウン） | 「本当に正体不明」専用の箱（マイナス・壊れたデータ用） |
| 延べ（overallRate） | 来た回数を全部足した割合 |
| 実人数（uniqueAttendeeCount） | 1 回でも来た人の頭数 |
| enum（イーナム） | 決まった選択肢だけを許す名前のリスト |
| 互換マッピング | 古い名前を新しい名前に言い換える表 |

## Part 2: 技術詳細（開発者レベル）

### 全体方針

`AttendanceZone` という単一文字列型が「API 内部分類 / shared schema / web ラベル / filter 入力」の 4 役割を兼ねており、`unknown`（分類不能フォールバック）と正常な高頻度帯（100+）が衝突していた。
shared zod schema を契約正本に据え、生成元（API repository）→ 契約（shared）→ 消費（web）→ 記述（doc）を **1 サイクル 1 PR** で同期する。enum は表示文字列と分離した snake_case 機械可読キーへ再設計する。

### TypeScript 型定義（`packages/shared/src/zod/admin-attendance.ts`）

```ts
// AttendanceZone enum 再設計（旧矢印値を排除し 100+ 帯を新設）
export const AttendanceZoneZ = z.enum([
  "zone_0",        // 0 回（未出席）
  "zone_1_9",      // 1〜9 回
  "zone_10_99",    // 10〜99 回
  "zone_100_plus", // 100 回以上（新設・旧 unknown 誤分類の解消先）
  "unknown",       // 分類不能（負値 / NaN 等のフォールバック専用）
]);
export type AttendanceZone = z.infer<typeof AttendanceZoneZ>;

// AttendanceOverviewExt に unique 指標を additive 追加（.strict() 維持）
export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
  uniqueAttendeeCount: z.number().int().nonnegative(), // 新規: 期間内 1 回以上出席の実人数
  uniqueAttendanceRate: z.number().min(0).max(1),      // 新規: uniqueAttendeeCount / totalMembers（0..1 clamp）
}).strict();
```

additive な追加であり既存 field は削除しない。`.strict()` を維持するため、追加 field は schema・生成元・消費側を同一 wave で揃える必要がある。

### API/関数シグネチャ（`apps/api/src/repository/attendance-analytics.ts`）

```ts
// zoneFromCount: 出席回数 → AttendanceZone（純粋関数・例外を投げない）
const zoneFromCount = (count: number): AttendanceZone => {
  if (!Number.isFinite(count) || count < 0) return "unknown"; // 異常値のみ unknown
  if (count === 0) return "zone_0";
  if (count <= 9) return "zone_1_9";
  if (count <= 99) return "zone_10_99";
  return "zone_100_plus"; // 旧 else の "unknown" を是正
};

// normalizeZone: 任意入力（旧矢印値含む）→ AttendanceZone
const normalizeZone = (raw: unknown): AttendanceZone => { /* 新キーはそのまま / 旧矢印は LEGACY_ZONE_MAP / 他は unknown */ };
```

`zoneFromCount` の出力集合は `AttendanceZoneZ` の enum 集合と完全一致する（AC-4）。

### 定数一覧（`LEGACY_ZONE_MAP` / `LEGACY_ATTENDANCE_ZONE_MAP` / `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP`）

| 定数 | 配置 | 値 |
| --- | --- | --- |
| `LEGACY_ZONE_MAP` / `LEGACY_ATTENDANCE_ZONE_MAP` | `attendance-analytics.ts` / `parse-attendance-filter.ts` / `read-attendance-filter.ts` | `{ "0→1": "zone_0", "1→10": "zone_1_9", "10→100": "zone_10_99" }`（旧矢印値の互換吸収専用） |
| `ZONE_LABEL` | `format-attendance.ts` | `zone_0:"0 回（未出席）"` / `zone_1_9:"1〜9 回"` / `zone_10_99:"10〜99 回"` / `zone_100_plus:"100 回以上"` / `unknown:"分類不能"` |
| `SELECTABLE_ZONES` | `format-attendance.ts` | `["zone_0","zone_1_9","zone_10_99","zone_100_plus"]`（`unknown` を除く 4 種） |
| `ZONE_HELP` | `format-attendance.ts` | 「出席回数帯は、各メンバーの累計出席回数を 0 / 1〜9 / 10〜99 / 100 回以上 で分類したものです。分類不能は集計対象外の異常値です。」 |

### SQL（DISTINCT 集計）と bind 順序の注意

`computeAttendanceOverviewExt` の `fetchOverviewRow` SELECT に DISTINCT 集計列を 1 列追加する（read-only・既存 period clause / active 条件踏襲）。

```sql
(SELECT COUNT(DISTINCT ma.member_id)
   FROM member_attendance ma
   JOIN meeting_sessions s ON s.session_id = ma.session_id
   JOIN member_identities mi ON mi.member_id = ma.member_id
   LEFT JOIN member_status ms ON ms.member_id = mi.member_id
   WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0 <period>) AS uniqueAttendeeCount
```

```ts
const uniqueAttendeeCount = cur.uniqueAttendeeCount ?? 0;
const uniqueAttendanceRate = cur.totalMembers > 0
  ? Math.min(1, Math.max(0, uniqueAttendeeCount / cur.totalMembers))
  : 0;
```

**bind 順序の最大の注意点**: 既存 SELECT は totalSessions / attendCount の **2 セット** の period bind を持つ。unique サブクエリを追加すると period bind は **3 セット** になる。
`bind(...)` の引数列を **SELECT 内のサブクエリ出現順（totalSessions → attendCount → uniqueAttendeeCount）に厳密一致** させること。bind 順序ずれは「件数が他の指標の値にすり替わる」サイレントバグになり、型チェックでは検出できない。

### 使用例（KPI タイル / `KpiPanel.tsx`）

```tsx
// 既存 4 タイルに unique タイルを 1 枚追加（props は AttendanceOverviewExt から consume）
<Card
  label="unique 出席率"
  value={formatRate(overview.uniqueAttendanceRate)}
  hint={`期間内 1 回以上出席した会員割合（${overview.uniqueAttendeeCount} 名）`}
  testId="attendance-kpi-unique"
/>
```

`KpiPanel` の props 型は変更不要（`AttendanceOverviewExt` に field が additive で乗るため）。

### エラーハンドリング

- `zoneFromCount`: 無効値（`!Number.isFinite` / 負値）は **例外を投げず `unknown` を返す**（防御的・[WEEKGRD-02] 準拠）。
- `normalizeZone`: `string` 以外、または新キー・旧矢印キーのいずれにも一致しない値は `unknown` にフォールバック。
- `uniqueAttendanceRate`: `totalMembers === 0` のとき 0 を返す（ゼロ除算回避）。それ以外は `Math.min(1, Math.max(0, ...))` で 0..1 にクランプ。
- filter parse: 旧 bookmark URL（`?zone=0→1`）は API query parser と web query reader の互換マッピングで新キーへ正規化する。未知値は drop し、全 drop なら null / 空配列に戻す既存方針を維持する。

### エッジケース・既知制限

- `count === 0` は `zone_0`（未出席）であり `unknown` ではない。境界 `9/10`・`99/100` を spec で固定する。
- `zone_100_plus` 行は count>0 のときのみ distribution 行に残す既存 filter を踏襲（常時表示は M-2 で UI 判断）。
- API filter parse 層（`parse-attendance-filter.ts`）と web query reader（`read-attendance-filter.ts`）の旧矢印値救済は **本タスク内で実装済み**。AC-2 は repository `normalizeZone`、API query parser、web query reader の互換マッピング + テストで満たす。
- 別ドメイン（UBM 成長フェーズ zone）の `0→1` 等は **非変更**。Phase 9 grep gate で touch ゼロを保証する。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
git diff --name-only -- apps/api/migrations apps/api/src/routes   # 差分ゼロ期待（AC-8）
rg -n '"0→1"|"1→10"|"10→100"' apps/api/src apps/web/src/features/admin/attendance packages/shared  # AttendanceZone 由来ゼロ期待
```

## 視覚証跡

本タスクの visualEvidence は `VISUAL` だが、UI 変更は **label 文言（`ZONE_LABEL` / `ZONE_HELP`）と KPI タイル 1 件追加（`attendance-kpi-unique`）に限定**され、レイアウト・CSS・配色の変更を伴わない。
そのため **主証跡は Phase 11 の component test（focused vitest / jsdom）** とし、ラベル文字列・KPI 値・additive field の consume を直接検証する。
local Playwright fixture screenshot は `outputs/phase-11/screenshots/TC-11-issue1101-attendance-analytics-desktop.png` / `...-mobile.png` として取得済み。
staging 認証済みスクリーンショット（production-equivalent 実データ描画 baseline）は **user-gated** であり本サイクルでは取得しない。
詳細は [../phase-11/manual-test-result.md](../phase-11/manual-test-result.md) を参照。
