# 出席分析の計算意味論是正（出席回数帯の境界 + 延べ/unique 集計 + 全体出席率の定義）

> 親タスク: `admin-attendance-dashboard-ux`（`apps/web` の出席ダッシュボード UI/UX 是正）
> 本ファイル: 親タスクから **分離した計算意味論是正タスク** の Issue-ready 実装仕様書
> 実施場所: 本 `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/`（後続 Issue 化候補・未着手）

---

## メタ情報

```yaml
task_id_candidate: admin-attendance-analytics-calc-correction
issue_number: null            # 後続 Issue 化時に採番
category: api-calc-correction  # apps/api の純関数集計ロジック是正
priority: 中                   # 数値の正確性に関わる品質改善・ブロッカーではない
scope: apps/api                # apps/web は親タスクで完結済（本タスクは API スコープ）
size: 中規模                   # 単一ファイル中心 + shared 型 + spec doc + test。2-3 Phase / 2-5 日
```

| 項目 | 値 |
| --- | --- |
| 実装区分 | **[実装区分: 実装仕様書]**（純関数・集計ロジックのコード変更を伴う・CONST_004） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（API 集計ロジック・純関数の変更。UI は親タスク管轄） |
| spec_classification | `implementation_spec` |
| workflow_state | `spec_created`（本仕様書作成時点。実装は後続サイクル / Issue 化後） |
| 主変更対象 | `apps/api/src/repository/attendance-analytics.ts` |

---

## 1. 背景 / 親タスクから分離した理由

親タスク `admin-attendance-dashboard-ux`（`apps/web` の出席ダッシュボード UI/UX 崩れ是正）の Phase 1 要件定義
（AC-9）および Phase 3 設計レビューにおいて、出席分析には **UI の見た目崩れ**とは別軸の
**計算意味論（数式そのもの）の妥当性問題**が存在することが確認された。

ユーザーは親タスク Phase 1 の質問 Q1 で「両方（出席回数帯の境界・出席率/出席者数の定義）を別タスクに分離」を
明示指示した。分離の根拠は以下の 3 点である:

| 分離根拠 | 内容 |
| --- | --- |
| **回帰リスク** | `zoneFromCount`・`overallRate` は `apps/api` の純関数集計ロジック。境界や分母を変えると zone-distribution / ranking / absentees / export / overview の全出力値が変動し、既存 spec・既存 UI 表示・既存 test が一斉に影響を受ける。UI の CSS 修正（親タスク）とは回帰範囲が桁違いに広い |
| **ユーザー Q1 の明示的分離指示** | 親タスク Phase 1 で「両方を別タスクに分離」とユーザーが明示。CONST_007（1 サイクル完結）の例外条件（ユーザー明示の分離指示 + 実施場所明記）に該当 |
| **`apps/api` スコープ** | 親タスクは `apps/web` に閉じる（不変条件 #1 #5: 既存 API のみ接続）。本是正は `apps/api` の集計層を変更するため、スコープが別レイヤーに跨る。親タスクの UI ラベルは**現行境界に忠実**に振ってあり、両タスクは独立して安全に実装できる（依存関係は §9 参照） |

> 親タスクは「境界を変えずに正確に説明する」方針（UI ラベルを現行 `zoneFromCount` 境界に忠実に表記）で完結している。
> 本タスクは「境界・分母そのものを直感的かつ正確な定義へ是正する」ことを目的とし、実施時には親タスクの UI ラベル文言の追従更新を伴う。

---

## 2. 問題詳細（実コードで確認済み）

### 問題 1: 出席回数帯（zone）の境界設計と命名の乖離

`apps/api/src/repository/attendance-analytics.ts:48-53`:

```ts
const zoneFromCount = (count: number): AttendanceZone => {
  if (count <= 0) return "0→1";    // 0 回
  if (count <= 9) return "1→10";   // 1〜9 回
  if (count <= 99) return "10→100"; // 10〜99 回
  return "unknown";                 // 100 回以上
};
```

zone キー（矢印表記 `"0→1"` / `"1→10"` / `"10→100"`）が**実際の回数帯と乖離**している:

| zone キー（矢印表記） | 実際に分類される回数帯 | 直感とのズレ |
| --- | --- | --- |
| `"0→1"` | **0 回ちょうど**（`count <= 0`） | 「0 から 1」と読めるが実態は「0 回のみ」 |
| `"1→10"` | **1〜9 回**（`count <= 9`） | 「1 から 10」と読めるが上限は 9 回（10 は含まない） |
| `"10→100"` | **10〜99 回**（`count <= 99`） | 「10 から 100」と読めるが上限は 99 回（100 は含まない） |
| `"unknown"` | **100 回以上**（`else`） | 100 回以上が "unknown"（不明）に落ちるのは明確な意味論バグ |

