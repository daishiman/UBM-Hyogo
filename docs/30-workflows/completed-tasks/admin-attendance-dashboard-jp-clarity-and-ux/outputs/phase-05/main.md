# Phase 5 — 実装方針概要（CONST_005）

> 上流: `outputs/phase-02/change-map.md`（唯一の正）/ `outputs/phase-04/test-plan.md`。下流: `./runbook.md`（後続実装者向け手順）。
> 本タスクは文字列置換中心。新規 component / primitive / util / 型 / CSS クラスはゼロ。

## 1. 変更対象ファイル（CONST_005）

| 種別 | パス | 変更内容 | 種別 |
| --- | --- | --- | --- |
| route | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | eyebrow / description 文言 | 編集 |
| component | `.../components/AttendanceAnalyticsPage.tsx` | h2/h3/intro/sectionLabel/ページ案内 | 編集 |
| component | `.../components/KpiPanel.tsx` | label/hint/support/aria-label | 編集 |
| component | `.../components/AttendanceAbsenteeAlert.tsx` | summary/empty 文言（+ U-01 CSS） | 編集 |
| component | `.../components/AttendanceDetailTabs.tsx` | DETAIL_OPTIONS label / sectionLabel | 編集 |
| component | `.../components/AttendanceFilterBar.tsx` | legend / export link 文言 | 編集 |
| component | `.../components/AttendanceTrendChart.tsx` | aria-label / empty / SVG title | 編集 |
| component | `.../components/AttendanceZoneDistributionChart.tsx` | empty / aria-label | 編集 |
| component | `.../components/SessionAttendanceTable.tsx` | empty 文言 | 編集 |
| lib | `.../lib/format-attendance.ts` | formatDelta 単位 / ZONE_HELP / PERIOD_PRESETS label | 編集 |
| style | `apps/web/src/styles/globals.css` | U-03 軽微 CSS（必要時のみ） | 編集（任意） |
| test | `__tests__/AttendanceZoneDistributionChart.spec.tsx` | T-01 追従 + 回帰 | 編集 |
| test | `__tests__/AttendanceDetailTabs.spec.tsx` | T-02〜T-04 追従 + 回帰 | 編集 |
| test | `__tests__/KpiPanel.spec.tsx` | 回帰追加 | 編集 |
| test | `__tests__/format-attendance.spec.ts` | 回帰追加 | 編集 |
| test | `__tests__/AttendanceAbsenteeAlert.spec.tsx` | 回帰追加 | 編集 |
| test | `playwright/tests/admin-attendance-dashboard-ux.spec.ts` | T-05/T-06 追従 | 編集 |

> **新規ファイルゼロ**。全て既存ファイルの編集。`apps/api` / `packages/shared` / `fetch-attendance.ts` は触れない。

## 2. 入出力・副作用（契約不変）

| 箇所 | 変更 | 不変（契約） |
| --- | --- | --- |
| `formatDelta` | 戻り単位 `pt`→`ポイント` | 入力型 / 戻り型 / 符号 / 小数桁 / null 処理 |
| `PERIOD_PRESETS` | `label` のみ | `id` / `monthsBack` → `presetToPeriod` / URL / フィルタ挙動 |
| `ZONE_HELP` | 定数文字列 | 参照箇所の DOM 構造 |
| 各 component | 表示文字列 / aria-label 文言 | testid / role / `data-*` キー / href / state |

副作用なし（純粋な文言置換）。データ fetch・URL 構築・modal 開閉・タブ排他は一切変えない。

## 3. テスト方針

- 既存テスト追従（T-01〜T-06）+ After 文言固定の回帰 it 追加（TC-RXX）。新規 spec ファイルは作らない。
- focused vitest: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__`。
- jsdom/happy-dom は CSS 非評価のため U-01/U-03 の見た目はクラス存在・構造で検証し、視覚は Phase 11 screenshot へ。

## 4. ローカル検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages/shared   # 空であること（AC-7）
# 英語 / 専門語残存 0（AC-1/2/3）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSV|セッション|ユニーク|トレンド|区画|出席回数帯" \
  apps/web/src/features/admin/attendance apps/web/app/\(admin\)/admin/dashboard/attendance
```

## 5. DoD（Definition of Done）

- [ ] change-map の全行が After 文言に置換されている
- [ ] T-01〜T-06 が新文言へ追従し focused vitest PASS
- [ ] 回帰 TC-RXX が追加され PASS
- [ ] `verify:tokens` pass（HEX 0）
- [ ] `git diff -- apps/api packages/shared` 空
- [ ] 残存 grep 0 件（テストコード内の `.not.toContain` / 説明文を除く）
- [ ] typecheck / lint pass
- [ ] 新規 component / primitive / util / 型ゼロ
