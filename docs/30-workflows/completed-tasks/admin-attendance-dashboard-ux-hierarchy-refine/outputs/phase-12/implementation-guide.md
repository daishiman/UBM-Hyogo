# 実装ガイド — 出席ダッシュボード UI/UX 階層リファイン

> ステータス: `completed`。実装・ローカル機械検証は完了。Part 1（中学生レベル）+ Part 2（開発者レベル）+ 視覚証跡で構成する。8 canonical PNG は `pending_visual_capture`。

---

## Part 1 — 中学生レベルの説明（専門用語なし・例え話）

### なぜ必要か

管理者が見る「出席ダッシュボード」という画面があります。今はそこに、出席率・グラフ・表・ランキング・欠席者リストなど、**8 つの情報が同じ大きさで上から下にずらっと並んでいます**。

これは、教室の掲示板に、テストの平均点も、時間割も、給食の献立も、全部同じサイズの紙で隙間なく貼ってあるようなものです。どれが一番大事なのか、ぱっと見て分かりません。「結局、今日は何を見ればいいの?」と迷ってしまいます。

ユーザー（管理者）からも「めちゃくちゃ見にくい・パッと見て何をしたいか分からない」という声が出ました。これが直したい問題です。

### 何をするか

情報の量は減らしません。**並べ方と見せ方だけ**を変えて、大事なものから順に目に入るようにします。掲示板を 3 段に整理するイメージです。

1. **一番上の段（いちばん大事）**: 「全体の出席率はどれくらい?（とても大きな数字で）」と「フォローが必要な人は何人いる?」の 2 つだけを大きく目立たせます。フォローが必要な人がいるときは色を変えて（注意の色に）気づきやすくします。
2. **真ん中の段（流れを見る）**: 月ごとの出席の移り変わりのグラフと、参加回数の偏りのグラフを 2 つ並べます。
3. **一番下の段（くわしく見たいとき）**: 「セッション別」「会員別」「トップ 10」の 3 つの表を、タブで切り替えられる 1 つの場所にまとめます。最初は 1 つだけ表示されるので、画面が長くなりすぎません。

これで「ぱっと見て、出席は健全か・気にかける人はいるか」がすぐ分かり、もっと知りたいときだけ下を見る、という自然な流れになります。

### 大事な約束（変えないこと）

- データを取ってくる仕組み（サーバ側）は **一切変えません**。見せ方だけ変えます。
- 色は決められた「色のパレット」からだけ使います（自分で勝手な色コードを書きません）。
- もともと出来ていたこと（絞り込み・CSV ダウンロード・詳細ポップアップ）は全部そのまま動きます。

---

## Part 2 — 開発者レベルの説明

### 概要

`/admin/dashboard/attendance` の表現層（`apps/web/src/features/admin/attendance/`）のみを再構成する。データ取得（6 endpoint bundle）・shared 型・API・D1 は不変（AC-7）。8 セクションのフラット縦積みを **PRIMARY / TREND / DETAIL の 3 ゾーン**へ再配置する。

### 変更ファイル一覧

| 区分 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx` | DETAIL ゾーンの Segmented タブホスト（internal state で 3 表を排他描画） |
| 新規 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts` | `attendanceFollowLevel(count)` 純粋関数 |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 3 ゾーン分配へ統括組み替え・className 二重整理（MINOR M-1） |
| 修正 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | PRIMARY hero（出席率特大）+ secondary KPI 行に分離 |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | hero 化 + `data-attendance-follow`（none/warn）トーン（MINOR M-2） |
| 修正 | `apps/web/src/styles/globals.css` | 3 層レイアウト用クラス追加・既存 `.attendance-*` リズム調整 |
| 修正（追従） | `apps/web/src/features/admin/attendance/__tests__/*.spec.tsx` | 既存 spec 追従（MINOR M-3）+ 新規 spec |
| **変更なし** | `apps/api/**` / `packages/shared/**` / `fetch-attendance.ts` / `useAttendanceFilters.ts` / `AttendanceDrilldownModal.tsx` | AC-7 / AC-10 |

### 新規コンポーネント TypeScript シグネチャ

#### `AttendanceDetailTabs`（feature ローカル・primitive ではない → AC-6 充足）

```ts
"use client"; // Segmented onClick / useState を使うため client component

import { useState } from "react";
import type { SafeResult } from "@/lib/result";
import type {
  SessionAttendanceRowView,
  MemberAttendanceRankingView,
} from "@ubm-hyogo/shared"; // 既存 shared 型のみ・新規型を作らない（AC-7）

export type DetailTabKey = "session" | "member" | "top10";

export interface AttendanceDetailTabsProps {
  readonly bySession: SafeResult<SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<MemberAttendanceRankingView[]>;
  readonly initialTab?: DetailTabKey; // 既定 "session"
}

export function AttendanceDetailTabs(props: AttendanceDetailTabsProps): JSX.Element {
  // [VSCPKR-03] タブ選択は internal state（外部 props ではない）
  const [activeTab, setActiveTab] = useState<DetailTabKey>(props.initialTab ?? "session");
  // Segmented(value=activeTab, onChange=setActiveTab) + activeTab で 3 表を排他描画
}
```

Segmented options（DETAIL タブ）:

| value | label | body | degrade |
| --- | --- | --- | --- |
| `session` | セッション別 | `bySession.ok` → `SessionAttendanceTable`（+ `AttendanceDrilldownModal` 不変） | else `AdminSectionErrorClient` |
| `member` | 会員別 | `ranking.ok` → `MemberAttendanceTable` | else `AdminSectionErrorClient` |
| `top10` | TOP10 | `ranking.ok` → `AttendanceTop10Ranking` | else `AdminSectionErrorClient` |

