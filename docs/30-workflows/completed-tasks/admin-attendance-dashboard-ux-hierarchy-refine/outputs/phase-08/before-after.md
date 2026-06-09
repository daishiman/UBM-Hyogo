# Phase 8 リファクタ Before/After テーブル（[Feedback RT-03]）

> 形式: `対象 / Before / After / 理由 / 挙動不変の確認方法`。最低 4 行（M-1 一元化 / KpiPanel→hero 責務分離 / flat→3 層 DOM ツリー / globals.css 整理）を必須とする。全行に「挙動不変であること」の確認方法を添える。

## 1. リファクタ行テーブル

| # | 対象 | Before | After | 理由 | 挙動不変の確認方法 |
| --- | --- | --- | --- | --- | --- |
| 1 | M-1: route 二重 className/testid | `page.tsx` と `AttendanceAnalyticsPage` が両方 `className="attendance-analytics-page"` / `data-testid="attendance-analytics-page"` を持つ（重複） | testid は `AttendanceAnalyticsPage` 側 1 箇所に集約。`page.tsx` 外枠は責務外の class のみ。内部 3 層は `attendance-zone-{primary,trend,detail}` に分離 | duplicate（testid 衝突）解消。テストの一意セレクタを明確化（M-1 / AC-10） | (a) `grep -rn "attendance-analytics-page" __tests__/` で依存箇所を事前確認し残す側に寄せる (b) Phase 7 TC 全 PASS (c) testid 維持を grep で確認 |
| 2 | `KpiPanel` → PRIMARY hero 責務分離 | 5 枚 KPI を均等ウェイトで 1 グリッドに描画（焦点なし） | hero（出席率 `Stat` `--ubm-text-3xl` + delta + unique ／ 要フォロー `Badge` tone）と secondary stat 列に責務分離 | 焦点の明確化（AC-1）。均等重みで埋もれていた最重要 2 判断を hero に昇格 | (a) `KpiPanel.spec.tsx` の挙動不変アサーション（数値・delta 描画）が PASS (b) 出席率 / unique / delta の値が Before と同一であることを TC-C-HERO-01 で検証 (c) Phase 11 screenshot で値の同一性確認 |
| 3 | 8 セクション flat → 3 層 DOM ツリー | §2 の flat ツリー（h2 が 8 個並列） | §3 の 3 層ネストツリー（PRIMARY/TREND/DETAIL = h2 3 個、ゾーン内サブ = h3） | 視覚的階層の明確化（AC-2）。情報の優先順位を DOM 構造に反映 | (a) TC-I-LAYOUT-02（3 ゾーンの h2 存在）/ TC-I-A11Y-01（h1>h2>h3）PASS (b) 各テーブル内容・行数が Before と同一であることを TC で検証（AC-10） |
| 4 | `globals.css` `.attendance-*` クラス整理 | flat 前提クラス（旧 grid 等）と新 3 層クラスが混在・未使用残存 | 未使用クラス削除 + `.attendance-zone-*` / `.attendance-hero-*` へ集約。全プロパティ `var(--ubm-*)` 経由 | 重複/未使用削減。CSS 保守性向上。HEX 非増加（AC-5） | (a) Phase 9 token-audit（HEX / `bg-[#` / `text-[#` ゼロ）PASS (b) `verify-design-tokens` gate PASS (c) Phase 11 screenshot で視覚差分が意図した変化のみ |

## 2. Before — flat DOM ツリー（現状）

```
<main (admin layout)>
  AdminPageHeader (h1: 出席ダッシュボード)
  AttendanceAnalyticsPage  [data-testid="attendance-analytics-page"]  ← 重複(M-1)
    AttendanceFilterBar
    KpiPanel            (h2) ─ 5 枚均等 KPI
    div.attendance-charts-grid
      AttendanceTrendChart           (h2)
      AttendanceZoneDistributionChart(h2)
    SessionAttendanceTable           (h2)
    MemberAttendanceTable            (h2)
    AttendanceTop10Ranking           (h2)
    AttendanceAbsenteeAlert          (h2)
  page.tsx wrapper  [data-testid="attendance-analytics-page"]  ← 重複(M-1)
```

- 問題: h2 が 8 個フラットに並列（階層・焦点なし）/ testid 二重。

## 3. After — 3 層ネスト DOM ツリー

```
<main (admin layout)>
  AdminPageHeader (h1: 出席ダッシュボード)
  AttendanceAnalyticsPage  [data-testid="attendance-analytics-page"]  ← 一元化(1 箇所)
    AttendanceFilterBar                                    (filter / PRIMARY 直上)
    section.attendance-zone-primary  [aria-labelledby=zone-primary]   (h2: 重要指標)
      KpiPanel(hero)         ─ ① 出席率 Stat(--ubm-text-3xl)+delta+unique  (h3)
      AttendanceAbsenteeAlert ─ ② 要フォロー Badge(tone)+details          (h3)
    section.attendance-zone-trend    [aria-labelledby=zone-trend]     (h2: 傾向)
      AttendanceTrendChart(Card)            (h3)
      AttendanceZoneDistributionChart(Card) (h3)
    section.attendance-zone-detail   [aria-labelledby=zone-detail]    (h2: 詳細)
      AttendanceDetailTabs (Segmented role=radiogroup)
        ├─ SessionAttendanceTable   (タブ: session)
        ├─ MemberAttendanceTable    (タブ: member)
        └─ AttendanceTop10Ranking   (タブ: top10)
  page.tsx wrapper  (外枠 class のみ・testid なし)  ← 重複解消(M-1)
```

- 改善: h2 が 3 個（PRIMARY/TREND/DETAIL）+ ゾーン内 h3 で論理階層 / testid 一元化 / DETAIL タブ統合で初期スクロール削減。

## 4. 挙動不変の総合確認（全行共通）

| 確認軸 | 手段 |
| --- | --- |
| 機能不変 | Phase 7 の TC を全件再実行し全 PASS（`vitest run apps/web/src/features/admin/attendance --root .`） |
| testid 不変 | 既存 spec が依存する testid を grep で確認・維持 |
| token 不変 | Phase 9 token-audit（HEX ゼロ）+ `verify-design-tokens` gate |
| 視覚差分 | Phase 11 screenshot で「3 層化の意図した変化のみ」を確認 |
| API/D1/shared 不変 | `git diff --name-only` に `apps/api` / `packages/shared` が現れない（AC-7） |
