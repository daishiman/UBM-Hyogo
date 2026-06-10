# Phase 5 — 実装手順書（runbook）

> 後続実装者がそのまま着手できる粒度。import 含むスケルトン・CSS・MINOR 解消・検証コマンドまで網羅する。
> 全パスは repo ルート `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260608-154717-wt-13/` からの相対。
> 不変条件: API/D1/shared 型を変更しない（AC-7）/ 新規 primitive ゼロ（AC-6）/ HEX 直書きゼロ（AC-5）。

---

## 0. 着手前の前提確認（実コード裏取り）

実装前に以下を `grep` / Read で再確認すること（本 runbook は確定済だが drift 防止）:

```bash
# shared 型の実フィールド（fixture/props の整合）
grep -nE "SessionAttendanceRowView|MemberAttendanceRankingView" packages/shared/src/zod/viewmodel.ts
# SafeResult の import 元（既存 component の import を踏襲）
grep -rn "SafeResult" apps/web/src/features/admin/attendance apps/web/src/lib | head
# Segmented の API（options/value/onChange/ariaLabel・role=radiogroup）
sed -n '1,20p' apps/web/src/components/ui/Segmented.tsx
```

確定事実（`_shared-context.md` §10）:
- primitive は **PascalCase**: `components/ui/{Badge,Card,Stat,Segmented,EmptyState}.tsx`。
- `Badge` tone = `"default" | "accent" | "success" | "warning" | "danger" | "info"`（`ok`/`warn` は無い）。要フォロー warn = `warning`、健全 = `success`。
- `Segmented` は `role="radiogroup"` + 各 option `<button role="radio" aria-label={label}>`。
- token: `--ubm-color-ok` / `--ubm-color-ok-soft` / `--ubm-color-warn` / `--ubm-color-warn-soft` / `--ubm-color-accent` / `--ubm-space-{1..24}` / `--ubm-radius-{sm,md,lg,xl}` / `--ubm-shadow-{xs,sm,md}` / `--ubm-text-3xl` が tokens.css に実在（裏取り済）。

---

## 1. 新規 / 編集ファイル一覧テーブル（[Feedback RT-03]）

| # | パス | 種別 | 責務（After） |
| --- | --- | --- | --- |
| 1 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts` | **新規** | `attendanceFollowLevel(count): "none" \| "warn"` 純粋関数 |
| 2 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx` | **新規** | DETAIL ゾーンの Segmented タブホスト（internal state で 3 表を排他描画） |
| 3 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集 | 8 縦積み → 3 ゾーン（PRIMARY/TREND/DETAIL）分配へ統括組み替え |
| 4 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | 出席率を hero（`--ubm-text-3xl`）へ昇格、残りを secondary KPI 行に分離 |
| 5 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | 編集 | PRIMARY 2 枚目 hero 化 + `data-attendance-follow`（none/warn）+ Badge tone |
| 6 | `apps/web/src/styles/globals.css` | 編集 | `.attendance-zones` / `.attendance-primary-grid` / `.attendance-hero-*` / `.attendance-follow-hero` / `.attendance-trend-grid` / `.attendance-detail-tabs` を追加（全色 token） |
| 7 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 編集（M-1） | `attendance-analytics-page` 系 class/testid の二重を解消（route 側を最小化） |
| 8 | `apps/web/src/features/admin/attendance/__tests__/attendanceFollowLevel.spec.ts` | **新規** | TC-01〜TC-03b |
| 9 | `apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx` | **新規** | TC-04〜TC-10, TC-16 |
| 10 | `apps/web/src/features/admin/attendance/__tests__/AttendancePrimaryHero.spec.tsx` | **新規** | TC-13, TC-14, TC-15, TC-17 |
| 11 | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 編集（追従） | TC-11, TC-12, TC-11b |

> 削除ファイルはなし。

---

## 2. 各ファイル Before / After 責務

