# 出席ダッシュボード UI/UX 是正タスク仕様書

- task_id: `admin-attendance-dashboard-ux`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest は完了。staging 視覚証跡 / PR は user-gated）
- スコープ: `apps/web`（admin 出席ダッシュボード）のみ。API/D1/Form 非変更（不変条件 #1 #5）

## 目的

staging `/(admin)/admin/dashboard/attendance`（出席ダッシュボード）で発生している
**レイアウト総崩れ・バー楕円潰れ・用語/見方の不明瞭・KPI ラベル不整合** を是正し、
「何の指標か・どう見るか」が直感的に分かる状態にする。

## 根本原因（確定）

1. **崩れ**: `globals.css` に `.attendance-*` レイアウト CSS が未定義（`.attendance-status-pill` のみ存在）→ 素のブロック積み上げ。
2. **楕円潰れ**: 区画分布バー / Top10 バーの `<svg>` に CSS 寸法がなく replaced 要素デフォルト高で縦伸び + 角丸が楕円化。
3. **意味不明**: 「区画（0→1/1→10/10→100）」が累計出席回数帯であることが UI から読み取れない（凡例・説明なし）。
4. **KPI 不整合**: 「期間内出席者数」hint「unique 出席者」だが実値は延べ出席数。

## スコープ（本サイクル完結＝AC-1..AC-8）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| レイアウト復旧 | `.attendance-*` を `@layer components` 末尾に CSS 定義（KPI グリッド/フィルタ/チャート 2 カラム/テーブル/Top10/フォローアップ/空状態） | `apps/web/src/styles/globals.css` |
| バー楕円解消 | バー `<svg>` に `block-size:0.5rem` 固定 + 区画バー `Math.max(2,…)`→`Math.max(0,…)` | globals.css / `AttendanceZoneDistributionChart.tsx` / `AttendanceTop10Ranking.tsx` |
| 出席回数帯 + 凡例 | `ZONE_LABEL` 回数表記化 + `ZONE_HELP` 凡例 + FilterBar legend「区画」→「出席回数帯」 | `format-attendance.ts` / `AttendanceFilterBar.tsx` / `AttendanceZoneDistributionChart.tsx` |
| 見方ガイド + KPI 是正 | 冒頭ガイド・各セクション 1 行説明・KPI ラベル是正（unique→延べ）・空状態スタイル | `AttendanceAnalyticsPage.tsx` / `KpiPanel.tsx` |
| テスト | `ZONE_LABEL` 更新 + ZoneChart 新規 spec + KpiPanel 既存 spec 更新 | `__tests__/*.spec.ts(x)` |

## スコープ外（別タスクに分離・ユーザー Q1 指示）

`apps/api/src/repository/attendance-analytics.ts` の **計算意味論是正**（出席回数帯の境界設計・出席率/延べ vs unique の定義見直し）は
回帰リスクがあり、ユーザー指示により別タスク仕様書へ分離:
→ `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（Issue-ready）。
本タスクの UI ラベルは**現行境界に忠実**なため、両タスクは独立実装可能。

## Acceptance Criteria

Phase 1 の AC-1..AC-9 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（CSS ブロック・コンポーネント変更） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-9 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
計算ロジック是正が別タスク仕様書に分離され、apps/web の実コード反映と focused vitest が完了していること。
