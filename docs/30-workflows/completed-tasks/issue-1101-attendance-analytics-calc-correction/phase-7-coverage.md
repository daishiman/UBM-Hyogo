# Phase 7: テストカバレッジ確認

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 前提: Phase 4（テスト計画 RED）/ Phase 5（実装 Green）/ Phase 6（テスト追加・fail path / 回帰 guard）
- 本 Phase の責務: 本タスクで **変更したファイルに限定** して line/branch カバレッジを測定し、`coverage-standards.md` の閾値（80%）に整合させる。全体一律指定はせず、変更ファイルローカルの分岐網羅を実測する（[Feedback BEFORE-QUIT-002]）

## 目的

`coverage-standards.md`（正本）の **workspace 一律 80%**（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクの新規・変更コードが満たすことを確認する。
プロジェクト全体閾値は既存負債の影響を受けるため、`coverage-standards.md` §「個別ファイルカバレッジ計測」に従い **対象ファイルを変更ファイルへ絞り込んで個別計測** する。
全体一律 `--coverage` 指定は既存負債で閾値割れするため使わない（[Feedback BEFORE-QUIT-002]）。

## カバレッジ目標（coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | 下記「計測対象」の変更ファイルのみ |
| Branch Coverage | 80% | 90% | 同上 |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> 本ファイルの閾値は `index.md` メタ情報および本 Phase の `## 完了条件` に記載する（coverage-standards.md §「全タスク必須 AC」）。
> 本タスクは計算ロジック是正タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。

## 計測対象ファイル（変更ファイルに限定）

カバレッジ計測は**本タスクで変更した production コード**に限定する。spec ファイル自体・別ドメイン・本タスク非変更ファイルは計測対象から除外する。

| ファイル | カバレッジ評価 | 重点分岐 | 担保 spec |
| --- | --- | --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` | 計測対象（80%+） | `zoneFromCount` の全 5 分岐 + 負値 / NaN、`normalizeZone` の新 5 キー + 旧 3 キー + garbage、`computeAttendanceOverviewExt` の unique 計算（`totalMembers > 0` / `=0`） | `attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` |
| `packages/shared/src/zod/admin-attendance.ts` | 計測対象（参考値） | `AttendanceZoneZ` enum / `AttendanceOverviewExtZ.extend(...).strict()` は宣言的で分岐なし。zod parse は repository spec / web spec 経由で間接網羅 | repository spec / format-attendance.spec.ts |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 計測対象（80%+） | `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` は定数（分岐なし）。`formatRate` 等の既存分岐は既存 spec が網羅 | `format-attendance.spec.ts` |
| `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 計測対象（80%+） | unique タイル追加分の `hint ? … : null` / `value` 描画分岐 | `KpiPanel.spec.tsx` |

### 計測対象外（既存・本タスク非変更）の明記

| ファイル | 除外理由 |
| --- | --- |
| `apps/api/src/routes/admin/attendance.ts` | route 層は passthrough のみ・**本タスク非変更**（不変条件 #1）。分岐ロジックを増やさないため計測対象外 |
| `apps/api/src/lib/parse-attendance-filter.ts` | 旧 bookmark URL 救済は scope 外（Phase 2 §4）。`safeParse` 経由の型整合のみ・新規分岐追加なし |
| `apps/web/src/features/admin/attendance/lib/read-attendance-filter.ts` | `SELECTABLE_ZONES` 経由の型整合のみ・本タスク非変更 |
| `apps/web/src/lib/admin/fetch-attendance.ts` | `AttendanceZone` 型 import のみ・本タスク非変更 |
| `apps/api/src/routes/admin/_shared/byZone.ts` / `apps/web/src/components/public/AboutUbm.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx` | **別ドメイン（UBM 事業成長フェーズ zone）・絶対非変更**。`AttendanceZone` を import していない。Phase 9 grep gate で非接触を保証 |
| 各 `*.spec.ts(x)` | spec ファイルは `vitest.config.ts` の `coverage.exclude`（`**/*.spec.{ts,tsx}`）で除外済み |