| ファイル | Before | After / 差分の意図 |
| --- | --- | --- |
| `AttendanceAnalyticsPage.tsx` | bundle 取得 + 8 セクション縦積み（`flex flex-col gap-4`） | bundle 取得は不変。出力を `<div className="attendance-analytics-page attendance-zones">` 配下の 3 ゾーン（`<section>`）に分配。PRIMARY = KpiPanel + AbsenteeAlert（2 枚 grid）、TREND = Trend + Zone（既存 `.attendance-charts-grid` を `.attendance-trend-grid` に整理）、DETAIL = `AttendanceDetailTabs`。各ゾーンに `<h2>`（概況/傾向/詳細）。degrade（`AdminSectionErrorClient`）はゾーン/タブ単位で温存 |
| `KpiPanel.tsx` | 5 枚均等 grid（全カード同サイズ） | 出席率カードを hero（`.attendance-hero-rate` / `--ubm-text-3xl` + delta + ユニーク率）に昇格。残り（延べ/ユニーク/平均/セッション）は secondary 行に。**既存 testid（`attendance-kpi-rate` 等）を全維持**（追従 spec の破壊回避）。0除算回避・delta null 処理は不変 |
| `AttendanceAbsenteeAlert.tsx` | `<details open>` のみ（縦積み末尾） | ルート要素を hero ラッパ `<section className="attendance-follow-hero" data-attendance-follow={level}>` に。`level = attendanceFollowLevel(data.rows.length)`。件数 Badge（warn=warning / none=success）。詳細リストは既存 `<details>` をラッパ内に温存（描画内容不変） |
| `AttendanceTrendChart.tsx` / `AttendanceZoneDistributionChart.tsx` | 2 カラム左右で描画 | **触れない**。配置（TREND ゾーン）は親 `AttendanceAnalyticsPage` 側の grid クラスで実現。描画内容・testid 不変 |
| `SessionAttendanceTable.tsx` / `MemberAttendanceTable.tsx` / `AttendanceTop10Ranking.tsx` | 独立セクション | **触れない**。`AttendanceDetailTabs` の各タブ body にそのまま埋め込む。modal も不変 |
| `globals.css` | `.attendance-charts-grid` 等が既存 | 3 層クラス追加（§5）。既存 `.attendance-charts-grid` は残しつつ `.attendance-trend-grid` を別途追加（後方互換）。`.attendance-kpi-*` は流用 |
| `page.tsx` | route 直下に `attendance-analytics-page` 系 class/testid（二重） | M-1: route 側は `AdminPageHeader` + `AttendanceAnalyticsPage` のラッパに留め、`attendance-analytics-page` class/testid は `AttendanceAnalyticsPage` 側に一本化 |

---

## 3. 新規 component スケルトン

### 3.1 `lib/attendance-follow-level.ts`（純粋関数 / [WEEKGRD-02]）

```ts
/**
 * 要フォロー対象（直近 N セッション連続欠席者）の件数からトーンレベルを返す純粋関数。
 * issue-1112 の attendanceLevel（none/normal/high・出席多寡）とは意味が逆のため命名分離（MINOR M-2）。
 * 例外を throw せず必ず値を返す（[WEEKGRD-02]）。
 *
 * @param count 要フォロー件数（負数は防御的に none 扱い）
 * @returns "none"（count <= 0・健全）/ "warn"（count >= 1・要対応）
 */
export type AttendanceFollowLevel = "none" | "warn";

export function attendanceFollowLevel(count: number): AttendanceFollowLevel {
  if (!Number.isFinite(count) || count <= 0) return "none";
  return "warn";
}
```

### 3.2 `components/AttendanceDetailTabs.tsx`（Segmented + internal state）

