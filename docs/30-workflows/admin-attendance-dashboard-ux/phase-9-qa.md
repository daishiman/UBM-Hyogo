# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1〜8 完了（要件・設計・実装・リファクタ）
- 本 Phase の責務: AC-1..AC-9 の検証手順を一覧化し、全ゲートを通過させる

## QA 概要

本タスクは `apps/web` のみを変更する（AC-7 で API 無変更を gate）。検証は以下 5 区分で行う:

1. 型チェック・リント（静的解析）
2. Focused vitest（単体テスト）
3. デザイントークン gate（HEX / arbitrary color 禁止確認）
4. API 非変更確認（grep / git diff gate）
5. AC-1..AC-9 の目視・DOM 確認（Phase 11 runtime は user-gated 別途）

## 実行タスク

### タスク 1: 静的解析（typecheck / lint）

```bash
# 型チェック: import 解決・型整合を確認
mise exec -- pnpm typecheck

# リント: eslint 違反確認
mise exec -- pnpm lint
```

**期待結果**: どちらも exit 0（エラー 0 件）。

### タスク 2: focused vitest 実行

対象テストを絞って高速に確認する:

```bash
mise exec -- pnpm exec vitest run \
  --root=. \
  --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
```

**期待結果**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `format-attendance.spec.ts`（更新） | `ZONE_LABEL` の新値（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）、`ZONE_HELP` の export（AC-3） | PASS |
| `AttendanceZoneDistributionChart.spec.tsx`（新規） | 0% バー幅が 0、凡例キャプション `.attendance-zone-legend` 描画（AC-2/3） | PASS |
| `KpiPanel.spec.tsx`（更新） | 「期間内出席者数」の hint が延べ出席数表記、4 KPI すべてに hint が付くこと（AC-4） | PASS |
| `AttendanceTrendChart.spec.tsx`（既存・回帰確認） | 既存テストの回帰がないこと | PASS |

### タスク 3: デザイントークン gate（AC-6）

```bash
# (1) globals.css に HEX / oklch 直書きがないこと
grep -nE '(oklch\(|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' \
  | grep -v -- '--ubm-color-' \
  && echo "[FAIL: HEX or raw oklch found]" || echo "[PASS: token-only]"

# (2) attendance 配下 TSX に arbitrary color がないこと
grep -rnE '(bg|text|border)-\[#' apps/web/src/features/admin/attendance \
  && echo "[FAIL: arbitrary color found]" || echo "[PASS: no arbitrary colors]"

# (3) pnpm verify:tokens
mise exec -- pnpm verify:tokens
```

**期待結果**: 3 コマンドすべてが PASS / green。

### タスク 4: API 非変更確認（AC-7）

```bash
# apps/api への git diff が空であること
git diff --name-only -- apps/api \
  | grep . \
  && echo "[FAIL: apps/api was modified]" || echo "[PASS: apps/api untouched]"

# D1 migration / Google Form schema が変更されていないこと
git diff --name-only -- apps/web/migrations/ \
  | grep . \
  && echo "[FAIL: D1 migration modified]" || echo "[PASS: migrations untouched]"
```

**期待結果**: どちらも PASS（出力なし）。

### タスク 5: 変更ファイル10件の存在確認

```bash
# 変更 10 ファイルが diff に含まれること
git diff --name-only HEAD | grep -E \
  "globals\.css|\
AttendanceZoneDistributionChart\.tsx|\
AttendanceTop10Ranking\.tsx|\
KpiPanel\.tsx|\
AttendanceFilterBar\.tsx|\
AttendanceAnalyticsPage\.tsx|\
format-attendance\.ts|\
format-attendance\.spec\.ts|\
AttendanceZoneDistributionChart\.spec\.tsx|\
KpiPanel\.spec\.tsx"
```

**期待結果**: 上記 10 ファイルがすべて差分として現れる。

## AC-1..AC-9 チェックボックス表

