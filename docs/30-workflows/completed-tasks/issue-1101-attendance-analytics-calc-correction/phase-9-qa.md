# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 前提: Phase 1〜8 完了（要件・設計・テスト・実装・カバレッジ・リファクタ）
- 本 Phase の責務: AC-1..AC-8 の検証手順を一覧化し、全ゲートを通過させる。**最重要は grep gate（旧矢印値の AttendanceZone 由来残存ゼロ）と別ドメイン非接触の保証**

## QA 概要

本タスクは `apps/api`（repository）/ `packages/shared`（schema）/ `apps/web`（label・KPI）/ `docs` を変更する。検証は以下 6 区分で行う:

1. 型チェック・リント（静的解析）
2. Focused vitest（境界値 / normalize / unique / UI ラベル）
3. **grep gate（最重要）** — 旧矢印値の AttendanceZone 由来残存ゼロ
4. 別ドメイン非接触確認（git diff name-only）
5. 4 面一致確認（enum / `zoneFromCount` / `ZONE_LABEL` / doc）
6. D1 migration / route 差分ゼロ確認

## 実行タスク

### タスク 1: 静的解析（typecheck / lint）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待結果**: どちらも exit 0（エラー 0 件）。

### タスク 2: focused vitest 実行

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

**期待結果**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `attendance-analytics-internals.spec.ts`（更新） | `zoneFromCount(100)` → `zone_100_plus`（旧 `unknown` 固定テストの是正）、`zoneFromCount(-1)`/`NaN` → `unknown`、`normalizeZone` の新 5 キー + 旧 3 キー互換 + garbage（AC-1/AC-2/AC-4） | PASS |
| `attendance-analytics.repository.spec.ts`（更新） | overview の `overallRate`（延べ率）/ `uniqueAttendeeCount` / `uniqueAttendanceRate`（0..1 clamp・`totalMembers=0` で 0）、zone distribution が新キー（AC-3） | PASS |
| `format-attendance.spec.ts`（更新） | `ZONE_LABEL` の新 5 値（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上` / `分類不能`）、`SELECTABLE_ZONES` が `unknown` 除く 4 種、`ZONE_HELP` export（AC-5） | PASS |
| `KpiPanel.spec.tsx`（更新） | `data-testid="attendance-kpi-unique"` タイル描画、`uniqueAttendanceRate` / `uniqueAttendeeCount` を consume（AC-6） | PASS |

### タスク 3: grep gate（最重要）— 旧矢印値の AttendanceZone 由来残存ゼロ

本タスクの核心 gate。`AttendanceZone` 由来の旧矢印値（`"0→1"` / `"1→10"` / `"10→100"`）が API enum / shared schema / web label から消えていることを確認する。

```bash
# AttendanceZone 由来の旧矢印値が残っていないこと（別ドメインは範囲から除外）
rg -n '"0→1"|"1→10"|"10→100"' \
  apps/api/src apps/web/src/features/admin/attendance packages/shared \
  && echo "[CHECK: 残存あり → LEGACY_ZONE_MAP 内の互換マッピングのみか精査]" \
  || echo "[PASS: AttendanceZone 由来の旧矢印値ゼロ]"
```

**期待結果と正当残存の扱い**:

- **理想（ゼロ残存）**: 上記 rg がヒットなし → `[PASS]`。
- **正当残存（許容）**: Phase 8 で `LEGACY_ZONE_MAP` 定数（`apps/api/src/repository/attendance-analytics.ts` の互換マッピング 1 箇所）に旧矢印値を**意図的に残す**設計の場合、その 1 箇所のみがヒットする。この場合は以下で「`LEGACY_ZONE_MAP` 以外に残っていない」ことを確認する:

```bash
# LEGACY_ZONE_MAP（互換マッピング）以外に旧矢印値が散っていないこと
rg -n '"0→1"|"1→10"|"10→100"' \
  apps/api/src apps/web/src/features/admin/attendance packages/shared \
  | rg -v 'LEGACY_ZONE_MAP' \
  | rg -v 'attendance-analytics\.ts' \
  && echo "[FAIL: LEGACY_ZONE_MAP 以外に旧矢印値が残存]" \
  || echo "[PASS: 旧矢印値は LEGACY_ZONE_MAP の互換マッピングのみ]"