```tsx
"use client"; // useState + Segmented onChange のため client component

import { useState } from "react";
import type { SafeResult } from "@/lib/result"; // ← 着手時に既存 component の import 元を grep で確認し合わせる
import type {
  SessionAttendanceRowView,
  MemberAttendanceRankingView,
} from "@ubm-hyogo/shared"; // 既存 shared 型のみ（AC-7）
import { Segmented } from "@/components/ui/Segmented";
import { AdminSectionErrorClient } from "@/features/admin/components/_shared";
import { SessionAttendanceTable } from "./SessionAttendanceTable";
import { MemberAttendanceTable } from "./MemberAttendanceTable";
import { AttendanceTop10Ranking } from "./AttendanceTop10Ranking";

export type DetailTabKey = "session" | "member" | "top10";

export interface AttendanceDetailTabsProps {
  readonly bySession: SafeResult<readonly SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<readonly MemberAttendanceRankingView[]>;
  readonly initialTab?: DetailTabKey;
}

const TAB_OPTIONS: ReadonlyArray<{ value: DetailTabKey; label: string }> = [
  { value: "session", label: "セッション別" },
  { value: "member", label: "会員別" },
  { value: "top10", label: "TOP10" },
];

export function AttendanceDetailTabs({
  bySession,
  ranking,
  initialTab = "session",
}: AttendanceDetailTabsProps) {
  // [VSCPKR-03] タブ選択は internal state（親から制御しない）
  const [activeTab, setActiveTab] = useState<DetailTabKey>(initialTab);

  return (
    <div className="attendance-detail-tabs" data-testid="attendance-detail-tabs">
      <Segmented
        ariaLabel="出席詳細の表示切替"
        options={TAB_OPTIONS as { value: string; label: string }[]}
        value={activeTab}
        onChange={(v) => setActiveTab(v as DetailTabKey)}
      />
      <div className="attendance-detail-tab-body">
        {activeTab === "session" ? (
          bySession.ok ? (
            <SessionAttendanceTable rows={bySession.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="セッション別出席状況"
              code={bySession.error.code}
              message={bySession.error.message}
            />
          )
        ) : null}

        {activeTab === "member" ? (
          ranking.ok ? (
            <MemberAttendanceTable rows={ranking.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="会員別出席率"
              code={ranking.error.code}
              message={ranking.error.message}
            />
          )
        ) : null}

        {activeTab === "top10" ? (
          ranking.ok ? (
            <AttendanceTop10Ranking rows={ranking.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="出席ランキング TOP 10"
              code={ranking.error.code}
              message={ranking.error.message}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
```

> 排他表示（AC-3 / TC-04〜06）: `activeTab === X ? ... : null` で非選択タブ body は DOM 非生成。`member`/`top10` は `ranking` 共通 source（ranking error 時は両タブ degrade = TC-10）。

### 3.3 `AttendanceAnalyticsPage.tsx` 統括組み替え（3 ゾーン分配）

```tsx
// import に AttendanceDetailTabs を追加し、SessionAttendanceTable / MemberAttendanceTable /
// AttendanceTop10Ranking の直接描画を AttendanceDetailTabs へ移す。
// SafeResult 全体（bundle.bySession / bundle.ranking）をタブホストへ渡す（server で .data を抜かない）。

return (
  <div data-testid="attendance-analytics-page" className="attendance-analytics-page attendance-zones">
    <p className="attendance-page-guide">…（既存ガイド文・不変）</p>
    <AttendanceFilterBar initial={filterState} />

    {/* ── PRIMARY ── */}
    <section className="attendance-zone attendance-zone-primary" aria-labelledby="attendance-zone-primary-heading">
      <h2 id="attendance-zone-primary-heading">概況</h2>
      <div className="attendance-primary-grid">
        {bundle.overview.ok ? (
          <KpiPanel overview={bundle.overview.data} attendeeCount={attendeeCount} />
        ) : (
          <AdminSectionErrorClient sectionLabel="出席KPI" code={bundle.overview.error.code} message={bundle.overview.error.message} />
        )}
        {bundle.absentees.ok ? (
          <AttendanceAbsenteeAlert data={bundle.absentees.data} />
        ) : (
          <AdminSectionErrorClient sectionLabel="要フォローアップ" code={bundle.absentees.error.code} message={bundle.absentees.error.message} />
        )}
      </div>
    </section>

    {/* ── TREND ── */}
    <section className="attendance-zone attendance-zone-trend" aria-labelledby="attendance-zone-trend-heading">
      <h2 id="attendance-zone-trend-heading">傾向</h2>
      <div className="attendance-trend-grid">
        <div>
          <h3>出席トレンド</h3>
          {bundle.trend.ok ? <AttendanceTrendChart trend={bundle.trend.data} /> : <AdminSectionErrorClient sectionLabel="出席トレンド" code={bundle.trend.error.code} message={bundle.trend.error.message} />}
        </div>
        <div>
          <h3>出席回数帯別分布</h3>
          {bundle.zoneDistribution.ok ? <AttendanceZoneDistributionChart data={bundle.zoneDistribution.data} /> : <AdminSectionErrorClient sectionLabel="区画別分布" code={bundle.zoneDistribution.error.code} message={bundle.zoneDistribution.error.message} />}
        </div>
      </div>
    </section>

    {/* ── DETAIL ── */}
    <section className="attendance-zone attendance-zone-detail" aria-labelledby="attendance-zone-detail-heading">
      <h2 id="attendance-zone-detail-heading">詳細</h2>
      <AttendanceDetailTabs bySession={bundle.bySession} ranking={bundle.ranking} />
    </section>
  </div>
);
```