問題は 2 層ある:

- **命名問題**: 矢印 `→` 表記が「範囲の上限を含むか」を曖昧にし、`100 回以上`が `unknown` に落ちる。
- **境界の妥当性問題**: なぜ `1 / 10 / 100`（10 の冪）で切るのかに UBM の実運用上の根拠がない。会合は月次想定で
  年間 12 回・数年累計でも数十回規模であり、`10〜99 回` の帯が広すぎて分布の山が 1 帯に集中し、`100 回以上` は
  実質ほぼ発生しない（= `unknown` が空帯）。**運用実態に即した境界**（例: 未出席 / 低頻度 / 中頻度 / 高頻度）への再設計が望ましい。

### 問題 2: 延べ vs unique の集計意味論と全体出席率の定義

`computeAttendanceOverviewExt`（`attendance-analytics.ts:118-152`）と `fetchOverviewRow`（`:90-116`）:

```ts
// fetchOverviewRow: attendCount = member_attendance × active session × active member の COUNT(*)
//   → これは「延べ出席数」（1 メンバーが N セッション出席すると N とカウント）
const denom = cur.totalSessions * cur.totalMembers;          // 全 active member × 全 active session
const overallRate = denom > 0 ? cur.attendCount / denom : 0; // 延べ出席数 / (理論上の全出席枠)
```

問題点:

| 観点 | 現状の問題 |
| --- | --- |
| **延べ vs unique** | 親タスクの KPI「期間内出席者数」は `bySession` の `attendeeCount` 合計 = **延べ出席数**であり、**unique 出席者数ではない**。`listAttendanceTrend`（`:266-299`）には既に `unique_member_count`（`COUNT(DISTINCT member_id)`）の前例があり、overview にも unique 指標を併設できる |
| **分母に全メンバー固定** | `overallRate` の分母 `totalMembers` は「`member_status.is_deleted=0` の現在 active な全メンバー」を**期間に無関係に固定**。期間フィルタで `totalSessions` は絞られるが `totalMembers` は現在値。**期間内に在籍していなかったメンバー**（後から入会）や**期間内非アクティブ会員**も分母に含まれ、出席率が実態より低く出る |
| **退会者の扱い** | `is_deleted=1`（退会者）は分母・分子双方から除外されるが、「退会前は出席していた」履歴は `member_attendance` に残るため、`attendCount` 側で active member に JOIN して除外する設計（`:102-106`）と整合は取れているものの、**期間内に退会したメンバーの当時の出席を率に反映しない**ため、過去期間の率が実態とズレる |

`overallRate` の妥当な定義（分母を「期間内に出席可能だったメンバー × その期間のセッション」にするか、
unique 出席率 = `unique 出席者数 / 期間内 active メンバー数` を別 KPI として併設するか）の見直しが必要。

---

## 3. スコープ（含む / 含まない）

### 含む

- `apps/api/src/repository/attendance-analytics.ts` の `zoneFromCount` 境界・命名の再設計。
- `overallRate` の定義見直し（延べ率 / unique 率の整理・分母の母集団是正）と、必要に応じた unique 指標の追加。
- 上記に追従する `@ubm-hyogo/shared`（`packages/shared/src/zod/admin-attendance.ts`）の `AttendanceZone` enum
  および overview スキーマの更新。
- API 仕様 doc（`docs/00-getting-started-manual/specs/01-api-schema.md` の §Zone 派生 / §集計母数）の是正。
- `apps/api` 配下の attendance-analytics test の境界値・unique・退会者ケース更新/追加。
- 親タスク `apps/web` の UI ラベル（`format-attendance.ts` の `ZONE_LABEL` / `ZONE_HELP`）の**追従更新**
  （= 新境界・新定義に文言を合わせる。詳細は §9 依存関係）。

### 含まない

- 親タスク `admin-attendance-dashboard-ux` が既に完了した CSS レイアウト復旧・SVG バー楕円修正は本タスク対象外。
- D1 schema（`member_attendance` / `meeting_sessions` / `member_status` / `member_identities`）の変更。
  集計は既存テーブルから純関数で導出するため migration 不要。
- Google Form schema・endpoint surface（route path / HTTP method）の変更。`/admin/dashboard/attendance/*` の
  URL とメソッドは不変。出力ペイロードの**値**は変わるが、**形（shape）は zone enum 値以外は維持**を原則とする。