## vitest coverage 設定方針（既存設定の確認・変更しない）

ルート `vitest.config.ts` の `test.coverage` は既定を踏襲する（**変更しない**）:

| 設定 | 値 | 意味 |
| --- | --- | --- |
| `provider` | `v8` | V8 カバレッジ |
| `reporter` | `["text", "json-summary", "json", "lcov", "html"]` | text で即時確認・json-summary で機械集計 |
| `reportsDirectory` | `./coverage` | 出力先 |
| `include` | `apps/**/src/**/*.{ts,tsx}` / `packages/**/src/**/*.{ts,tsx}` | 計測母集合 |
| `exclude` | `**/*.spec.{ts,tsx}` / `page.tsx` / `layout.tsx` ほか | spec / Next ルートファイル除外 |

## 個別ファイルカバレッジ計測コマンド（変更ファイルローカル実測）

プロジェクト全体閾値は既存負債の影響を受けるため、`--coverage.include` で **本タスクの変更ファイルに限定** して計測する（[Feedback BEFORE-QUIT-002]）。

### API 側（zoneFromCount / normalizeZone / unique 計算）

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/api/src/repository/attendance-analytics.ts' \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts
```

text reporter の出力で `attendance-analytics.ts` の `% Stmts` / `% Branch` / `% Funcs` / `% Lines` が **80% 以上** であることを確認する。

### web 側（label 定数 / KpiPanel unique タイル）

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/features/admin/attendance/lib/format-attendance.ts' \
  --coverage.include='apps/web/src/features/admin/attendance/components/KpiPanel.tsx' \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

## 変更行ローカルの分岐網羅チェックリスト（実測必須）

text reporter の **Uncovered Line #s** 列が以下の分岐を取りこぼしていないことを確認する。

### `zoneFromCount(count)` — 全 5 分岐 + 異常値

| ケース | 入力 | 期待 zone | 対応 branch |
| --- | --- | --- | --- |
| 負値 | `-1` | `unknown` | `count < 0` |
| NaN / Infinity | `NaN` / `Infinity` | `unknown` | `!Number.isFinite(count)` |
| ゼロ | `0` | `zone_0` | `count === 0` |
| 下限帯 / 上限帯 | `1` / `9` | `zone_1_9` | `count <= 9` |
| 中帯 境界 | `10` / `99` | `zone_10_99` | `count <= 99` |
| 高頻度帯 境界 | `100` / `1000` | `zone_100_plus` | 最終 else（AC-1 核心） |

> 境界値 `9`/`10`/`99`/`100` を必ず両側で取り、off-by-one branch を変更行ローカルで実測する。

### `normalizeZone(raw)` — 新 5 キー + 旧 3 キー + garbage

| ケース | 入力 | 期待 zone | 対応 branch |
| --- | --- | --- | --- |
| 新キー素通し（5 種） | `"zone_0"` ... `"zone_100_plus"` / `"unknown"` | 同値 | 早期 return（5 キー全て） |
| 旧矢印互換（3 種） | `"0→1"` / `"1→10"` / `"10→100"` | `zone_0` / `zone_1_9` / `zone_10_99` | `LEGACY_ZONE_MAP[raw]` |
| 未知文字列 | `"garbage"` | `unknown` | `?? "unknown"`（fallback） |
| 非文字列 | `123` / `null` / `undefined` | `unknown` | `typeof raw !== "string"` |

### `computeAttendanceOverviewExt` の unique 計算 — 2 分岐

| ケース | 入力 | 期待 | 対応 branch |
| --- | --- | --- | --- |
| 通常 | `totalMembers > 0` | `uniqueAttendeeCount / totalMembers`（0..1 clamp） | 三項 truthy |
| 母数ゼロ | `totalMembers === 0` | `0`（ゼロ除算回避） | 三項 falsy |
| clamp 上限 | `uniqueAttendeeCount > totalMembers`（異常データ） | `1`（`Math.min(1, …)`） | clamp 分岐 |
| null 合体 | `cur.uniqueAttendeeCount` が `null`/`undefined` | `0`（`?? 0`） | nullish 合体 |

## テスト数の実測記録（coverage-standards.md §テスト数記載基準）

Phase 9 / Phase 10 のテスト数記載に向け、本 Phase 実行時に実測値を取得する（推定値禁止）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

> 実測値のみ使用し、実行コマンドと実行日時を Phase 11 `manual-test-result.md` に記録する。`attendance-analytics.repository.spec.ts` は D1 binding 必須のため、ローカル実行環境（`vitest` の D1 fixture）を要する点に注意。

## 判定フロー（coverage-standards.md §判定フロー）

| 状況 | 対処 |
| --- | --- |
| 個別計測が 80% を満たす | Phase 7 PASS → Phase 8（リファクタ）へ |
| プロジェクト全体集計が既存負債で閾値割れ | `--coverage.include` で**変更ファイルへ絞り込み**個別計測（本 Phase の方針）。全体閾値割れは既存負債として別タスクに委ねる |
| 個別計測も 80% 未満 | Phase 6 へ戻り不足 branch を補完（上記チェックリストの取りこぼし分岐を spec へ追加） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | `coverage` provider / include / exclude / reporter |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| 設計正本 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-2-design.md` | `zoneFromCount` / `normalizeZone` / unique 計算の分岐根拠 |
| 計測対象（API） | `apps/api/src/repository/attendance-analytics.ts` | `zoneFromCount` / `normalizeZone` / `computeAttendanceOverviewExt` |
| 計測対象（web） | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` / `components/KpiPanel.tsx` | label 定数 / unique KPI タイル |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 個別カバレッジ計測結果 | runtime | 変更ファイルの Stmts/Branch/Funcs/Lines（≥80%）を Phase 11 `manual-test-result.md` に記録 |
| 分岐網羅チェックリスト結果 | runtime | `zoneFromCount` 5+2 / `normalizeZone` 5+3+garbage / unique 計算 2+clamp の Uncovered Line ゼロ確認 |
| テスト数実測値 | runtime | `--reporter=verbose` の実行結果・コマンド・日時 |
| 本 Phase 7 仕様書 | 文書 | 変更ファイル限定のカバレッジ目標・計測方法・分岐チェックリスト |

## 統合テスト連携

- Phase 6 の spec が Green の状態で本 Phase の個別計測を実施し、不足 branch があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC-7 判定根拠に用いる。
- 計測対象を変更ファイルへ限定したことを Phase 10 最終レビューでも再確認する（全体一律指定を採らない理由の trace）。

## 完了条件

1. `attendance-analytics.ts` / `format-attendance.ts` / `KpiPanel.tsx` の個別カバレッジが Line/Branch/Function/Statement とも **80% 以上**（推奨 90%）である。
2. カバレッジ計測対象が **本タスクの変更ファイルに限定** され、全体一律指定を採らない方針が明記されている（[Feedback BEFORE-QUIT-002]）。
3. `zoneFromCount`（5 分岐 + 負値/NaN）/ `normalizeZone`（新 5 + 旧 3 + garbage）/ unique 計算（`totalMembers>0` と `=0` + clamp）の変更行ローカル branch カバレッジが Uncovered Line ゼロで実測されている。
4. 別ドメイン・本タスク非変更ファイルが計測対象外として明記されている。
5. テスト数は実測値（`--reporter=verbose`）で取得し、コマンドと実行日時が記録されている（推定値不使用）。
6. カバレッジ閾値（80%）が `index.md` メタ情報および本 Phase の完了条件に記載されている。