> 旧コードの `<h2>セッション別出席状況</h2>` 〜 `要フォローアップ` ブロック（行 80-128）を削除し、上記 DETAIL/PRIMARY へ統合する。`attendeeCount` の計算（bySession reduce）は不変で残す。

### 3.4 `KpiPanel.tsx` hero 分離（既存 testid 維持）

- 出席率カードを `<div className="attendance-hero-card attendance-hero-rate" data-testid="attendance-kpi-rate">` として `--ubm-text-3xl` の値表示 + delta + ユニーク率 hint に拡張。
- 残り 4 枚（attendees / unique / avg / sessions）は `.attendance-kpi-grid` の secondary 行として既存 `Card` ローカル component を流用。
- **testid（`attendance-kpi-rate` / `attendance-kpi-attendees` / `attendance-kpi-unique` / `attendance-kpi-avg` / `attendance-kpi-sessions`）は変更しない**（TC-11b 追従の破壊回避）。

### 3.5 `AttendanceAbsenteeAlert.tsx` hero 化

```tsx
import type { AttendanceAbsenteeList } from "@ubm-hyogo/shared";
import { ZONE_LABEL } from "../lib/format-attendance";
import { attendanceFollowLevel } from "../lib/attendance-follow-level";
import { Badge } from "@/components/ui/Badge";

export function AttendanceAbsenteeAlert({ data }: { readonly data: AttendanceAbsenteeList }) {
  const count = data.rows.length;
  const level = attendanceFollowLevel(count); // "none" | "warn"
  const tone = level === "warn" ? "warning" : "success";

  return (
    <section
      className="attendance-hero-card attendance-follow-hero"
      data-attendance-follow={level}
      data-testid="attendance-follow-hero"
      aria-label="要フォロー対象"
    >
      <div className="attendance-hero-eyebrow">要フォロー対象</div>
      <Badge tone={tone}>{count} 名</Badge>
      {count === 0 ? (
        <p className="attendance-list-empty" data-testid="attendance-absentee-empty">
          直近 {data.lastN} セッション連続欠席のメンバーはいません
        </p>
      ) : (
        <details className="attendance-absentee-alert" data-testid="attendance-absentee-alert" open>
          <summary>要フォローアップ {count} 名 (直近 {data.lastN} セッション)</summary>
          <ul>
            {data.rows.slice(0, 50).map((row) => (
              <li key={row.memberId}>
                <span>{row.displayName || row.memberId}</span>
                <span>{ZONE_LABEL[row.zone]}</span>
                <span>欠席 {row.missedCount} 回</span>
                <span>最終出席: {row.lastAttendedAt ?? "—"}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
```

> 既存 testid（`attendance-absentee-empty` / `attendance-absentee-alert`）を維持。新規 `data-attendance-follow` + `attendance-follow-hero` testid を追加（TC-13/14）。

---

## 4. `attendanceFollowLevel` 純粋関数定義（再掲・確定形）