- 新規 endpoint の追加。

---

## 4. 変更対象ファイル一覧

| パス | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` | 改修（純関数・集計ロジック） | `zoneFromCount` 境界/命名再設計、`computeAttendanceOverviewExt` / `fetchOverviewRow` の `overallRate` 定義見直し、unique 集計 helper 追加、`normalizeZone` の enum 追従 |
| `packages/shared/src/zod/admin-attendance.ts` | 改修（型定義） | `AttendanceZoneZ` enum 値の更新（矢印表記 → 回数帯表記。`:9`）、必要なら `AttendanceOverviewExtZ` に unique 指標フィールド追加（`:20-23`） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 改修（仕様 doc） | §Zone 派生（`:257-259`）の正規化規則、§集計母数（`:261-263`）の `overallRate` 定義を新仕様へ是正 |
| `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts` | 改修（既存 test） | `zoneFromCount: boundaries`（`:11-18`）を新境界・新 enum 値へ更新 |
| `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` | 改修（既存 test） | overview の率検証・zone-distribution 集計検証を新定義へ更新 |
| `apps/api/src/repository/__tests__/attendance-analytics-overview-rate.spec.ts` | 新規（追加 test・任意） | 延べ率 vs unique 率・退会者除外・期間内非アクティブ会員の分母扱いの境界ケースを集約（既存 repository spec に追記でも可） |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 改修（追従・親タスク資産） | `ZONE_LABEL` / `ZONE_HELP` を新境界・新 enum 値に追従更新 |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 改修（追従・親タスク資産） | 上記ラベル更新に伴う期待値更新 |

> 実装着手前に `apps/api/src/routes/admin/dashboard.ts`（zone クエリ parse・enum 受け口）と
> `apps/web` 側の zone フィルタ・CSV 列が新 enum 値に追従するかを grep で確認すること
> （`rg -n '"0→1"|"1→10"|"10→100"' apps/api apps/web packages/shared`）。

---

## 5. 設計案

### 5.1 `zoneFromCount` 境界 / 命名の再設計

**A. 命名是正（最優先・低リスク）**: enum 値を「範囲の意味が一意に読める回数帯表記」へ改める。
矢印表記をやめ、`100 回以上` が `unknown` に落ちるバグを解消する。提案 enum:

```ts
// 旧: "0→1" | "1→10" | "10→100" | "unknown"
// 新（案）: 運用実態（月次会合・年間十数回）に即した 4 帯 + 異常値帯
export type AttendanceZone =
  | "none"   // 0 回（未出席）        count <= 0
  | "low"    // 1〜4 回（低頻度）      1 <= count <= 4
  | "mid"    // 5〜11 回（中頻度）     5 <= count <= 11
  | "high"   // 12 回以上（高頻度）    count >= 12
  | "unknown"; // 異常値・分類不能のフォールバックのみ
```

> 境界の具体値（4 / 11 / 12 など）は UBM の年間会合回数（月次想定 ≈ 12 回/年）を基準にした提案であり、
> 実装着手時に実データの累計出席回数分布を確認して確定する（Phase での前提確認チェックに含める）。
> enum 値は機械可読キー（`none` 等の英小文字）に統一し、**日本語ラベルは UI 側 `ZONE_LABEL` のみで持つ**
> （API は値を返し、表示文言は apps/web が持つ adapter 方針を維持）。

```ts
const zoneFromCount = (count: number): AttendanceZone => {
  if (!Number.isFinite(count) || count < 0) return "unknown";
  if (count === 0) return "none";
  if (count <= 4) return "low";
  if (count <= 11) return "mid";
  return "high";
};
```

- 入力: `count: number`（メンバー単位の累計出席回数）
- 出力: `AttendanceZone`
- 副作用: なし（純関数）

`normalizeZone` も新 enum 値（`none|low|mid|high`）を許可し、未知値は `"unknown"` にフォールバックする。

### 5.2 unique 集計 helper と `overallRate` 定義是正

overview に「延べ率」と「unique 出席率」を**役割分担**で持たせる。既存 shape を壊さないため、
`overallRate` の意味を明確化し、unique 系を additive フィールドとして追加する案を推奨する。

```ts
// fetchOverviewRow 拡張: 延べ出席数 + unique 出席者数 + 期間内 active メンバー数を同時取得
interface OverviewRow {
  totalSessions: number;
  totalMembers: number;       // 既存: 現在 active な全メンバー（分母の母集団は §下記で再定義）
  attendCount: number;        // 延べ出席数（既存）
  uniqueAttendees: number;    // 追加: COUNT(DISTINCT member_id) = 期間内に 1 回以上出席した実人数
}

