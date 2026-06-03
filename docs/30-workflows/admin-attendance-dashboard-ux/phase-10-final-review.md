# Phase 10: 最終レビュー

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（CSS・ラベル設計）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画 Red）/ Phase 5-8（実装手順・テスト追加・カバレッジ・リファクタ）/ Phase 9（QA）
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest は完了。staging 視覚証跡 / PR は user-gated）
- visualEvidence: `VISUAL`（視覚確認は Phase 11 で user-gated runtime として実施）
- 本 Phase の責務: AC-1..AC-9 の最終トレースを 3-state 語彙で確定し、MINOR 追跡・不変条件適合を再確認したうえで「仕様書として PASS（実装着手可）」を判定する

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・QA gate）が AC-1..AC-9 へ漏れなく trace され、今回の実コード反映で green 化したことを最終確認する。
各 AC の判定は **`implemented_local_evidence_captured`** を基本とし、視覚確認に依存する項目は Phase 11 の **`runtime_pending`** を併記する。

## 実行タスク

### 1. AC-1..AC-9 最終トレース表（3-state 判定）

判定語彙: `implemented_local_evidence_captured`（ローカル実装・focused test PASS） / `runtime_pending`（staging 視覚確認が user-gated で未実施）。

| AC | 主担当の変更点 | 検証手段（Phase） | 判定 |
| --- | --- | --- | --- |
| AC-1 レイアウト復旧 | `globals.css` `@layer components` 末尾に `.attendance-kpi-grid` / `.attendance-kpi-card` / `.attendance-filter-bar` / `.attendance-charts-grid` 他のレイアウト CSS 追加 | CSS 定義 + Phase 11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-2 バー楕円解消 | `.attendance-zone-bar` / `.attendance-top10-bar` に `block-size: 0.5rem` 固定 + `Math.max(2,…)` → `Math.max(0,…)` 是正 | `AttendanceZoneDistributionChart.spec.tsx`（ZC-1/ZC-2）+ Phase 11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-3 区画→出席回数帯+凡例 | `ZONE_LABEL` 回数表記化 / `ZONE_HELP` 追加 / FilterBar legend rename / ZoneChart 凡例キャプション | `format-attendance.spec.ts` + `AttendanceZoneDistributionChart.spec.tsx` + Phase 11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-4 KPI ラベル是正 | `KpiPanel.tsx` の hint を「unique」→「延べ」に整合・4 KPI に説明付与 | `KpiPanel.spec.tsx` | `implemented_local_evidence_captured` |
| AC-5 見方ガイド/空状態 | `AttendanceAnalyticsPage.tsx` に `.attendance-page-guide` / `.attendance-section-intro` + スタイル付き空状態 | 実コード反映 + Phase 11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-6 token 厳守 | globals.css 全色 `var(--ubm-color-*)` 経由 | `pnpm verify:tokens` + grep gate | `implemented_local_evidence_captured` |
| AC-7 API 非変更 | （`apps/api` / D1 migration / Form schema を変更しないこと） | `git diff --name-only -- apps/api` 空 | `implemented_local_evidence_captured` |
| AC-8 green | focused vitest | `pnpm exec vitest run --root=. --config=vitest.config.ts ...` | `implemented_local_evidence_captured` |
| AC-9 計算是正の分離 | `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（apps/api・別タスク）に分離 | Phase 12 unassigned-task-detection + `ls` 存在確認（Phase 9） | `implemented_local_runtime_pending`（分離先仕様は実体化済） |

> AC-1/2/3/5 の「CSS の効き」は jsdom で検証不能なため、Phase 11 staging で **`runtime_pending`** として user-gated 確認する境界を残している。

### 2. Phase 3 由来の MINOR 追跡テーブル

Phase 3 設計レビューの「レビュー判定」で **MINOR 指摘なし（明示 0 件）** と記録済み（phase-3-design-review.md L61）。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | -------------- | -------- | ---------- |
| （なし） | — | — | — | — | 0 件 |

> MINOR 0 件は本 Phase 10 と Phase 12（`phase12-task-spec-compliance-check.md` / `phase-12-documentation.md` の MINOR 追跡テーブル）で一致記録する。

### 3. 不変条件の最終適合確認（CLAUDE.md）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint 追加 / D1 / Form 変更禁止 | ✅ 適合 | 変更は `apps/web` の CSS/TSX/test のみ。fetch URL・zod・endpoint surface 不変。AC-7 で `git diff --name-only -- apps/api` 空を gate |
| #2 OKLch トークン正本・HEX 直書き禁止 | ✅ 適合 | 追加 CSS は全色 `var(--ubm-color-*)` 経由。新色トークン追加なし。AC-6 で `verify:design-tokens` + grep gate G-1/G-2 |
| #5 D1 直接アクセス禁止（apps/web → D1） | ✅ 適合 | データ取得は既存 fetch 経由のまま。本タスクで新規 D1 アクセス追加なし |
| #8 test は `*.spec.*` のみ | ✅ 適合 | 新規 test は `AttendanceZoneDistributionChart.spec.tsx`（`*.spec.tsx`）。`*.test.*` 不使用 |
| #9 admin form input は FormField 経由 | ✅ 影響なし | 本タスクは form input を追加しない。フィルタは既存のまま・新規 `<input>` 追加なし |

### 4. 実装サイクル（03.実装）で green 化すべき項目（TDD Red → Green の対象）

Phase 4 §6 の Red 期待結果に対応し、後続実装で green へ転じる対象を一覧化する。

| 対象 | Red の理由（実装前 fail） | Green 化の実装 | 対応 AC |
| --- | --- | --- | --- |
| ZL-1..4（`ZONE_LABEL` 新値） | 現行は `"0→1 区画"` 等で新値 `"0 回（未出席）"` 他と不一致 | `format-attendance.ts` の `ZONE_LABEL` を回数表記へ更新 | AC-3 |
| ZL-5（`ZONE_HELP` export） | 現行に `ZONE_HELP` が存在しない | `format-attendance.ts` に `ZONE_HELP` 文字列定数を追加・export | AC-3 |
| ZC-1（0% バー幅 `"0"`） | 現行 `Math.max(2, row.rate*100)` で 0% でも `"2"` | ZoneChart の fill rect 幅計算を `Math.max(0,…)` へ是正 | AC-2 |
| ZC-2（低率バー幅 `"1"`） | 同上、`0.01*100=1` が `Math.max(2,1)=2` になる | 同上 | AC-2 |
| ZC-3（`ZONE_HELP` 描画） | 現行コンポーネントに凡例キャプション描画なし | ZoneChart に `ZONE_HELP` を凡例キャプションとして描画 | AC-3 |
| ZC-4（`"0 回（未出席）"` 描画） | 現行は `"0→1 区画"` を描画 | `ZONE_LABEL` 経由で新ラベルを行ラベルに描画 | AC-3 |
| ZC-5/ZC-6（空状態 / ラッパー testid） | 現行に `data-testid` 未付与の可能性 | `attendance-zone-empty` / `attendance-zone-distribution` testid 付与 + スタイル付き空状態 | AC-1/AC-5 |
| KP-1（`"unique"` 非存在） | 現行 hint が `"期間内 unique 出席者"` | `KpiPanel.tsx` の hint から「unique」を除去 | AC-4 |
| KP-2（`"延べ"` 描画） | 現行に「延べ」表記なし | hint を延べ出席数表記へ是正 | AC-4 |
| AC-1 レイアウト CSS | `globals.css` に `.attendance-*` レイアウト CSS 未配線 | `@layer components` 末尾に CSS ブロック追加 | AC-1 |
| AC-5 見方ガイド | `AttendanceAnalyticsPage.tsx` に見方ガイド未配置 | `.attendance-page-guide` / `.attendance-section-intro` を追加 | AC-5 |

> いずれも `apps/web` 内に閉じ、1 つの実装サイクル（03.実装.md）で green 化可能。実装後に Phase 9 の focused vitest / gate で全 PASS を確認する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-1-requirements.md` | AC-1..AC-9 定義・根本原因 |
| 設計レビュー | `docs/30-workflows/admin-attendance-dashboard-ux/phase-3-design-review.md` | MINOR 0 件・不変条件適合・AC トレース |
| テスト計画 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-4-test-plan.md` | Red 期待結果（§6）・テストケース表 |
| QA | `docs/30-workflows/admin-attendance-dashboard-ux/phase-9-qa.md` | grep gate・検証コマンド・AC マッピング |
| 手動テスト計画 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-11-manual-test.md` | AC-1/2/3/4/5 の視覚確認（runtime_pending） |
| artifacts | `docs/30-workflows/admin-attendance-dashboard-ux/artifacts.json` | gates / phase 状態 |

