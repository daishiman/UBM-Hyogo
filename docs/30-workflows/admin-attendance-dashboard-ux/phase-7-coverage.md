# Phase 7: テストカバレッジ確認

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 4（テスト計画）/ Phase 5（実装 Green）/ Phase 6（テスト拡充・ZL/ZC/KP 実装）
- 本 Phase の責務: 本タスクで追加・変更したコード（`lib/format-attendance.ts` と 5 コンポーネント）の branch/line カバレッジを測定し、`coverage-standards.md` の閾値に整合させる。CSS（globals.css）は jsdom 非カバレッジのため Phase 11 視覚で担保する旨を明記する

## 目的

`coverage-standards.md`（正本）の **workspace 一律 80%**（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクの新規・変更コードが満たすことを確認する。
プロジェクト全体閾値は既存負債の影響を受けるため、`coverage-standards.md` §「個別ファイルカバレッジ計測」に従い **対象ファイルを絞り込んで個別計測**する。
CSS は jsdom で評価不能（カバレッジ対象外）であり、AC-1（レイアウト復旧）/ AC-5（見方ガイド・空状態）の実描画は Phase 11 視覚確認で担保する。

## 実行タスク

### 1. カバレッジ目標（coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | lib / components の変更ファイル |
| Branch Coverage | 80% | 90% | 同上 |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> 本ファイルの閾値は `index.md` メタ情報および各 phase の `## 完了条件` に必須記載する（coverage-standards.md §「全タスク必須 AC」）。
> 本タスクは UI/UX 編集タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。

### 2. カバレッジ対象ファイルと評価方針

