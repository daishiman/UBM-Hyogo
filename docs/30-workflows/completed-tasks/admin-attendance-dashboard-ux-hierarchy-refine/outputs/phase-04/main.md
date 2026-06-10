# Phase 4 — テスト戦略概要（TDD Red 設計）

> 上流: `phase-04.md` / `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md`。下流: `outputs/phase-05/runbook.md`（Green 化手順）。
> 本ファイルはテスト戦略の概要。個別ケースは `./test-plan.md`（TC-XX）を参照。

## 1. テスト分類

| 区分 | 対象 | spec ファイル | 種別 |
| --- | --- | --- | --- |
| (A) 純粋関数 unit | `attendanceFollowLevel(count): "none" \| "warn"` | `__tests__/attendanceFollowLevel.spec.ts`（新規） | unit |
| (B) PRIMARY hero component | `KpiPanel`（hero 化後）/ `AttendanceAbsenteeAlert`（hero 化後） | `__tests__/AttendancePrimaryHero.spec.tsx`（新規）+ `__tests__/KpiPanel.spec.tsx`（追従） | component（happy-dom） |
| (C) DETAIL タブ component | `AttendanceDetailTabs`（新規） | `__tests__/AttendanceDetailTabs.spec.tsx`（新規） | component（happy-dom + fireEvent） |
| (D) 既存 spec 追従 | `AttendanceTrendChart` / `AttendanceZoneDistributionChart` / `format-attendance` / `buildExportUrl` | 既存 4 spec | 追従（最小） |

## 2. テスト基盤・書式（既存踏襲）

- ランナー: vitest + happy-dom（`apps/web` の既存 component spec と同一環境）。
- ライブラリ: `@testing-library/react`（`render` / `screen` / `cleanup` / `fireEvent`）。
- 定型: 各 spec 冒頭で `afterEach(() => cleanup());`。`import { afterEach, describe, expect, it } from "vitest";`。
- 既存ファイル（`KpiPanel.spec.tsx` / `AttendanceTrendChart.spec.tsx`）の書式を逐語踏襲する。新規 import を増やさない。
- **新規 test ファイルは `*.spec.{ts,tsx}` のみ**（invariant #8。`*.test.*` 禁止）。配置は既存と同じ `apps/web/src/features/admin/attendance/__tests__/`。

### 2.1 Segmented タブ = internal state（[VSCPKR-03]）

- `AttendanceDetailTabs` のタブ選択は `useState<DetailTabKey>("session"|"member"|"top10")` の **internal state**。親から制御しない。
- テスト操作はクリックで状態遷移を起こす:
  ```ts
  fireEvent.click(screen.getByRole("radio", { name: "会員別" }));
  ```
  `Segmented` は各 option を `<button role="radio" aria-label={label}>` で描画するため、`getByRole("radio", { name })` で取得できる（`Segmented.tsx` 実装裏取り済）。
- 初期表示は `initialTab ?? "session"`。初期タブ body のみ描画され、他タブ body は DOM 非存在であることを assert する（排他表示 = AC-3）。

### 2.2 `vi.stubGlobal` 不使用（[FB-VSCPKR-02]）

- 本タスクのテスト対象 component は **server fetch（`window.api` / `fetchAttendanceAnalyticsBundle`）を内部で呼ばない**。`AttendanceDetailTabs` / `KpiPanel` / `AttendanceAbsenteeAlert` は props で受け取ったデータ（`SafeResult` / view 型）を描画するだけのため、グローバルモックは不要。
- 仮に window モックが必要になった場合も `vi.stubGlobal` を使わず `Object.defineProperty(window, "api", { ... })` を用いる方針を維持する。ただし本 Phase の TC ではモックは発生しない設計とする。

## 3. 既存 5 spec の追従方針

| spec | 現状 | 追従要否 | 方針 |
| --- | --- | --- | --- |
| `KpiPanel.spec.tsx` | 5 枚 KPI の testid（rate/attendees/unique/avg/sessions）を assert | **要追従** | hero 化で `attendance-kpi-rate` を PRIMARY hero へ昇格（`--ubm-text-3xl`）。既存 testid（`attendance-kpi-rate` / `attendance-kpi-unique` / `attendance-kpi-attendees` / `attendance-kpi-avg` / `attendance-kpi-sessions`）は**維持**し、hero/secondary の構造変更分のみ追加検証する（後述 TC-11/12）。delta / 0除算の既存ケースは不変で維持 |
| `AttendanceTrendChart.spec.tsx` | empty placeholder / polyline / circle を assert | 不要（testid 維持確認のみ） | 描画内容不変。TREND ゾーン移設は親側変更のため本 spec は変更しない |
| `AttendanceZoneDistributionChart.spec.tsx` | 横棒描画 assert | 不要（testid 維持確認のみ） | 同上 |
| `format-attendance.spec.ts` | `formatRate` / `formatDelta` 等 | 不要（不変） | lib 変更なし |
| `buildExportUrl.spec.ts` | CSV export URL 構築 | 不要（不変） | lib 変更なし |

> 追従の核心は `KpiPanel.spec.tsx` のみ。既存 testid を破壊しないことで MINOR（spec 追従）を最小化する（Phase 3 申し送り）。

## 4. Red 宣言

- 本 Phase 時点では `attendanceFollowLevel` / `AttendanceDetailTabs` / hero 化が未実装のため、新規 3 spec（`attendanceFollowLevel.spec.ts` / `AttendanceDetailTabs.spec.tsx` / `AttendancePrimaryHero.spec.tsx`）の全 TC は **fail（Red）が正常**。
- `KpiPanel.spec.tsx` の追従 TC（hero 構造）も Phase 5 実装前は fail。
- Phase 5（実装）で全 TC を Green 化し、Phase 6 で fail path（TC-E-XX）を追加する。

## 5. ローカル実行コマンド（対象限定 / `_shared-context.md` §9）

repo ルートが vitest root のため、対象を絶対パスで限定する:

```bash
# attendance feature 全 spec
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .

# 個別 spec
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx --root .
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance/__tests__/attendanceFollowLevel.spec.ts --root .
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance/__tests__/AttendancePrimaryHero.spec.tsx --root .
```

> 注: `--root .`（repo ルート）を付けないと「No test files found」で exit 1 になる既知の罠（メモリ既知）。

## 6. AC ↔ TC マッピング（要約）

| AC | 検証 TC（test-plan.md） |
| --- | --- |
| AC-1（PRIMARY hero: 出席率特大 + delta + ユニーク率 / 要フォロー数） | TC-11, TC-12, TC-01〜TC-03 |
| AC-3（DETAIL Segmented 排他タブ） | TC-04, TC-05, TC-06 |
| AC-4（要フォロー件数でトーン切替 / `data-attendance-follow`） | TC-01, TC-02, TC-03, TC-13, TC-14 |
| AC-8（レスポンシブ grid クラス） | TC-15, TC-16 |
| AC-9（a11y: radiogroup / 見出し階層） | TC-07, TC-17 |
| AC-10（SafeResult degrade 維持） | TC-08, TC-09, TC-10 |