```

> **別ドメインの旧矢印値は正当な残存** — grep 範囲から除外する。`0→1` / `1→10` / `10→100` は UBM 事業成長フェーズ zone（会員企業の成長段階）でも視覚ラベルとして使われるが、これは `AttendanceZone` とは無関係な別概念であり**変更してはならない**。よって grep 範囲は `apps/api/src` / `apps/web/src/features/admin/attendance` / `packages/shared` に限定し、以下の別ドメインファイルは**範囲に含めない**:
>
> | 別ドメインファイル | 持つ値 | 扱い |
> | --- | --- | --- |
> | `apps/api/src/routes/admin/_shared/byZone.ts` | `0to1` / `1to10` / `10to100` | 正当残存・grep 範囲外 |
> | `apps/web/src/components/public/AboutUbm.tsx` | `0_to_1` / `1_to_10` / `10_to_100` | 正当残存・grep 範囲外 |
> | `apps/web/src/components/public/MemberFilters.client.tsx` | `0_to_1` / `1_to_10` / `10_to_100` | 正当残存・grep 範囲外 |
> | `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | `0_to_1` / `1_to_10` / `10_to_100` | 正当残存・grep 範囲外 |
>
> 注意: `apps/api/src` は `routes/admin/_shared/byZone.ts` を含むが、`byZone.ts` の値は `0to1`（矢印なし）であり上記 rg パターン（`"0→1"` = 全角矢印付き）にはヒットしない。万一ヒットした場合は別ドメイン値ではなく `AttendanceZone` 由来の取りこぼしなので FAIL とみなす。

### タスク 4: 別ドメイン非接触確認（git diff name-only）

別ドメイン（UBM 事業成長フェーズ zone）の 4 ファイルが diff に含まれないことを保証する。

```bash
git diff --name-only \
  | rg 'byZone\.ts|AboutUbm\.tsx|MemberFilters\.client\.tsx|SelectedFiltersBar\.client\.tsx' \
  && echo "[FAIL: 別ドメイン zone ファイルを変更している]" \
  || echo "[PASS: 別ドメイン非接触]"
```

**期待結果**: ヒットなし → `[PASS]`（上記 4 ファイルが diff に**含まれない**）。

### タスク 5: 4 面一致確認（enum / zoneFromCount / ZONE_LABEL / doc）

`AttendanceZone` の 5 キーが 4 面で一致していることを確認する（Phase 2 §5 の 4 面一致マップ）。

```bash
# (1) shared enum に新 5 キーが揃い、旧矢印値が enum メンバーから消えていること
rg -n 'zone_0|zone_1_9|zone_10_99|zone_100_plus|unknown' \
  packages/shared/src/zod/admin-attendance.ts

# (2) API zoneFromCount が新 5 キーを返すこと
rg -n 'zone_0|zone_1_9|zone_10_99|zone_100_plus|unknown' \
  apps/api/src/repository/attendance-analytics.ts

# (3) web ZONE_LABEL が新 5 キーを網羅し SELECTABLE_ZONES が unknown を除くこと
rg -n 'zone_0|zone_1_9|zone_10_99|zone_100_plus|unknown|SELECTABLE_ZONES' \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts

# (4) doc が新キー派生（>=100 → zone_100_plus）へ更新され、旧 ">=100 → unknown" が消えていること
rg -n 'zone_100_plus|>=100|unknown' \
  docs/00-getting-started-manual/specs/01-api-schema.md
rg -n '>=100.*unknown|unknown.*>=100' \
  docs/00-getting-started-manual/specs/01-api-schema.md \
  && echo "[FAIL: doc に旧 '>=100 → unknown' が残存]" \
  || echo "[PASS: doc は新境界]"
```

**期待結果**: 4 面とも新 5 キー（`zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown`）が揃い、doc の旧 `>=100 → unknown` 記述が除去されている。

### タスク 6: D1 migration / route 差分ゼロ確認（AC-8）

```bash
# D1 migration / route 層が変更されていないこと
git diff --name-only -- apps/api/migrations apps/api/src/routes \
  | rg . \
  && echo "[FAIL: migration または route を変更している]" \
  || echo "[PASS: migration / route 差分ゼロ]"
```

**期待結果**: 出力なし → `[PASS]`（D1 migration / endpoint path / method 不変・Google Form schema 差分ゼロ）。

> `apps/api/src/routes/admin/attendance.ts` は overview を passthrough するのみで reshape しない。additive field（`uniqueAttendeeCount` / `uniqueAttendanceRate`）はそのまま通過するため route 変更は不要。

### タスク 7: 変更ファイル存在確認

本タスクの変更対象（production + test + doc）が diff に現れることを確認する。

```bash
git diff --name-only HEAD | rg -E \
  "attendance-analytics\.ts|\
admin-attendance\.ts|\
attendance-analytics-internals\.spec\.ts|\
attendance-analytics\.repository\.spec\.ts|\
format-attendance\.(ts|spec\.ts)|\
KpiPanel\.(tsx|spec\.tsx)|\
01-api-schema\.md"
```

**期待結果**: 上記の変更ファイルが差分として現れる。

## AC-1..AC-8 チェックボックス表