// overallRate（延べ率）の定義を明確化:
//   overallRate = attendCount / (totalSessions × eligibleMembers)
//   eligibleMembers = 「その期間に出席可能だったメンバー数」へ是正（退会日・入会日を考慮）
// uniqueAttendanceRate（追加 KPI・任意）:
//   uniqueAttendanceRate = uniqueAttendees / eligibleMembers
```

helper シグネチャ（純関数・read-only）:

| helper | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `zoneFromCount(count)` | `number` | `AttendanceZone` | なし |
| `computeOverallRate(attendCount, totalSessions, eligibleMembers)` | `number×3` | `number`（0..1 clamp） | なし |
| `computeUniqueRate(uniqueAttendees, eligibleMembers)` | `number×2` | `number`（0..1 clamp） | なし |

> 分母 `eligibleMembers` の確定は本タスクの設計判断点。最小案は現状維持（active member 固定）の上で
> **ラベル/doc を「延べ出席数 / (全 active メンバー × セッション数)」と正確に定義し直す**だけに留め、
> 退会日・入会日考慮の精緻化は更なる follow-up に分離してもよい（実装着手時に Phase 1 で確定）。
> その場合も unique 指標の追加と zone 命名是正は本タスクで完結させる。

### 5.3 入力・出力・副作用（不変条件）

- `attendance-analytics.ts` の対象関数は**すべて read-only**（D1 への write・mutation なし。`SELECT` のみ）。
- `zoneFromCount` / `computeOverallRate` / `computeUniqueRate` は **副作用なしの純関数**で、
  `__testInternals` に export して単体テスト可能にする（既存 export 方式 `:537-541` を踏襲）。
- 出力 shape は zod `.strict()` を維持。enum 値変更・フィールド追加時は `packages/shared` の Z スキーマを
  同時更新し、API contract と型を一致させる。

---

## 6. テスト方針

| 種別 | ファイル | ケース |
| --- | --- | --- |
| 既存更新 | `attendance-analytics-internals.spec.ts` | `zoneFromCount` の新境界値: `0→"none"`, `1→"low"`, `4→"low"`, `5→"mid"`, `11→"mid"`, `12→"high"`, `999→"high"`, 負値/NaN→`"unknown"`。`normalizeZone` が新 enum を許可し未知値を `"unknown"` に落とすこと |
| 既存更新 | `attendance-analytics.repository.spec.ts` | overview の `overallRate` が新定義で算出されること（延べ出席数 / 母数）、zone-distribution の集計が新境界で正しく分類されること |
| 新規/追加 | overview-rate 系 spec（新規 or repository spec へ追記） | **延べ率 vs unique 率の差**（同一メンバーが複数セッション出席するケースで延べ ≠ unique を検証）、**退会者除外**（`is_deleted=1` メンバーが分母・分子から除外）、**期間内非アクティブ会員の分母扱い**（分母定義に応じた期待値） |
| 境界値 | 上記 | enum 境界（`count==0` / `count==4` / `count==5` / `count==11` / `count==12`）、`overallRate` の 0..1 clamp（denom=0 で 0、過大値で 1） |
| 回帰 | 親タスク追従 | `format-attendance.spec.ts` の `ZONE_LABEL` 期待値が新 enum・新文言と一致 |

> 新規 test は `*.spec.ts` のみ（不変条件 #8: `*.test.*` 禁止）。co-location（`__tests__/`）を踏襲する。

---

## 7. ローカル実行・検証コマンド

```bash
# 型チェック（shared 型 + API + web の追従を一括検証）
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# apps/api の focused vitest（attendance-analytics 関連のみ）
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts

# 親タスク追従ラベルの test（apps/web）
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts

# 旧 enum 値の残存検出（全 drop すべき）
rg -n '"0→1"|"1→10"|"10→100"' apps/api apps/web packages/shared