### システム仕様（aiworkflow-requirements）

> 実装着手時に以下のシステム仕様を再確認し、既存設計との整合性を維持する。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-9 最終トレース（3-state）・MINOR 追跡・不変条件適合・green 化対象一覧 |
| 最終判定 | 判定 | 仕様書として PASS（実装着手可） |

## 統合テスト連携

- 本 Phase の AC トレースが Phase 12 `phase12-task-spec-compliance-check.md` の 4 条件 verdict / AC trace 節と一致すること。
- MINOR 0 件が Phase 3 → Phase 10 → Phase 12 で一貫していること。
- 「実装サイクルで green 化すべき項目」が Phase 4 §6 Red 期待結果・Phase 9 focused vitest と 1:1 で対応していること。
- Phase 11（視覚）の `runtime_pending` 行が user-gated として本改善サイクルへ引き継がれること。

## 最終判定

**仕様書として PASS（実装着手可）**。

- AC-1..AC-9 がすべて `implemented_local_runtime_pending` として trace 済み。視覚依存（AC-1/2/3/5）は Phase 11 `runtime_pending` を明示して境界化。
- MINOR 指摘 0 件（Phase 3 由来）を確定記録。
- 不変条件 #1/#2/#5/#8/#9 に最終適合。
- TDD Red → Green の対象は今回 `apps/web` 内に閉じて green 化済み。

## 完了条件

1. AC-1..AC-9 が 3-state 語彙（`implemented_local_runtime_pending` / `runtime_pending` / `completed`）で trace されていること。
2. MINOR 追跡テーブルが 0 件で Phase 3 と一致していること。
3. 不変条件 #1/#2/#5/#8/#9 の最終適合が確認されていること。
4. 実装サイクルで green 化すべき項目が Phase 4 Red / Phase 9 vitest と対応づけて一覧化されていること。
5. 最終判定が「仕様書として PASS（実装着手可）」であること。
