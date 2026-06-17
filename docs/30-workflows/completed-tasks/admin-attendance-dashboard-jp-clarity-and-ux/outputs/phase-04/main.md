# Phase 4 — テスト戦略概要

> 上流: `phase-04.md` / `outputs/phase-02/change-map.md`。下流: `outputs/phase-05/runbook.md`（Green 化手順）。
> 個別ケースは `./test-plan.md`（追従 T-NN + 回帰 TC-XX）。

## 1. テスト 3 分類

| 区分 | 目的 | 対象 spec | 種別 |
| --- | --- | --- | --- |
| (A) 既存テスト追従 | Before 文字列依存アサートを After 文言へ更新（放置すると CI fail） | `AttendanceZoneDistributionChart.spec.tsx` / `AttendanceDetailTabs.spec.tsx` / `playwright/.../admin-attendance-dashboard-ux.spec.ts` | 追従編集 |
| (B) 回帰（After 文言固定） | 日本語化した文言が将来戻らないよう逐語固定 | `KpiPanel.spec.tsx`（既存編集）/ `format-attendance.spec.ts`（既存編集）/ 上記 (A) 内に追記 | 回帰 it 追加 |
| (C) DOM contract 不変確認 | testid / role / aria キー / href が壊れないこと | 全 attendance spec（既存アサートが pass し続ける） | 不変確認 |

> **新規 spec ファイルは作らない**。本タスクは文言置換のため、既存 spec ファイルに追従編集 + 回帰 it を追記する（invariant #8: `*.spec.{ts,tsx}` のみ・本タスクは既存ファイル編集のみ）。

## 2. テスト基盤・書式（既存踏襲）

- ランナー: vitest + happy-dom（attendance 既存 component spec と同一環境）。
- ライブラリ: `@testing-library/react`（`render` / `screen` / `cleanup` / `fireEvent`）。
- 定型: 各 spec 冒頭で `afterEach(() => cleanup());`。`import { afterEach, describe, expect, it } from "vitest";`。
- `AttendanceDetailTabs.spec.tsx` は既に `vi.mock("next/navigation", ...)` + `safeOk` / `safeErr` を使用。これを踏襲し新規 import を増やさない。

### 2.1 internal state（[VSCPKR-03]）

- `AttendanceDetailTabs` のタブ選択は `useState<DetailTabKey>("session")`。親制御しない。
- テスト操作はクリックで状態遷移:
  ```ts
  fireEvent.click(screen.getByRole("radio", { name: "出席が多い順" })); // 旧 "TOP10"
  ```
- **label を変えても `value`（`"session" / "member" / "top10"`）は不変**のため、排他描画ロジック（testid `attendance-by-session-table` 等）は変わらない。radio の取得名（`name`）だけが After 文言に追従する。

### 2.2 `vi.stubGlobal` 不使用（[FB-VSCPKR-02]）

- 対象 component はいずれも props でデータ（`SafeResult` / view 型 / overview）を受け取り描画するのみ。server fetch を内部で呼ばない。
- よってグローバルモックは不要。仮に必要でも `vi.stubGlobal` ではなく `Object.defineProperty(window, ...)` を使う方針を維持する（本 Phase の TC では発生しない）。

## 3. DOM contract 不変の確認方針（AC-8）

| 不変対象 | 確認方法 |
| --- | --- |
| testid（`attendance-kpi-rate` 等） | 既存アサート（`getByTestId`）が After 実装でも pass |
| role（`group` / `radiogroup` / `radio`） | aria-label 文言を変えても `getByRole(role, { name: 新文言 })` で取得可能 |
| href（export link） | `attendance-export-link` の `href` 値は変えない（文言のみ変更）。テストで href 不変を確認可 |

## 4. focused vitest コマンド（repo ルートが root の罠）

```bash
# attendance feature の全 spec（追従 + 回帰）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__

# 個別
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts
```

> `--root=.` / `--config=vitest.config.ts` + `apps/web/...` フルパスを付けないと「No test files found」になる（include glob が monorepo root 基準のため。メモリ既知の罠）。

## 5. visual baseline 要否（MINOR M-2）

- 文言変更（`PRIMARY`→`全体の状況` 等）は画面の描画テキストを変えるため、`playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` の visual snapshot に**意図的差分**が生じる。
- これは「破壊」ではなく「意図的更新」。baseline 再取得は staging visual 環境で行い user-gated（Phase 11 / 13）。
- **判定: visual baseline 再取得が必要**。Phase 11 の screenshot-plan（mode: VISUAL）に「文言日本語化に伴う baseline 更新」を申し送る。

## 6. AC ↔ テスト マッピング（要約）

| AC | 検証（test-plan.md） |
| --- | --- |
| AC-1（英語→日本語） | TC-R01〜R04（PERIOD ラベル / DetailTabs radio / sectionLabel）+ grep（Phase 6） |
| AC-2（セッション→開催回） | TC-R05（DetailTabs / KpiPanel / AbsenteeAlert）+ T-03 + grep |
| AC-3（専門語→平易） | TC-R06〜R08（formatDelta `ポイント` / KpiPanel `一度でも参加した人の割合` / Zone `出席回数べつの人数`）+ T-01/T-05/T-06 |
| AC-8（DOM 不変） | TC-D01（testid / role / href 維持） |
| AC-9（追従 + 回帰） | T-01〜T-06 + 全 TC-RXX |
| AC-10（挙動不変） | TC-D02（DetailTabs 排他・href 不変・degrade 維持） |