# 親タスクと独立であること（本タスク単体コミット時は apps/web 差分が
# format-attendance 追従のみに限定されることを確認。境界変更を伴わない先行コミットでは空）
git diff --name-only apps/web
```

---

## 8. 完了条件（DoD）

- [ ] `zoneFromCount` の境界・enum 値が新仕様に是正され、`100 回以上`相当が `unknown` に落ちない。
- [ ] `overallRate` の定義（分母の母集団・延べ/unique の役割）が明確化され、必要な unique 指標が追加されている。
- [ ] **境界・集計の新定義が「コード（`attendance-analytics.ts`）」「型（`packages/shared` zod）」「仕様 doc
      （`01-api-schema.md` §Zone 派生 / §集計母数）」「test」の 4 者で一致**している。
- [ ] `packages/shared` の `AttendanceZoneZ` enum 値とコード `zoneFromCount` の返り値型が完全一致し、`.strict()` を維持。
- [ ] 親タスク（`apps/web`）の `ZONE_LABEL` / `ZONE_HELP` が新境界・新 enum 値に追従更新され、UI 表示と API 値が整合
      （= 親タスクで確立した「現行境界に忠実な表記」が、本タスクの新境界に矛盾なく移行している）。
- [ ] 旧矢印 enum 値（`"0→1"` / `"1→10"` / `"10→100"`）が `apps/api` / `apps/web` / `packages/shared` から消えている
      （`rg` で 0 件）。
- [ ] `mise exec -- pnpm typecheck && pnpm lint` green。attendance-analytics の focused vitest green。
- [ ] D1 migration なし・endpoint surface（path/method）不変・Google Form schema 不変（不変条件 #1 #5）。
      `git diff --name-only apps/api` が集計ロジック関連ファイルのみで、route 定義の path/method 変更を含まない。
- [ ] 回帰なし: 既存の trend（`unique_member_count`）・ranking・absentees・export の出力が、enum 値追従以外は
      意図した範囲でのみ変動し、テストで担保されている。

---

## 9. 依存関係 / 実施時期

### 親タスクとの独立性と依存

| 関係 | 内容 |
| --- | --- |
| **独立に着手可能** | 親タスク（`admin-attendance-dashboard-ux`）は `apps/web` の CSS/SVG/ラベルに閉じ、**現行 `zoneFromCount` 境界に忠実**な UI ラベルで完結している。本タスク（`apps/api` の境界/集計変更）と**実装レイヤーが分離**しているため、本タスクは親タスクの完了を待たず独立に着手できる |
| **追従更新が必須** | 本タスクが enum 値・境界を変更すると、親タスクが配線した `format-attendance.ts` の `ZONE_LABEL` / `ZONE_HELP`、zone フィルタ UI、CSV 列ラベルが**旧 enum 前提**で残るため、本タスク内で **apps/web 側ラベルの追従更新を同一変更セットに含める**（§4 / §6 の追従ファイル）。これを怠ると UI の表示文言と API 値が乖離する |
| **shared 型が境界面** | `packages/shared/src/zod/admin-attendance.ts` の `AttendanceZoneZ` enum が API・web 双方の契約境界。enum 変更はここを正本に、API（`zoneFromCount`）と web（`ZONE_LABEL`）の両側を同時更新する |

### 実施時期の推奨

- **親タスク（`admin-attendance-dashboard-ux`）のマージ後**に着手するのが安全。親タスクが先に UI を現行境界で
  安定させているため、本タスクは「境界変更 + ラベル追従」を 1 つの整合した変更として乗せられる。
- 着手時に Phase 1 前提確認で「実データの累計出席回数分布」を確認し、§5.1 の境界具体値（4/11/12）を確定する。
- 分母 `eligibleMembers` の精緻化（退会日・入会日考慮）は規模が膨らむ場合、`overallRate` の**定義明確化 + unique 指標追加**
  と**境界是正**を本タスクで完結させ、母集団の厳密化を更なる follow-up に再分離してもよい（§5.2 注記）。

---

## 10. 親タスクからの教訓（実装課題と解決策）

| 課題 | 発見経緯 | 解決策 | 教訓 |
| --- | --- | --- | --- |
| enum 値変更が API/web/shared/doc/test の 5 面に波及 | 親タスク Phase 3 で「計算意味論変更は回帰リスク大」と判定され分離された | shared zod を正本に、4 者一致を DoD で機械的に検証（`rg` で旧値 0 件確認） | 契約面（shared 型）を起点に同時更新しないと UI 表示と API 値が静かに乖離する |
| zone 表記の矢印 `→` が範囲の包含を曖昧化 | 親タスク Phase 1 根本原因表で「区画の意味不明」として UI ラベル是正済（現行境界に忠実） | API enum を機械可読キー（`none|low|mid|high`）化し、日本語ラベルは UI のみで持つ | 表示文言と機械可読キーを分離し、API は値・web は表記の責務分担を維持 |
| `100 回以上`が `unknown`（不明）に落ちる意味論バグ | 実コード `zoneFromCount` の `else → "unknown"` を確認 | 高頻度帯（`high`）を明示し、`unknown` を異常値フォールバック専用に限定 | フォールバック値に正常範囲を混在させない |
