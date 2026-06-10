# Phase 7: テストカバレッジ確認

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 1（要件・AC-1..AC-12）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画 Red）/ Phase 5（実装 Green）/ Phase 6（テスト拡充）
- 本 Phase の責務: 本タスクで追加・変更したコードの branch/line カバレッジを測定し、`coverage-standards.md` の閾値（workspace 一律 80%・推奨 90%）に整合させる。CSS（globals.css）は jsdom 非カバレッジのため Phase 11 視覚で担保する旨を明記する。

## 目的

`coverage-standards.md`（正本）の **workspace 一律 80%**（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクの新規・変更コードが満たすことを確認する。
プロジェクト全体閾値は既存負債の影響を受けるため、`coverage-standards.md` §「個別ファイルカバレッジ計測」に従い **対象ファイルを絞り込んで個別計測**する。
本タスクは UI/UX 編集タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。

## 1. カバレッジ目標（coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | lib / hook / components の変更ファイル |
| Branch Coverage | 80% | 90% | 同上 |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> 本ファイルの閾値は `index.md` メタ情報および本 Phase の `## 完了条件` に必須記載する（coverage-standards.md §「全タスク必須 AC」）。

## 2. カバレッジ対象ファイルと評価方針（[BEFORE-QUIT-002] 変更ファイルに限定）

対象範囲は本タスクで新規/変更したコードに限定する。範囲外ファイルへの波及計測は行わない。