| AC | 条件要旨 | 検証手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `.attendance-*` レイアウト CSS が `globals.css` に追加され、KPI グリッド / フィルタバー横並び / 2 カラムチャートグリッドが定義されている | `grep -n "attendance-kpi-grid\|attendance-filter-bar\|attendance-charts-grid" apps/web/src/styles/globals.css` がヒットすること | [ ] |
| AC-2 | `.attendance-zone-bar` / `.attendance-top10-bar` が `block-size: 0.5rem`、`Math.max(2, …)` → `Math.max(0, …)` 是正済み | `AttendanceZoneDistributionChart.spec.tsx` PASS / Phase 2 CSS 定義確認 | [ ] |
| AC-3 | `ZONE_LABEL` が回数表記に更新、`ZONE_HELP` が export、フィルタ legend が「出席回数帯」、凡例キャプション描画 | `format-attendance.spec.ts` 更新 PASS / `AttendanceZoneDistributionChart.spec.tsx` PASS / `grep "出席回数帯" apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` ヒット | [ ] |
| AC-4 | KPI「期間内出席者数」の hint が延べ出席数表記、4 KPI すべてに hint 付き | `KpiPanel.spec.tsx` PASS | [ ] |
| AC-5 | 見方ガイド（`.attendance-page-guide`）・各セクション 1 行説明（`.attendance-section-intro`）・スタイル付き空状態が追加 | `grep -n "attendance-page-guide\|attendance-section-intro" apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` ヒット / Phase 11 目視 | [ ] |
| AC-6 | 色は token 経由のみ、HEX / arbitrary 色なし、`verify:design-tokens` green | タスク 3 の 3 コマンドが全 PASS | [ ] |
| AC-7 | `apps/api` / D1 migration / Google Form schema 無変更 | タスク 4 の git diff 空 | [ ] |
| AC-8 | typecheck / lint / focused vitest green | タスク 1 / タスク 2 が全 PASS | [ ] |
| AC-9 | 計算是正が `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` に分離されている | `ls docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md` が存在 | [ ] |

## 追加 grep gate（HEX と任意色の明示確認）

```bash
# apps/web/src 配下に新規 HEX 直書きがないこと（attendance 配下限定）
grep -rnE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/features/admin/attendance \
  apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' \
  && echo "[FAIL: raw hex found]" || echo "[PASS]"

# bg-[#…] / text-[#…] 形式の arbitrary color がないこと（attendance 配下限定）
grep -rnE '(bg|text|border|fill|stroke)-\[#' \
  apps/web/src/features/admin/attendance \
  && echo "[FAIL: arbitrary color]" || echo "[PASS]"
```

## 検証コマンドまとめ（一括実行用）

```bash
# 1. 型チェック・リント
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. focused vitest
mise exec -- pnpm exec vitest run \
  --root=. \
  --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__

# 3. デザイントークン gate
grep -nE '(oklch\(|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' | grep -v -- '--ubm-color-' \
  && echo "[FAIL]" || echo "[PASS: token-only globals.css]"
grep -rnE '(bg|text|border)-\[#' apps/web/src/features/admin/attendance \
  && echo "[FAIL]" || echo "[PASS: no arbitrary colors]"
mise exec -- pnpm verify:tokens

# 4. API / migration 非変更
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
git diff --name-only -- apps/web/migrations/ | grep . && echo "[FAIL]" || echo "[PASS: migrations untouched]"

# 5. 変更 10 ファイル確認
git diff --name-only HEAD | grep -E \
  "globals\.css|AttendanceZoneDistributionChart\.(tsx|spec\.tsx)|AttendanceTop10Ranking\.tsx|KpiPanel\.(tsx|spec\.tsx)|AttendanceFilterBar\.tsx|AttendanceAnalyticsPage\.tsx|format-attendance\.(ts|spec\.ts)"
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| AC 正本 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-1-requirements.md` | AC-1..AC-9 定義 |
| 設計正本 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-2-design.md` | CSS / ラベル設計の根拠 |
| 設計レビュー | `docs/30-workflows/admin-attendance-dashboard-ux/phase-3-design-review.md` | 不変条件適合・grep gate コマンド参照 |
| unassigned タスク | `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md` | AC-9 の分離先仕様書 |
| デザイントークン | `apps/web/src/styles/tokens.css` | token 名確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | QA チェックリスト・検証コマンド・AC マッピング |
| 各 spec ファイルの PASS 証跡 | runtime | Phase 11 `manual-test-result.md` に記録 |

## 統合テスト連携

- focused vitest PASS が Phase 10 最終レビューの「AC-8 green」判定根拠となる。
- タスク 3・4 の gate PASS が Phase 10 の AC-6・AC-7 判定根拠となる。
- Phase 11 では本 Phase で確認できない「実 pixel 表示確認」を user-gated として追加する。

## 完了条件

1. `pnpm typecheck` / `pnpm lint` が exit 0。
2. focused vitest（上記 4 spec）が全 PASS。
3. デザイントークン gate 3 コマンドが全 PASS / `verify:design-tokens` green。
4. `git diff --name-only -- apps/api` および `apps/web/migrations/` が空（出力なし）。
5. AC-1..AC-9 チェックボックスが全チェック済みとなるか、未確認項目が Phase 11 runtime 境界として明記されている。