§3.1 のとおり。要点:
- 戻り値: `count <= 0`（含む負数・非有限）→ `"none"` / それ以外 → `"warn"`。
- **例外を投げない**（[WEEKGRD-02]）。`Number.isFinite` ガードで NaN を `none` に倒す。
- 命名分離（M-2）: issue-1112 の `attendanceLevel`（none/normal/high）と別ファイル・別関数・別属性（`data-attendance-follow`）。

---

## 5. globals.css 追加クラス（全色 var(--ubm-color-*)・HEX ゼロ = AC-5）

`apps/web/src/styles/globals.css` の `/* === attendance dashboard … === */` ブロック末尾（既存 `.attendance-*` 群の後）に追加する。**色は全て token 参照。HEX / `#xxx` を一切書かない**。

```css
  /* ── 3 層ゾーンの縦リズム ── */
  .attendance-zones {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-6); /* 24px: ゾーン間を広く取り階層を可視化 */
  }

  .attendance-zone > h2 {
    margin: 0 0 var(--ubm-space-3);
    font-size: var(--ubm-text-xl); /* 20px: ゾーン見出し */
    font-weight: 700;
    color: var(--ubm-color-text-primary);
  }

  .attendance-zone h3 {
    margin: 0 0 var(--ubm-space-2);
    font-size: var(--ubm-text-lg); /* 16px: ゾーン内サブ */
    font-weight: 600;
    color: var(--ubm-color-text-primary);
  }

  /* ── PRIMARY: 2 枚 hero grid ── */
  .attendance-primary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--ubm-space-4);
  }

  @media (min-width: 1024px) {
    .attendance-primary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .attendance-hero-card {
    padding: var(--ubm-space-6);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-xl); /* 20: hero は強調 */
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-md);
  }

  .attendance-hero-eyebrow {
    font-size: var(--ubm-text-xs);
    font-weight: 600;
    letter-spacing: var(--ubm-eyebrow-tracking);
    text-transform: uppercase;
    color: var(--ubm-color-text-muted);
  }

  /* 出席率 hero: 特大数値（AC-1） */
  .attendance-hero-rate .attendance-kpi-value {
    font-size: var(--ubm-text-3xl); /* 32px: 最大焦点 */
    font-weight: 700;
    color: var(--ubm-color-accent-ink);
    line-height: 1.1;
  }

  /* ── 要フォロー hero: 件数でトーン切替（AC-4 / data-attendance-follow） ── */
  .attendance-follow-hero[data-attendance-follow="none"] {
    border-color: var(--ubm-color-ok);
    background: var(--ubm-color-ok-soft);
  }

  .attendance-follow-hero[data-attendance-follow="none"] .attendance-hero-eyebrow {
    color: var(--ubm-color-ok);
  }

  .attendance-follow-hero[data-attendance-follow="warn"] {
    border-color: var(--ubm-color-warn);
    background: var(--ubm-color-warn-soft);
  }

  .attendance-follow-hero[data-attendance-follow="warn"] .attendance-hero-eyebrow {
    color: var(--ubm-color-warn);
  }

  /* ── TREND: 2 カラム（既存 .attendance-charts-grid と同等リズム） ── */
  .attendance-trend-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--ubm-space-4);
  }

  @media (min-width: 1024px) {
    .attendance-trend-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .attendance-trend-grid > div {
    padding: var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-sm);
  }

  /* ── DETAIL: Segmented タブ + body ── */
  .attendance-detail-tabs {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-4);
    padding: var(--ubm-space-4);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    background: var(--ubm-color-surface-panel);
    box-shadow: var(--ubm-shadow-sm);
  }

  .attendance-detail-tab-body {
    min-block-size: var(--ubm-space-16); /* タブ切替時の高さブレ抑制 */
  }
```

> HEX 検証: 上記ブロックに `#` / `bg-[#` / `text-[#` が 1 件も無いことを §7 の grep gate で確認する。既存 `.attendance-top10-bar` 等の `fill="var(--ubm-color-*)"`（SVG・component 側）は不変。

---

## 6. MINOR 解消手順

### M-1: route 二重 className / testid（`page.tsx`）