| ファイル | 種別 | カバレッジ評価 | 目標 | 備考 |
| --- | --- | --- | --- | --- |
| `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | hook（新規） | 計測対象 | **100% 目標** | 純粋な局所 state ロジック（toggle / selectAllFiltered / clear / query 絞込 / attended stale 除去 effect）。全分岐が hook test（T2）で網羅可能。副作用 API なし |
| `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts` | 純関数（新規） | 計測対象 | **100% 目標** | `bulkFailureMessage(summary)` は例外を投げず文字列返却（[WEEKGRD-02]）。duplicate / deleted_member / unknown_member / invalid の各内訳分岐を unit test で全網羅 |
| `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` | component（新規） | 計測対象（80%+） | 80%（推奨 90%） | 候補 0 件分岐 / 選択 0 件 disabled 分岐 / 送信成功時 clear 分岐 を T3 が網羅 |
| `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx` | component（新規） | 計測対象（80%+） | 80%（推奨 90%） | open/close 表示分岐・全選択・選択解除・送信 を T4 が網羅。同一 hook を共有するため hook 分岐は T2 で別途担保 |
| `apps/web/src/components/ui/Checkbox.tsx` | primitive（新規） | 計測対象（80%+） | 80%（推奨 90%） | `label` 有無の 2 分岐（label 直結 vs aria-label 必須）を T1 が網羅 |
| `apps/web/src/lib/admin/api.ts`（`importAttendance` のみ） | web client（編集） | 計測対象（対象関数のみ） | 80%（推奨 90%） | `importAttendance` は `call(...)` 委譲の薄い関数。memberIds→rows 変換 1 分岐を T6 が網羅。ファイル全体ではなく追加関数を `--coverage.include` で個別計測 |
| `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`（`onBulkAdd` のみ） | shell（編集） | 参考値 | — | `"use client"` + 多数 hooks 依存。`onBulkAdd` の分岐（fresh 0 件 / 500 超ガード / catch / !res.ok / !committed / committed 成功）は T5（Drawer spec の多選択 case）と integration 観点で確認。focused 計測の主対象は hook / 純関数に置く |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | component（編集） | 参考値 | — | チェックリスト埋込・modal 開閉 useState 追加。既存単発 select は非変更（AC-10 回帰）。T5 で新 prop（`onBulkAddAttendance`）を渡し回帰を確認 |
| `apps/web/src/features/admin/components/_meetings/index.ts` | barrel（編集・必要時） | 対象外 | — | export 追加のみ。ロジック分岐なし |
| `apps/web/src/styles/globals.css` | CSS（編集） | **カバレッジ対象外** | — | jsdom 非実行。`.bulk-attendance*` / `.ui-checkbox*` / `.bulk-attendance-modal*` の効きは Phase 11 視覚で担保 |

> 純関数（`bulk-attendance-message.ts`）と hook（`useBulkAttendanceSelection.ts`）は分岐が閉じており **100% を目標**とする。component は副作用・描画分岐があるため 80%+（推奨 90%）を目標とする。`MeetingsClientShell` / `MeetingAttendanceDrawer` は `"use client"` + hooks 依存で focused 個別計測の主対象から外し、参考値とする（`coverage-standards.md` §「今回追加したコードのカバレッジを確認する目的」）。

## 3. vitest coverage 設定方針（既存設定の確認・変更しない）

ルート `vitest.config.ts` の `test.coverage` を既定とする（本タスクで変更しない・AC-12 とは別軸だが coverage 設定は踏襲）:

| 設定 | 値 | 意味 |
| --- | --- | --- |
| `provider` | `v8` | V8 カバレッジ |
| `reporter` | `["text", "json-summary", "json", "lcov", "html"]` | text で即時確認・json-summary で機械集計 |
| `reportsDirectory` | `./coverage` | 出力先 |
| `include` | `apps/**/src/**/*.{ts,tsx}` ほか | `.css` は非含有（CSS 非計測） |
| `exclude` | `**/*.spec.{ts,tsx}` / `page.tsx` / `layout.tsx` ほか | spec / Next ルートファイル除外 |

## 4. 個別ファイルカバレッジ計測コマンド（focused vitest --coverage）

プロジェクト全体閾値は既存負債の影響を受けるため、`--coverage.include` で本タスクの変更ファイルに絞って計測する（`coverage-standards.md` §「個別ファイルカバレッジ計測」）。

```bash
# 純関数 + hook + 新規 component + Checkbox + importAttendance を個別計測
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx' \
  --coverage.include='apps/web/src/components/ui/Checkbox.tsx' \
  --coverage.include='apps/web/src/lib/admin/api.ts' \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

text reporter の出力で対象ファイルの `% Stmts` / `% Branch` / `% Funcs` / `% Lines` を確認する。
判定: `useBulkAttendanceSelection.ts` / `bulk-attendance-message.ts` は **100%**、それ以外の component / primitive / `importAttendance` は **80% 以上**（推奨 90%）。

## 5. 判定フロー（coverage-standards.md §判定フロー）

| 状況 | 対処 |
| --- | --- |
| 純関数 / hook が 100%、component / primitive が 80%+ | Phase 7 PASS → Phase 8（リファクタ）へ |
| プロジェクト全体集計が既存負債で閾値割れ | `--coverage.include` で対象を絞り個別計測（本 §4）。全体閾値割れは既存負債として別タスクに委ねる |
| 個別計測が目標未満 | Phase 6 へ戻りテスト追加（不足 branch を該当 spec に補完。hook の attended stale effect / 純関数の各内訳分岐 / component の 0 件・disabled 分岐を優先） |

## 6. テスト数の実測記録（coverage-standards.md §テスト数記載基準）

Phase 9 / Phase 10 のテスト数記載に向け、本 Phase 実行時に実測値を取得する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

> 実測値のみ使用し（推定値禁止）、実行コマンドと実行日時を成果物に記録する。本タスクの想定 spec 構成（T1..T6）: `Checkbox.spec.tsx`（T1） / `useBulkAttendanceSelection.spec.ts`（T2） / `BulkAttendanceChecklist.spec.tsx`（T3） / `BulkAttendanceModal.spec.tsx`（T4） / `MeetingAttendanceDrawer.spec.tsx`（T5・既存 + 多選択 case） / `api.attendance-import.spec.ts`（T6）。実数は実行時の verbose 出力で確定する。

## 7. 変更行の保護確認 実測欄テンプレート [Feedback 5]

実装後（Phase 5/6 Green 状態）に以下を実測で埋め、Phase 11 `manual-test-result.md` に転記する。推定値は禁止。

| 対象ファイル | % Stmts | % Branch | % Funcs | % Lines | 目標 | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| `useBulkAttendanceSelection.ts` | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 100% | _（PASS/FAIL）_ |
| `bulk-attendance-message.ts` | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 100% | _（PASS/FAIL）_ |
| `BulkAttendanceChecklist.tsx` | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 80%+ | _（PASS/FAIL）_ |
| `BulkAttendanceModal.tsx` | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 80%+ | _（PASS/FAIL）_ |
| `Checkbox.tsx` | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 80%+ | _（PASS/FAIL）_ |
| `importAttendance`（api.ts） | _（実測）_ | _（実測）_ | _（実測）_ | _（実測）_ | 80%+ | _（PASS/FAIL）_ |

| 項目 | 実測値 |
| --- | --- |
| 実行コマンド | _（§4 のコマンド）_ |
| 実行日時 | _（YYYY-MM-DD HH:MM）_ |
| テスト総数（spec ファイル数 / ケース数） | _（§6 verbose 出力）_ |
| focused vitest 結果 | _（PASS/FAIL）_ |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | `coverage` provider / include / exclude / reporter |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| 要件（AC 正本） | [phase-1-requirements.md](phase-1-requirements.md) | AC-1..AC-12 |
| 設計（変更ファイル / シグネチャ） | [phase-2-design.md](phase-2-design.md) | hook / component / 純関数の責務境界 |
| 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | 純関数ガード・4 条件 |
| 共有コンテキスト（SSOT） | [outputs/phase-1/shared-context.md](outputs/phase-1/shared-context.md) | シグネチャ・契約・変更ファイル一覧 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin primitive / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 個別カバレッジ計測結果 | runtime | 対象ファイルの Stmts/Branch/Funcs/Lines を Phase 11 `manual-test-result.md` に記録 |
| テスト数実測値 | runtime | `--reporter=verbose` の実行結果・コマンド・日時 |
| 本 Phase 7 仕様書 | 文書 | カバレッジ目標・計測方法・CSS 非カバレッジ方針・変更行保護確認テンプレート |
| カバレッジレポート | 文書 | [outputs/phase-7/coverage-report.md](outputs/phase-7/coverage-report.md) |

## 統合テスト連携

- Phase 6 の spec が Green の状態で本 Phase の個別計測を実施し、不足 branch があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC-8 相当（typecheck/lint/test green）判定根拠に用いる。
- Phase 11（user-gated）で CSS（globals.css・jsdom 非カバレッジ）の実描画（チェックリスト横並び・モーダル overlay・Checkbox accent-color）を staging 実機で視覚確認し、カバレッジで担保できない領域を補完する。

## 完了条件

1. `useBulkAttendanceSelection.ts` / `bulk-attendance-message.ts` の個別カバレッジが Line/Branch/Function/Statement とも **100%** である。
2. `BulkAttendanceChecklist.tsx` / `BulkAttendanceModal.tsx` / `Checkbox.tsx` / `importAttendance`（api.ts）の個別カバレッジが **80% 以上**（推奨 90%）である。
3. プロジェクト全体閾値が既存負債で割れる場合、`--coverage.include` 個別計測で本タスク新規コードの目標達成が確認されている。
4. CSS（globals.css）は jsdom 非カバレッジであり、`.bulk-attendance*` / `.ui-checkbox*` / `.bulk-attendance-modal*` を Phase 11 視覚で担保する旨が明記されている。
5. テスト数は実測値（`--reporter=verbose`）で取得し、コマンドと実行日時が §7 テンプレートに記録される（推定値不使用）。
6. カバレッジ閾値が `index.md` メタ情報および本 Phase の完了条件に記載されている。