> `Segmented` は既存実装で `role="radiogroup"` + 各 option `role="radio"`（tablist ではない・§10 裏取り）。`ariaLabel="出席詳細の表示切替"` を付与。

#### `attendanceFollowLevel`（純粋関数・要フォロー強調）

```ts
// apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts
export type AttendanceFollowLevel = "none" | "warn";

// 欠席者（要フォロー対象）数に応じたトーン区分。
// issue-1112 の attendanceLevel（none/normal/high・出席「多寡」用）とは意味が逆のため命名分離（MINOR M-2）。
export function attendanceFollowLevel(followCount: number): AttendanceFollowLevel {
  return followCount > 0 ? "warn" : "none";
}
```

DOM: `AttendanceAbsenteeAlert` の hero ラッパーに `data-attendance-follow={attendanceFollowLevel(count)}` を付与。`warn` 時は warning surface、`none` 時は ok surface を既存 OKLch token で表現する。

### globals.css 追加クラス（例・実装サイクルで確定）

| クラス | 役割 | 主トークン |
| --- | --- | --- |
| `.attendance-zone--primary` / `.attendance-primary-grid` | PRIMARY ゾーン枠（最大ウェイト・2 カラム grid） | `--ubm-space-*` / `--ubm-shadow-xs` / responsive grid |
| `.attendance-zone--trend` / `.attendance-charts-grid` | TREND ゾーン枠（2 カラム） | `--ubm-space-*` / responsive grid |
| `.attendance-zone--detail` / `.attendance-detail-tabs` | DETAIL ゾーン枠（タブ統合） | `--ubm-space-*` / `--ubm-radius-lg` |
| `.attendance-kpi-value--hero` | 出席率特大数値 | `--ubm-text-3xl` / `--ubm-color-text-primary` |
| `[data-attendance-follow="warn"]` | 要フォロー強調 | `--ubm-color-warn` / `--ubm-color-warn-soft` |
| `[data-attendance-follow="none"]` | 要フォローなし | `--ubm-color-ok` / `--ubm-color-ok-soft` |

> 色は全て `var(--ubm-color-*)` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（AC-5）。新規 token は追加しない（既存 token のみ）。

### テスト

| テスト | 観点 | AC |
| --- | --- | --- |
| `AttendanceDetailTabs.spec.tsx`（新規） | Segmented 切替で 3 表が排他表示・初期 `session` | AC-3 |
| `AttendanceAbsenteeAlert.spec.tsx`（新規/追従） | 0 件=`data-attendance-follow="none"` / 1+=`"warn"` + Badge tone | AC-4 |
| `KpiPanel.spec.tsx`（追従） | hero 出席率 `--ubm-text-3xl` + delta + ユニーク率描画・testid 維持 | AC-1 / M-3 |
| `AttendanceAnalyticsPage.spec.tsx`（追従/新規） | 3 ゾーン DOM 分割・SafeResult error 時ゾーン単位 degrade・grid クラス | AC-2 / AC-8 / AC-10 |
| 既存 lib spec（温存） | `format-attendance` / `buildExportUrl` 不変 | AC-10 |

### 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .
mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack
# design token gate（HEX 直書き検出）
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance && echo "FAIL" || echo "PASS"'
```

> パッケージ名 `@ubm-hyogo/web` は `apps/web/package.json` の `name` を Phase 1 で実確認すること（_shared-context §9 注）。

### エッジケース

| ケース | 期待挙動 |
| --- | --- |
| 要フォロー 0 件 | `data-attendance-follow="none"` + `success` トーン。details は空でも崩れない |
| `ranking` SafeResult error | `member` / `top10` タブが両方 `AdminSectionErrorClient` を表示。`session` は描画継続 |
| `bySession` のみ error | `session` タブのみ degrade。`member`/`top10` 描画継続 |
| 全 bundle error | 各ゾーンが個別に degrade。ページ全体はクラッシュしない（SafeResult） |
| mobile 幅 | 3 ゾーンが 1 カラム縦積み。Segmented タップ領域確保（AC-8） |
| drilldown modal | `SessionAttendanceTable` 内で挙動不変（AC-10） |

---

## 視覚証跡（Phase 11 screenshot canonical 名）

VISUAL タスクのため、下記 8 canonical screenshot を `outputs/phase-11/screenshots/` に取得する（`outputs/phase-11/screenshot-plan.json` と一致）。現時点では PNG 実体は未取得。

| # | canonical 名 | 検証 AC |
| --- | --- | --- |
| ① | `attendance-dashboard-full.png` | AC-2 / AC-3 / AC-8 |
| ② | `attendance-primary-hero-followup-ok.png` | AC-1 / AC-4（要フォロー 0 件） |
| ③ | `attendance-primary-hero-followup-warn.png` | AC-1 / AC-4（要フォロー 1+ 件） |
| ④ | `attendance-trend-zone.png` | AC-2 / AC-8 |
| ⑤ | `attendance-detail-tabs-session.png` | AC-3 |
| ⑥ | `attendance-detail-tabs-member.png` | AC-3 |
| ⑦ | `attendance-detail-tabs-top10.png` | AC-3 |
| ⑧ | `attendance-dashboard-mobile.png` | AC-8 / AC-2 |

> 実 capture は staging 認証済み admin 画面で取得（user-gated）。capture script は `try { } finally { browser.close(); server.close(); }` を厳守（FB-MSO-003）。
