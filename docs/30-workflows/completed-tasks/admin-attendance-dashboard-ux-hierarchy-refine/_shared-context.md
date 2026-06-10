# 共有コンテキスト — admin-attendance-dashboard-ux-hierarchy-refine

> このファイルは SubAgent 全員が最初に読む共有正本。調査結果・方針・受入条件・実装区分を集約する。
> 仕様書本文（phase-NN.md / outputs/phase-N/*.md）はここを根拠に書く。

---

## 0. 実装区分

`[実装区分: 実装仕様書]` — コード変更を伴う（VISUAL タスク・デフォルト）。

判定根拠: ユーザー報告は「`/admin/dashboard/attendance` の UI/UX がめちゃくちゃ見にくい・パッと見て何をしたいか分からない」。目的達成には `apps/web` の出席ダッシュボード表現層（コンポーネント再構成 + CSS）のコード変更が必須。docs だけでは「見にくさ」は解消できないため実装仕様書とする（CONST_004）。

---

## 1. 真の論点（要件レビュー思考法の一次結論）

| 観点 | 結論 |
| --- | --- |
| **真の主問題** | 機能不足ではない。**8 セクション（KPI 5枚・トレンド・回数帯分布・セッション表・会員表・TOP10・欠席者アラート）がフラットに縦積みされ、視覚的階層・情報の優先順位・「このページで何を判断すべきか」のナラティブが欠如している＝情報過多**。Apple HIG で言う hierarchy（階層）と focal point（焦点）の不在。 |
| **依存関係・責務境界** | データは API から豊富に返っており不足なし。問題は **UI 表現層（apps/web）のみ**。API / D1 / shared 型は無罪。責務は `apps/web/src/features/admin/attendance/` 配下に閉じる。 |
| **価値とコストの不均衡** | 現状は「全情報を等価重みで全部見せる」ため、管理者の認知負荷が最大化。最重要判断（出席率の健全性・要フォロー対象）に到達するコストが高い。改善価値は「一目で状態とアクションが分かる」こと。 |
| **改善優先順位** | ①視覚的階層の3層化（PRIMARY/TREND/DETAIL）→ ②primary ヒーロー新設 → ③詳細テーブルの段階的開示（タブ統合）→ ④余白・タイポグラフィ・トーンの精緻化。 |
| **4条件** | 価値性◯（管理者の認知コスト低減が定義済み）/ 実現性◯（既存 primitive + token + endpoint で1サイクル完了可能）/ 整合性◯（責務は web 表現層に閉じ、invariant 違反なし）/ 運用性◯（verify-design-tokens / playwright visual smoke で回帰保護可能）。 |

---

## 2. 確定方針（ユーザー回答に基づく）

- **アプローチ**: 階層リファイン（既存 8 セクションを維持しつつ、視覚的階層・余白・優先順位・グルーピングを Apple HIG 準拠で 3 層に再設計）。全面再構成・最小限調整ではない。
- **主役 KPI**: ユーザーは「全体出席率と推移 / 要フォロー対象 / 直近セッション状況 / 参加の偏り（回数帯分布）」の 4 項目すべてを最重要として選択 → これを **優先順位付き 3 層** に落とす:

```
┌──────────────────────────────────────────────────────────┐
│  PRIMARY ゾーン（最上部・最大視覚ウェイト・一目で判断）        │
│   ├─ ① 全体出席率 [特大数値] + 前期比 delta + ユニーク出席率   │
│   └─ ② 要フォロー対象 [欠席者 N 名] + トーン強調 + 即アクション │
│      （補助: ③ 直近セッション "○月○日 N名 X%" のサマリチップ）  │
├──────────────────────────────────────────────────────────┤
│  TREND ゾーン（傾向・2カラム）                                │
│   ├─ トレンドチャート（月別 折れ線）                          │
│   └─ ④ 回数帯分布（横棒・参加の偏り）                         │
├──────────────────────────────────────────────────────────┤
│  DETAIL ゾーン（詳細・タブ統合で段階的開示）                   │
│   [セッション別] [会員別] [TOP10] ← Segmented/Tab で切替       │
│   （初期スクロール量を削減。要フォロー詳細リストは PRIMARY から展開）│
└──────────────────────────────────────────────────────────┘
```

- フィルタバー（期間 / 回数帯 / CSV エクスポート）は PRIMARY の直上に据え置き（操作起点として自然）。

---

## 3. 対象コードベース（現状実装の事実）

リポジトリルート: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260608-154717-wt-13/`

### 3.1 ページ本体 / route
- ページ: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`（行1-42）— `AdminPageHeader` + `AttendanceAnalyticsPage` をレンダリング。`force-dynamic`。`readFilterFromQuery()` で searchParams からフィルタ抽出。
- レイアウト: `apps/web/app/(admin)/layout.tsx`（行1-48）— `data-theme="cool"`、`SidebarShellServer`、main ラッパー `gap-4 p-4 md:p-6`。非管理者は `/login?gate=forbidden` リダイレクト。

### 3.2 主コンテナとコンポーネント（全て `apps/web/src/features/admin/attendance/components/`）
| コンポーネント | ファイル | 役割 | 改修方針 |
| --- | --- | --- | --- |
| `AttendanceAnalyticsPage` | `AttendanceAnalyticsPage.tsx`（行1-131） | 6 endpoint 並列 fetch + 8 セクション縦積みの統括 | **再構成の主役**: 3 層レイアウト（PRIMARY/TREND/DETAIL）に組み替え |
| `AttendanceFilterBar` | `AttendanceFilterBar.tsx`（行1-68） | 期間/回数帯フィルタ + CSV | 据え置き（位置のみ PRIMARY 直上へ） |
| `KpiPanel` | `KpiPanel.tsx`（行1-63） | 5 枚 KPI カード | PRIMARY ヒーロー新設に伴い再編（特大 primary + secondary に分離） |
| `AttendanceTrendChart` | `AttendanceTrendChart.tsx`（行1-57） | 月別 SVG 折れ線 | TREND ゾーンへ移設 + カード化統一 |
| `AttendanceZoneDistributionChart` | `AttendanceZoneDistributionChart.tsx`（行1-50） | 回数帯 横棒 | TREND ゾーンへ移設 |
| `SessionAttendanceTable` | `SessionAttendanceTable.tsx`（行1-66） | セッション別表 + ドリルダウン modal | DETAIL タブの1つへ |
| `MemberAttendanceTable` | `MemberAttendanceTable.tsx`（行1-39） | 会員別出席率表 | DETAIL タブの1つへ |
| `AttendanceTop10Ranking` | `AttendanceTop10Ranking.tsx`（行1-47） | TOP10 ランキング | DETAIL タブの1つへ |
| `AttendanceAbsenteeAlert` | `AttendanceAbsenteeAlert.tsx`（行1-39） | 要フォロー details リスト | PRIMARY からの展開（要フォロー対象の主役化） |
| `AttendanceDrilldownModal` | `AttendanceDrilldownModal.tsx`（行1-102） | 出席/欠席者 modal | 挙動不変で温存 |

### 3.3 データ取得（変更しない）
- `apps/web/src/lib/admin/fetch-attendance.ts`（行60-83）— `fetchAttendanceAnalyticsBundle(filters)` が 6 endpoint を並列 fetch:
  - `/admin/dashboard/attendance/overview`（KPI集計: totalSessions / totalMembers / overallRate / previousPeriodRate / uniqueAttendeeCount / uniqueAttendanceRate / filter echo）
  - `/admin/dashboard/attendance/by-session`（セッション別 attendeeCount / rate）
  - `/admin/dashboard/attendance/ranking`（メンバー別 attendedCount / rate）
  - `/admin/dashboard/attendance/trend`（月別 buckets: period / attendeeCount / sessionCount / uniqueMemberCount）
  - `/admin/dashboard/attendance/zone-distribution`（zone_0/1_9/10_99/100_plus/unknown ごと attendeeCount / rate）
  - `/admin/dashboard/attendance/absentees`（lastN 期間の欠席者: displayName / zone / lastAttendedAt / missedCount）
- `safeServerFetch()` 経由（D1 直接アクセス禁止・invariant #5）。各結果は `SafeResult<T>`（ok / error）でセクション単位 degrade。
- ヘルパ: `apps/web/src/features/admin/attendance/lib/format-attendance.ts`（`formatRate` / `formatDelta` / `ZONE_LABEL` / `PERIOD_PRESETS`）、`read-attendance-filter.ts`、`hooks/useAttendanceFilters.ts`。

### 3.4 スタイリング（改修対象）
- `apps/web/src/styles/globals.css` の `.attendance-*` 系（行708-1050 付近）— `.attendance-analytics-page` / `.attendance-kpi-*` / `.attendance-charts-grid` / `.attendance-*-table` / `.attendance-top10` / `.attendance-absentee-alert` 等。**3 層レイアウト用のクラス追加・既存クラスのリズム調整**を行う。
- design token 正本: `apps/web/src/styles/tokens.css`（`--ubm-color-*` OKLch / `--ubm-space-*` 4px grid / `--ubm-radius-*` / `--ubm-text-*` / `--ubm-shadow-*` / `--ubm-dur-*` / `--ubm-ease-*`）。

---

## 4. 再利用する既存 primitive（新規 primitive 禁止・invariant #3）

| primitive | パス | 用途（本タスク） |
| --- | --- | --- |
| `Card` 系 | `apps/web/src/components/ui/card.tsx` | 各ゾーンのサーフェス統一 |
| `Badge` / Chip | `apps/web/src/components/ui/badge.tsx`（tone: default/accent/ok/warn/danger/info） | 要フォロートーン強調・zone ラベル・delta |
| `Stat` | `apps/web/src/components/ui/stat.tsx`（label/value/delta/tone/helpText） | KPI 表示 |
| `AdminStat` | `apps/web/src/features/admin/components/_shared/AdminStat.tsx` | KPI 表示（admin 文脈） |
| `Segmented` | `apps/web/src/components/ui/segmented-control.tsx`（options/value/onChange） | DETAIL ゾーンのタブ切替 |
| `EmptyState` / `AdminEmptyState` | `.../ui/empty-state.tsx` / `_shared/AdminEmptyState.tsx` | データ0件時 |
| `AdminSectionCard` | `_shared/AdminSectionCard.tsx`（title/description/actions） | 各ゾーン見出し + サーフェス |
| `AdminSectionErrorClient` | `_shared/AdminSectionErrorClient.tsx` | SafeResult error 時の degrade |
| `AdminPageHeader` | `_layout/AdminPageHeader.tsx` | ページヘッダ（据え置き） |

既存の良いパターン参考: `app/(admin)/admin/page.tsx`（KpiGrid + 2カラム grid + StatusDistribution）、`_dashboard/KpiGrid.tsx`、`_dashboard/ZoneDistribution.tsx`。

---

## 5. デザイントークン要点（`tokens.css` / `09b-design-tokens.md` 正本）

- 色: `--ubm-color-{surface-bg,surface-panel,surface-panel-2,text-primary,text-secondary,text-muted,border-default,border-strong,accent,accent-soft,accent-ink,ok,ok-soft,warn,warn-soft,danger,danger-soft,info,info-soft,zone-a..e}`（全て OKLch、HEX/`bg-[#xxx]`/`text-[#xxx]` 直書き禁止）。
- spacing: 4px grid `--ubm-space-{0,1,2,3,4,6,8,12,16,24}`。
- radius: `--ubm-radius-{sm 8,md 12,lg 16,xl 20,2xl 28}`。
- typography: `--ubm-text-{xs 11,sm 12.5,base 13.5,md 14,lg 16,xl 20,2xl 24,3xl 32}` + `--ubm-eyebrow-tracking 0.12em`。
- shadow: `--ubm-shadow-{xs,sm,md,lg}`。motion: `--ubm-dur-{fast,base,slow}` / `--ubm-ease-{standard,emphasized,decelerate,accelerate}`。
- 要フォロートーン強調は issue-1112 の `data-attendance-level` パターン（既存 token のみ・新規 token 追加なし）を踏襲する。

---

## 6. 受入条件（AC）— 仕様の核

- **AC-1**: PRIMARY ヒーローゾーンが最上部（フィルタバー直下）に配置され、①全体出席率（最大タイポグラフィ `--ubm-text-3xl`）+ 前期比 delta（`formatDelta`）+ ユニーク出席率、②要フォロー対象数（欠席者 N 名）を主役 2 枚として構成される。
- **AC-2**: 視覚的階層が 3 層（PRIMARY / TREND / DETAIL）に明確化され、各層が「見出しレベル・余白（`--ubm-space-*`）・サーフェス（card/border/shadow）」で視覚的に区別される。h1 はページタイトル、各ゾーンは h2、ゾーン内サブは h3。
- **AC-3**: DETAIL ゾーンの 3 テーブル（セッション別 / 会員別 / TOP10）が `Segmented`（既存 primitive）によるタブ切替で 1 つの領域に統合され、初期表示のスクロール量が現状比で削減される。
- **AC-4**: 要フォロー対象（欠席者）が PRIMARY ゾーンで視覚的に強調され、件数に応じてトーン変化（0 名 = neutral/ok トーン、1 名以上 = warn トーン）。issue-1112 の `data-attendance-level` パターン踏襲、新規 token 追加なし。詳細リストは PRIMARY からの展開（既存 `AttendanceAbsenteeAlert` の details を再配置）。
- **AC-5**: 全色が OKLch トークン経由（`var(--ubm-color-*)`）。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がゼロ（CI gate `verify-design-tokens` pass）。
- **AC-6**: 新規 primitive 追加ゼロ。Card / Badge / Stat / Segmented / EmptyState / AdminSectionCard 等の既存 primitive のみで構成（invariant #3）。
- **AC-7**: API endpoint / D1 schema / Google Form schema / shared 型の変更がゼロ。`fetchAttendanceAnalyticsBundle` と 6 endpoint surface はそのまま利用（ui-prototype-alignment invariant #1）。`apps/api` 配下・`packages/shared` 配下の diff がゼロ。
- **AC-8**: レスポンシブ維持。モバイル（縦積み 1 カラム）→ デスクトップ（PRIMARY 2 カラム・TREND 2 カラム）が既存 grid utility（`grid-cols-1 lg:grid-cols-2` 等）で成立。
- **AC-9**: アクセシビリティ維持・向上。見出し階層が論理的（h1>h2>h3）、`aria-label` / `aria-labelledby` 付与、フォーカスリング（accent + color-mix）保持、コントラスト WCAG 2 AA（4.5:1）。Segmented タブは `role="tablist"` 相当の既存実装を踏襲。
- **AC-10**: 既存の全機能が挙動不変で温存される — フィルタ（期間プリセット / 回数帯チェック）、CSV エクスポート、ドリルダウン modal、各テーブル内容、フッター生成日時。SafeResult error 時のセクション単位 degrade も維持。

### スコープ外（今サイクルでは扱わない・CONST_007 例外ではない）
- 新 endpoint を要する集計（例: 会員ごとの直近 N 回セッション出席フラグの一覧表示、月別「出席率」=延べ÷(セッション×総員) のサーバ集計）。これらは API 変更が必要で invariant 違反となるため**スコープ外として明記するのみ**（未タスク化は Phase 12 で判断）。

---

## 7. 制約・不変条件

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用。 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証。 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-5 で保証。`verify-design-tokens` gate。 |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証。 |
| #9 | admin form input は FormField 経由 | 本タスクはフォーム input を増やさない（フィルタは既存のまま）。 |

---

## 8. テスト方針（Phase 4/6/7 で詳細化）

- 既存テスト: 各コンポーネントに `*.component.spec.tsx`（vitest + happy-dom / testing-library）が存在する想定。再構成後の構造に追従させる。
- vitest 実行は repo ルートが root のため `apps/web/src/...` フルパス指定 + `--root` に注意（メモリ既知の罠）。
- 追加テスト観点:
  - PRIMARY ヒーローが overview データから出席率 / delta / 要フォロー数を正しく描画する。
  - 要フォロー数 0 / 1+ でトーン（data-attendance-level 相当）が切り替わる。
  - Segmented タブ切替で 3 テーブルが排他表示される（internal state）。
  - SafeResult error 時に該当ゾーンのみ `AdminSectionErrorClient` に degrade し、他ゾーンは描画継続。
  - レスポンシブ: grid クラスの存在確認（DOM 構造アサーション）。
- 回帰保護: `verify-design-tokens`（HEX 0 件）、playwright visual smoke（staging 認証済み admin 画面）。
- Segmented タブのモード管理は **internal state（useState）**である点を Phase 4 に明記（[VSCPKR-03] 対策）。

## 9. ローカル検証コマンド（Phase 4/5/9/11 で使用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .   # 対象限定
mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack                 # OpenNext 互換
# design token gate（HEX 直書き検出）
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance && echo "FAIL" || echo "PASS"'
```

> 注: パッケージ名は `apps/web/package.json` の `name` を Phase 1 で実確認すること（`@ubm-hyogo/web` を仮置き。異なる場合は訂正）。

---

## 10. メタ情報（artifacts.json 用）

### Phase 1-3 設計時の実コード裏取り確定（後続 Phase は必ずこちらを正とする）

| 項目 | 確定事実 | 備考 |
| --- | --- | --- |
| primitive ファイル名 | **PascalCase**: `apps/web/src/components/ui/{Badge,Card,Stat,Segmented,EmptyState}.tsx` | §4 の kebab 表記（badge.tsx 等）は誤り。PascalCase が正 |
| `Badge` tone 値 | `"default" \| "accent" \| "success" \| "warning" \| "danger" \| "info"` | **`ok`/`warn` は存在しない**。要フォロー強調は `warning`、健全は `success` にマップ |
| `Segmented` role | `role="radiogroup"` + 各オプション `role="radio"`（tablist ではない） | a11y はこの既存実装を踏襲。DETAIL タブもこの role |
| issue-1112 `attendanceLevel` | `none/normal/high`（出席「多寡」用） | 要フォロー（欠席者数）は意味が逆。流用せず別純粋関数 `attendanceFollowLevel`（none/warn）+ `data-attendance-follow` 属性として命名分離（MINOR M-2） |
| 既存テスト 5 本の内訳 | component spec 3 本（`KpiPanel`/`AttendanceTrendChart`/`AttendanceZoneDistributionChart`）+ lib spec 2 本（`format-attendance`/`buildExportUrl`）。`__tests__/` 配下 | Session/Member/Top10/Absentee には spec 無し → Phase 4/6 で新規追加 |
| route 二重 className | `page.tsx` と `AttendanceAnalyticsPage` が共に `attendance-analytics-page` 系 class/testid を持つ | MINOR M-1。Phase 5 で重複解消の申し送り |
| 新規タブホスト | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`（feature 層・primitive ではない＝AC-6 充足） | state は `useState<DetailTabKey>`（"session"\|"member"\|"top10"）= internal state（[VSCPKR-03]） |
| ローカル実装状態 | `apps/web/src/features/admin/attendance/**` + `apps/web/src/styles/globals.css` に反映済み | focused Vitest 8 files / 23 tests、web typecheck、web lint、verify-design-tokens PASS。Phase 11 screenshot 8 PNG は pending |

---

- task_name: `admin-attendance-dashboard-ux-hierarchy-refine`
- task_path: `docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine`
- taskType: `implementation` / docs_only: `false` / VISUAL: true
- status: `implemented_local_checks_pass_visual_capture_pending`（apps/web 表現層の実装とローカル検証まで完了。Phase 11 screenshot / commit / PR / staging capture は user-gated）
- ui_routes: `/admin/dashboard/attendance`
- endpoints（参照のみ・変更なし）: overview / by-session / ranking / trend / zone-distribution / absentees
- d1_tables: なし（変更なし）
- secrets_introduced: なし
- invariants_touched: 5（ui-prototype #1/#2/#3 含む）
- 関連 issue: なし（staging 観察起点。relatedIssue=null）