| ファイル | カバレッジ評価 | 備考 |
| --- | --- | --- |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 計測対象（80%+） | `ZONE_LABEL` / `ZONE_HELP` は定数（分岐なし）。`formatRate` / `formatDelta` / `presetToPeriod` の分岐は既存 spec が網羅 |
| `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 計測対象（80%+） | 空配列分岐（`rows.length === 0`）+ 正常描画分岐の両方を新規 spec（ZC-5 / ZC-1..4,6）が網羅 |
| `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 計測対象（80%+） | `totalSessions > 0` 三項分岐 + `hint ? … : null` を既存 + KP 追記で網羅 |
| `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 参考値 | 本タスクでは空状態 class 付与のみ。空 / 非空分岐は既存挙動。新規 spec は追加しない（Phase 4 §2 対象外） |
| `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | 参考値 | legend 文言変更のみ（分岐不変）。`"use client"` で hooks 依存のため focused 計測対象外でも可 |
| `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 参考値 | async Server Component（`fetchAttendanceAnalyticsBundle` 依存）。`ok` 分岐は多数だが本タスク変更は表示要素追加のみ。新規テストなし |
| `apps/web/src/styles/globals.css` | **カバレッジ対象外** | CSS は jsdom で実行されずカバレッジに現れない。AC-1/5 は Phase 11 視覚で担保 |

> `vitest.config.ts`（ルート）の `coverage.exclude` は `apps/web/app/**/page.tsx` 等を除外するが、`.css` は元来 `include`（`apps/**/src/**/*.{ts,tsx}`）に含まれないため計測対象外。CSS の効きは jsdom では確認できず、Phase 4 §1 のとおり DOM class 存在 + Phase 11 視覚で担保する。
> `AttendanceAnalyticsPage.tsx`（async Server Component）・`AttendanceFilterBar.tsx`（`"use client"` + hooks）は本タスクで分岐ロジックを増やさないため、focused 計測の主対象は lib + Chart + KpiPanel の 3 ファイルとする（`coverage-standards.md` §「今回追加したコードのカバレッジを確認する目的」）。

### 3. vitest coverage 設定方針（既存設定の確認）

ルート `vitest.config.ts` の `test.coverage` は以下を既定とする（変更しない）:

| 設定 | 値 | 意味 |
| --- | --- | --- |
| `provider` | `v8` | V8 カバレッジ |
| `reporter` | `["text", "json-summary", "json", "lcov", "html"]` | text で即時確認・json-summary で機械集計 |
| `reportsDirectory` | `./coverage` | 出力先 |
| `include` | `apps/**/src/**/*.{ts,tsx}` ほか | `.css` は非含有（CSS 非計測） |
| `exclude` | `**/*.spec.{ts,tsx}` / `page.tsx` / `layout.tsx` ほか | spec / Next ルートファイル除外 |

> 本タスクで `vitest.config.ts` は **変更しない**（API 非変更ではないが、coverage 設定は既存方針を踏襲）。閾値判定は `scripts/coverage-guard.sh` が package 単位で 80% を強制する（`coverage-standards.md` §「workspace 一律 80% 強制経路」）。

### 4. 個別ファイルカバレッジ計測コマンド

プロジェクト全体閾値は既存負債の影響を受けるため、`--coverage.include` で本タスクの変更ファイルに絞って計測する（`coverage-standards.md` §「個別ファイルカバレッジ計測」）。

```bash
# attendance lib + components の変更ファイルを個別計測
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/features/admin/attendance/lib/format-attendance.ts' \
  --coverage.include='apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx' \
  --coverage.include='apps/web/src/features/admin/attendance/components/KpiPanel.tsx' \
  apps/web/src/features/admin/attendance/__tests__
```

text reporter の出力で対象 3 ファイルの `% Stmts` / `% Branch` / `% Funcs` / `% Lines` が **80% 以上**であることを確認する。

### 5. 判定フロー（coverage-standards.md §判定フロー）

| 状況 | 対処 |
| --- | --- |
| 個別計測が 80% を満たす | Phase 7 PASS → Phase 8（リファクタ）へ |
| プロジェクト全体集計が既存負債で閾値割れ | `--coverage.include` で対象を絞り個別計測（本 §4）。全体閾値割れは既存負債として別タスクに委ねる |
| 個別計測も 80% 未満 | Phase 6 へ戻りテスト追加（不足 branch を ZC / KP に補完） |

### 6. テスト数の実測記録（coverage-standards.md §テスト数記載基準）

Phase 9 / Phase 10 のテスト数記載に向け、本 Phase 実行時に実測値を取得する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/web/src/features/admin/attendance/__tests__
```

> 実測値のみ使用し（推定値禁止）、実行コマンドと実行日時を成果物に記録する。本タスクの想定 spec 構成: `format-attendance.spec.ts`（既存 4 + ZL 2 = 6 ケース）/ `AttendanceZoneDistributionChart.spec.tsx`（ZC 6 ケース）/ `KpiPanel.spec.tsx`（既存 3 + KP 5 = 8 ケース）/ `AttendanceTrendChart.spec.tsx`（既存 2・回帰）/ `buildExportUrl.spec.ts`（既存・回帰）。実数は実行時の verbose 出力で確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・大規模ファイル・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | `coverage` provider / include / exclude / reporter |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| テスト拡充 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-6-test-additions.md` | 計測対象 spec（ZL/ZC/KP） |
| 実装 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-5-implementation.md` | カバレッジ対象の変更ファイル |
| 計測対象 lib | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 定数 + フォーマット関数 |
| 計測対象 component | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` / `KpiPanel.tsx` | 分岐網羅対象 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 個別カバレッジ計測結果 | runtime | 対象 3 ファイルの Stmts/Branch/Funcs/Lines（≥80%）を Phase 11 `manual-test-result.md` に記録 |
| テスト数実測値 | runtime | `--reporter=verbose` の実行結果・コマンド・日時 |
| 本 Phase 7 仕様書 | 文書 | カバレッジ目標・計測方法・CSS 非カバレッジ方針 |

## 統合テスト連携

- Phase 6 の spec が Green の状態で本 Phase の個別計測を実施し、不足 branch があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC-8 判定根拠に用いる。
- Phase 11（user-gated）で CSS（globals.css・jsdom 非カバレッジ）の実描画（AC-1 レイアウト・AC-5 見方ガイド / 空状態）を staging 実機で視覚確認し、カバレッジで担保できない領域を補完する。

## 完了条件

1. `format-attendance.ts` / `AttendanceZoneDistributionChart.tsx` / `KpiPanel.tsx` の個別カバレッジが Line/Branch/Function/Statement とも **80% 以上**（推奨 90%）である。
2. プロジェクト全体閾値が既存負債で割れる場合、`--coverage.include` 個別計測で本タスク新規コードの 80% 達成が確認されている。
3. CSS（globals.css）は jsdom 非カバレッジであり、AC-1 / AC-5 を Phase 11 視覚で担保する旨が明記されている。
4. テスト数は実測値（`--reporter=verbose`）で取得し、コマンドと実行日時が記録されている（推定値不使用）。
5. カバレッジ閾値（80%）が `index.md` メタ情報および本 Phase の完了条件に記載されている。
