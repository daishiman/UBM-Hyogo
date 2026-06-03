# Phase 12 main — admin-attendance-dashboard-ux

## サマリ

本 Phase 12 パッケージは「出席ダッシュボード UI/UX 是正」タスク（`admin-attendance-dashboard-ux`）の
実装済み local close-out 成果物群である。`apps/web` の実コードへ反映済みで、local fixture screenshot も取得済み。staging 視覚証跡のみ user-gated とする。

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation` / visualEvidence: `VISUAL`
- implementation_mode: `edit`（既存コンポーネント / `globals.css` を編集。新規ファイルはテストのみ）
- スコープ: `apps/web` のみ（admin 出席ダッシュボード `/(admin)/admin/dashboard/attendance`）。API / D1 / Google Form は非変更（不変条件 #1 #5）。
- 変更済み 10 ファイル（CSS 1 + コンポーネント 5 + lib 1 + テスト 3）。
- 別タスク分離（AC-9）: `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（apps/api 計算意味論是正）。
- PR base: `dev`。commit / push / PR / staging 視覚 baseline は user-gated。

本タスクは「レイアウト総崩れ・バー楕円潰れ・用語/見方の不明瞭・KPI ラベル不整合」を `apps/web` のみで是正する
実装仕様書である。計算意味論の是正（出席回数帯境界・出席率/延べ vs unique の定義）はユーザー指示により別タスクへ分離した。

## strict 7 索引

| # | ファイル | 役割 | 状態 |
| - | --- | --- | --- |
| 1 | [`main.md`](main.md) | Phase 12 サマリ・strict 7 索引 | present |
| 2 | [`implementation-guide.md`](implementation-guide.md) | Part 1（中学生レベル例え話）+ Part 2（CSS 配置・変更 10 ファイル Before→After・トークン使用例・検証コマンド） | present |
| 3 | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1（ドキュメント反映）完了記録 / Step 2 = N/A（UI 表示のみ・ドメイン仕様無影響） | present |
| 4 | [`documentation-changelog.md`](documentation-changelog.md) | 変更ファイル・別タスク分離記録・drift 観察・validator 結果 | present |
| 5 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | 検出 1 件（AC-9 計算意味論是正）・配置先・命名根拠 | present |
| 6 | [`skill-feedback-report.md`](skill-feedback-report.md) | テンプレート/ワークフロー改善観察・promotion / no-op routing | present |
| 7 | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠 / 4 条件 verdict | present |

## Phase 12 タスク完了状況

| Task | 名称 | 状況 | 成果物 |
| --- | --- | --- | --- |
| Task 1 | 実装ガイド作成（Part 1/Part 2） | completed (spec content) | [`implementation-guide.md`](implementation-guide.md) |
| Task 2 | システム仕様更新サマリ（Step 1-A〜1-C + Step 2） | completed (spec content) | [`system-spec-update-summary.md`](system-spec-update-summary.md) |
| Task 3 | ドキュメント更新履歴 | completed (spec content) | [`documentation-changelog.md`](documentation-changelog.md) |
| Task 4 | 未タスク検出レポート（検出 1 件） | completed (spec content) | [`unassigned-task-detection.md`](unassigned-task-detection.md) |
| Task 5 | スキルフィードバックレポート | completed (spec content) | [`skill-feedback-report.md`](skill-feedback-report.md) |
| Task 6 | Phase 12 仕様準拠チェック | completed (spec content) | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) |

## same-wave sync（implemented_local_runtime_pending）

| Step | 本タスクでの扱い |
| --- | --- |
| Step 1-A | 完了タスク記録は workflow 自身（index.md / phase-12-documentation.md）に加え、aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 |
| Step 1-B | 実装状況テーブルに `implemented_local_runtime_pending` を記録（staging visual / PR は user-gated） |
| Step 1-C | 関連タスクテーブル: AC-9 計算是正を `unassigned-task-specs/` 分離として current facts に記録 |
| Step 2 | N/A（新規インターフェース / API / 型 / 定数の追加なし。UI 表示・CSS・ラベルのみ。詳細は system-spec-update-summary.md） |

## スコープ境界

本サイクルで閉じる範囲（AC-1..AC-8、すべて `apps/web`）:

- `globals.css` `@layer components` 末尾に `.attendance-*` レイアウト CSS を定義（レイアウト復旧・バー高さ固定・空状態）。
- `AttendanceZoneDistributionChart.tsx` / `AttendanceTop10Ranking.tsx` のバー楕円潰れ是正と凡例追加。
- `format-attendance.ts` の `ZONE_LABEL` 回数表記化 + `ZONE_HELP` 凡例定数追加。
- `KpiPanel.tsx` の KPI ラベル是正（unique → 延べ）と用途説明。
- `AttendanceFilterBar.tsx` の legend rename（区画 → 出席回数帯）。
- `AttendanceAnalyticsPage.tsx` の見方ガイド・各セクション 1 行説明・空状態スタイル。
- focused tests 3 ファイル（`format-attendance.spec.ts` / `KpiPanel.spec.tsx` 更新 + `AttendanceZoneDistributionChart.spec.tsx` 新規）。

スコープ外（別タスク分離・AC-9）:

- `apps/api/src/repository/attendance-analytics.ts` の出席回数帯境界設計・出席率/延べ vs unique の定義是正
  → `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（Issue-ready）。

## user-gated 境界

authenticated staging screenshot / staging 視覚 baseline / commit / push / PR は
ユーザー明示承認後に実行する。本 Phase 12 は local code implemented + local fixture visual captured の close-out であり、staging runtime 証跡は生成しない。