| AC | 条件要旨 | 検証手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `zoneFromCount(n>=100)` が `zone_100_plus`、`n<0`/`!finite` のみ `unknown` | `attendance-analytics-internals.spec.ts` PASS（タスク 2） | [ ] |
| AC-2 | 旧矢印値が enum から消え、`normalizeZone` 互換マッピング + 明示テスト | grep gate（タスク 3）+ internals spec の互換テスト PASS | [ ] |
| AC-3 | `overallRate`（延べ率）/ `uniqueAttendeeCount` / `uniqueAttendanceRate` の定義が 4 面一致 | `repository.spec.ts` PASS（タスク 2）+ doc（タスク 5） | [ ] |
| AC-4 | `AttendanceZoneZ` 集合と `zoneFromCount` 返り値集合が完全一致 | 4 面一致確認（タスク 5 (1)(2)） | [ ] |
| AC-5 | `ZONE_LABEL` 新 5 種網羅・`SELECTABLE_ZONES` が `unknown` 除く 4 種・`ZONE_HELP` 整合 | `format-attendance.spec.ts` PASS（タスク 2）+ タスク 5 (3) | [ ] |
| AC-6 | `KpiPanel` が `data-testid="attendance-kpi-unique"` を持ち additive field を consume | `KpiPanel.spec.tsx` PASS（タスク 2） | [ ] |
| AC-7 | focused vitest / typecheck / lint PASS | タスク 1 / タスク 2 全 PASS | [ ] |
| AC-8 | D1 migration / endpoint / method / Form schema 差分ゼロ | タスク 6 の git diff 空 | [ ] |

## 検証コマンドまとめ（一括実行用）

```bash
# 1. 型チェック・リント
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. focused vitest
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx

# 3. grep gate（AttendanceZone 由来の旧矢印値残存・別ドメイン除外）
rg -n '"0→1"|"1→10"|"10→100"' \
  apps/api/src apps/web/src/features/admin/attendance packages/shared \
  | rg -v 'LEGACY_ZONE_MAP' | rg -v 'attendance-analytics\.ts' \
  && echo "[FAIL]" || echo "[PASS: 旧矢印値は LEGACY_ZONE_MAP のみ]"

# 4. 別ドメイン非接触
git diff --name-only \
  | rg 'byZone\.ts|AboutUbm\.tsx|MemberFilters\.client\.tsx|SelectedFiltersBar\.client\.tsx' \
  && echo "[FAIL]" || echo "[PASS: 別ドメイン非接触]"

# 5. migration / route 差分ゼロ
git diff --name-only -- apps/api/migrations apps/api/src/routes \
  | rg . && echo "[FAIL]" || echo "[PASS: migration/route untouched]"
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| AC 正本 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-1-requirements.md` | AC-1..AC-8 定義・別ドメイン境界（§5） |
| 設計正本 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-2-design.md` | 4 面一致マップ（§5）・enum / rate 定義 |
| 設計レビュー | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-3-design-review.md` | grep gate 根拠（R7）・MINOR 記録 |
| リファクタ | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-8-refactor.md` | `LEGACY_ZONE_MAP` 集約（grep gate 正当残存の根拠） |
| 別ドメイン（非変更） | `apps/api/src/routes/admin/_shared/byZone.ts` / `apps/web/src/components/public/AboutUbm.tsx` 等 | 非接触保証対象 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | QA チェックリスト・grep gate（別ドメイン除外）・4 面一致確認・AC マッピング |
| grep gate 結果 | runtime | 旧矢印値残存ゼロ（or LEGACY_ZONE_MAP のみ）の出力を Phase 11 `manual-test-result.md` に記録 |
| 各 spec の PASS 証跡 | runtime | focused vitest 出力を Phase 11 に記録 |

## 統合テスト連携

- focused vitest PASS が Phase 10 最終レビューの「AC-7 green」判定根拠となる。
- grep gate（タスク 3）+ 別ドメイン非接触（タスク 4）が Phase 10 の不変条件適合（別ドメイン非変更）判定根拠となる。
- タスク 6 の git diff 空が Phase 10 の AC-8 判定根拠となる。
- Phase 11 では本 Phase で確認できない「KPI タイルの実描画（unique 出席率）」を user-gated 視覚確認として追加する。

## 完了条件

1. `pnpm typecheck` / `pnpm lint` が exit 0。
2. focused vitest（上記 4 spec）が全 PASS。
3. **grep gate（タスク 3）**: `AttendanceZone` 由来の旧矢印値が `LEGACY_ZONE_MAP` 以外にゼロ。別ドメイン（byZone.ts / AboutUbm.tsx / MemberFilters / SelectedFiltersBar）は grep 範囲から除外している旨が明記されている。
4. **別ドメイン非接触（タスク 4）**: `git diff --name-only` に byZone.ts / AboutUbm.tsx / MemberFilters.client.tsx / SelectedFiltersBar.client.tsx が**含まれない**。
5. 4 面一致確認（enum / `zoneFromCount` / `ZONE_LABEL` / doc）が PASS し、doc の旧 `>=100 → unknown` が除去されている。
6. `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空（D1 migration / route 差分ゼロ）。
7. AC-1..AC-8 チェックボックスが全チェック済みとなるか、未確認項目が Phase 11 runtime 境界として明記されている。
