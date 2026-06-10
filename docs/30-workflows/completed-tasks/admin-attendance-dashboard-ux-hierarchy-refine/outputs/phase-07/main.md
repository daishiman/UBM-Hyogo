# Phase 7 カバレッジ確認 — main

> 上流: Phase 5（実装）/ Phase 6（統合テスト）。本タスクで変更した attendance feature 配下のコードに限定してカバレッジを測定し、変更ブロックの line/branch 実測値を証跡に残す。

## 1. カバレッジ方針（範囲限定 — [Feedback BEFORE-QUIT-002]）

- **対象範囲**: `apps/web/src/features/admin/attendance/` 配下の **本タスクで新規追加・変更したファイルのみ**。
- **非対象**: リポジトリ全体・他 feature・`apps/api`・`packages/shared`（AC-7 により diff ゼロ）。**全体一律のカバレッジ閾値は適用しない**。
- 理由: 本タスクは表現層の再構成であり、変更範囲が attendance feature に閉じる。全体一律指定は無関係なファイルのカバレッジ低下でノイズを生むため、`--coverage.include` で変更範囲に絞る。

### 1.1 変更ファイル一覧（カバレッジ対象 — Phase 5 実装の成果物想定）

| 区分 | ファイル | カバレッジ要求 |
| --- | --- | --- |
| 新規（純粋関数） | `lib/format-attendance.ts` に `attendanceFollowLevel` 追加 | branch 100%（0/1+ 両分岐） |
| 新規（コンポーネント） | `components/AttendanceDetailTabs.tsx` | タブ 3 状態 line/branch |
| 変更（hero 化） | `components/KpiPanel.tsx`（PRIMARY hero 再編） | 既存 spec 追従・挙動不変アサーション維持 |
| 変更（統括） | `components/AttendanceAnalyticsPage.tsx`（3 層組み替え） | 3 ゾーン描画・degrade 分岐 |
| 変更（主役化） | `components/AttendanceAbsenteeAlert.tsx`（PRIMARY 展開） | トーン分岐（0/1+ 名） |
| 変更（移設・カード化） | `components/{AttendanceTrendChart,AttendanceZoneDistributionChart}.tsx` | 既存 spec 追従 |
| 変更（タブ埋め込み） | `components/{SessionAttendanceTable,MemberAttendanceTable,AttendanceTop10Ranking}.tsx` | タブ内排他表示 |

> 変更しないファイル（`AttendanceDrilldownModal.tsx` / `AttendanceFilterBar.tsx` / `lib/fetch-attendance.ts` / `hooks/useAttendanceFilters.ts`）はカバレッジ対象外（挙動不変・AC-10）。

## 2. カバレッジ計測コマンド（対象限定）

```bash
# リポジトリルートが vitest root のため、フルパス + --root . で指定（_shared-context §8 既知の罠）
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root . \
  --coverage \
  --coverage.include='apps/web/src/features/admin/attendance/**' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

- `--coverage.include` で attendance feature 配下に限定する。これにより全体一律閾値を適用しない（[Feedback BEFORE-QUIT-002]）。
- `text` reporter で対象ファイルの % St / % Branch / % Func / % Line を確認し、下記 §3 の記録欄に転記する。

## 3. 変更ブロックの line/branch 実測記録欄（[Feedback 5]）

> 実装後（Phase 5/6 完了後）に実測し、本欄を埋める。spec 段階では記録欄の枠と期待値を定義する。

### 3.1 `attendanceFollowLevel`（branch 100% 必達 — AC-4）

| 分岐 | 入力 | 期待戻り値 | 対応 TC | line | branch |
| --- | --- | --- | --- | --- | --- |
| 分岐 A（要フォロー 0） | `absenteeCount = 0` | `"none"` | TC-U-FOLLOW-01 | — | — |
| 分岐 B（要フォロー 1+） | `absenteeCount >= 1`（境界 1 含む） | `"warn"` | TC-U-FOLLOW-02 | — | — |
| **合算** | — | — | — | **100% 必達** | **100%（2/2）必達** |

- 境界値 `0` と `1` の両方が TC に存在すること（off-by-one 防止）。
- branch が 100% 未満なら Phase 4 に戻って TC を追加する。

### 3.2 `AttendanceDetailTabs`（タブ 3 状態 — AC-3）

| 状態 | 操作 | 期待表示 | 対応 TC | line | branch |
| --- | --- | --- | --- | --- | --- |
| 初期（session） | 初回レンダー | `SessionAttendanceTable` のみ表示 | TC-C-TABS-01 | — | — |
| member 切替 | `member` ラジオ選択 | `MemberAttendanceTable` のみ表示（排他） | TC-C-TABS-02 | — | — |
| top10 切替 | `top10` ラジオ選択 | `AttendanceTop10Ranking` のみ表示（排他） | TC-C-TABS-03 | — | — |
| **合算** | — | — | — | **目標 ≥90%** | **目標 ≥90%** |

- `useState<DetailTabKey>` の初期値・各 case の switch/三項分岐が line/branch に現れること。

### 3.3 PRIMARY hero（AC-1） / degrade（AC-10）の実測欄

| 対象 | 観点 | 対応 TC | line | branch |
| --- | --- | --- | --- | --- |
| `KpiPanel`（hero） | 出席率特大値 + delta + unique 描画 | TC-C-HERO-01 | — | — |
| `AttendanceAbsenteeAlert`（PRIMARY） | 0 名 neutral / 1+ 名 warn のトーン属性 | TC-C-FOLLOW-01/02 | — | — |
| `AttendanceAnalyticsPage` | ゾーン単位 `SafeResult` error degrade（他ゾーン描画継続） | TC-I-DEGRADE-01 | — | — |

## 4. 既存 spec 追従状況（M-3 — AC-10）

| 既存 spec | 追従要否 | 確認内容 |
| --- | --- | --- |
| `__tests__/KpiPanel.spec.tsx` | 要追従 | hero 化で DOM 構造変化。testid 維持・挙動不変アサーション保持 |
| `__tests__/AttendanceTrendChart.spec.tsx` | 要追従 | Card 化に伴うラッパー変化。SVG 描画アサーション保持 |
| `__tests__/AttendanceZoneDistributionChart.spec.tsx` | 要追従 | TREND 移設に伴うラッパー変化 |
| `__tests__/format-attendance.spec.ts` | 追加 | `attendanceFollowLevel` の TC を本 spec に追記 |
| `__tests__/buildExportUrl.spec.ts` | 不変 | CSV エクスポート挙動不変（AC-10） |

## 5. 未カバー AC ゼロ宣言

- AC-1〜AC-10 の TC / gate マッピングは `ac-matrix.md` に集約する。
- 本 Phase 完了条件: `ac-matrix.md` の全 AC が TC または gate にマップされ、**未カバー AC が 0 件**であること。1 件でも空セルがあれば Phase 4/5 に差し戻す。