- 現状: `page.tsx` と `AttendanceAnalyticsPage` の双方が `attendance-analytics-page` 系 class/testid を持つ可能性（Phase 1 検出）。
- 解消: `attendance-analytics-page` class と `data-testid="attendance-analytics-page"` は **`AttendanceAnalyticsPage` 側に一本化**。`page.tsx` 側のラッパは `AdminPageHeader` + `<AttendanceAnalyticsPage />` のみとし、重複 class/testid を除去する。
- 確認: `grep -rn "attendance-analytics-page" apps/web/app/(admin)/admin/dashboard/attendance/page.tsx apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` で testid が 1 箇所のみであること。

### M-2: `attendanceFollowLevel` 命名分離

- issue-1112 の `attendanceLevel`（none/normal/high）を**流用しない**。新規 `lib/attendance-follow-level.ts` + `data-attendance-follow`（値 none/warn）で命名を物理分離する（§3.1 / §3.5）。
- 確認: `grep -rn "data-attendance-level\|attendanceLevel(" apps/web/src/features/admin/attendance` が要フォロー文脈にヒットしないこと（別概念の混入防止）。

---

## 7. 挙動不変で温存する機能の確認手順（AC-10）

| 機能 | 温存方法 | 確認手順 |
| --- | --- | --- |
| フィルタ（期間 / 回数帯） | `AttendanceFilterBar` 不変・PRIMARY 直上配置のまま | `git diff --stat apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` が空。手動: 期間プリセット切替で URL searchParams が更新され再 fetch される |
| CSV エクスポート | `buildExportUrlClient.ts` 不変 | diff 空。手動: CSV ボタンで export URL 生成 |
| ドリルダウン modal | `AttendanceDrilldownModal.tsx` / `SessionAttendanceTable.tsx` 不変 | diff 空。手動: DETAIL「セッション別」タブの「詳細」ボタンで modal 開閉 |
| フッター生成日時 | 既存描画不変 | diff 確認 |
| SafeResult degrade | ゾーン/タブ単位 `AdminSectionErrorClient` を温存 | TC-08〜10（DETAIL）+ PRIMARY/TREND の error 分岐を維持 |

---

## 8. ローカル検証コマンド

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# リント
mise exec -- pnpm --filter @ubm-hyogo/web lint

# vitest（対象限定・--root . 必須）
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .

# OpenNext 互換ビルド
mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack

# HEX 直書き検出 gate（AC-5）— 出力が PASS であること
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance apps/web/src/styles/globals.css && echo "FAIL" || echo "PASS"'

# AC-7 確認: api / shared に diff が無いこと（出力が空）
git diff --stat apps/api packages/shared

# AC-6 確認: components/ui への新規追加が無いこと（出力が空）
git status --porcelain apps/web/src/components/ui
```

> 注: 既存 `globals.css` に元から HEX が含まれる場合は、追加分（attendance ブロック）に限定して grep するか、`git diff apps/web/src/styles/globals.css | grep -nE '^\+.*#[0-9a-fA-F]{3,6}'` で**追加行のみ**を検査する。

---

## 9. TC ↔ ファイル変更 対応（Green 化マップ）

| TC | Green にする変更 |
| --- | --- |
| TC-01〜03b | §3.1 `attendance-follow-level.ts` 新規 |
| TC-04〜07, TC-16 | §3.2 `AttendanceDetailTabs.tsx` 新規（Segmented + useState + 排他描画） |
| TC-08〜10 | §3.2 タブ body の `SafeResult.ok` 分岐 → `AdminSectionErrorClient` |
| TC-11, TC-12, TC-11b | §3.4 `KpiPanel.tsx` hero 化（testid 維持） |
| TC-13, TC-14 | §3.5 `AttendanceAbsenteeAlert.tsx` hero 化 + `data-attendance-follow` |
| TC-15, TC-17 | §3.3 `AttendanceAnalyticsPage.tsx` 3 ゾーン + h2/h3 + `.attendance-primary-grid` |
| TC-18〜20 | 既存不変（Trend/Zone/lib 非変更）で pass 維持 |
