# Phase 3: 設計レビュー

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- 前提: Phase 1（要件）/ Phase 2（設計）
- 本 Phase の責務: 設計の不変条件適合・リスク・代替案を審査し、実装フェーズ着手可否を判定

## 不変条件適合レビュー（CLAUDE.md）

| 不変条件 | 適合判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint 追加/ D1 / Form 変更禁止 | ✅ 適合 | 変更は `apps/web` の CSS/TSX/test のみ。fetch URL・zod・endpoint 不変。AC-7 で git diff 空を gate |
| #2 OKLch トークン正本・HEX 直書き禁止 | ✅ 適合 | CSS は全色 `var(--ubm-color-*)` 経由。新色トークン追加なし。`verify-design-tokens` を AC-6 で gate |
| #3 プロトタイプ primitives 正本・新規 primitive 禁止 | ✅ 適合 | 既存 `.attendance-status-pill` と同じ component-class 方式。新トークン/新 primitive を生やさない |
| #5 D1 直接アクセス禁止（apps/web→D1） | ✅ 適合 | データ取得は既存 fetch 経由のまま。本タスクで新規アクセス追加なし |
| #8 test は `*.spec.*` のみ | ✅ 適合 | 新規 test は `*.spec.tsx` / `*.spec.ts` |
| #9 admin form input は FormField 経由 | ✅ 影響なし | 本タスクは form input を追加しない（フィルタは既存。新規 `<input>` 追加なし） |

## 設計判断レビュー

| 論点 | 採否 | 理由 |
| --- | --- | --- |
| `.attendance-*` を data-attribute（`[data-*]`）へ全面移行するか | **否（class 維持）** | 既存 TSX が class 名を参照済。data-attr 移行は全コンポーネント書換 + 既存 test 破壊で diff 肥大。`.attendance-*` はセマンティック component class で Tailwind utility と衝突せず（`.attendance-status-pill` 先例あり）、class セレクタ定義で十分 |
| SVG バーを `<div>` バーへ置換するか | **否（SVG 維持＋CSS 高さ固定）** | DOM 構造変更は test/snapshot 破壊。楕円潰れの根本は「SVG に CSS 寸法が無いこと」なので `block-size: 0.5rem` 固定で解消。最小差分で意図達成 |
| 区画境界（`zoneFromCount`）を UI 側で 0/1〜9/10〜 に整合させるか | **否（API 別タスクへ分離）** | 計算意味論変更は回帰リスク。ユーザー Q1 指示「別タスク分離」に従い `unassigned-task-specs/` へ。UI は現行境界に忠実なラベルに留める |
| KPI「期間内出席者数」を真の unique 値に直すか | **否（ラベルを実値=延べに整合）** | unique 化は API 集計変更（別タスク）。本タスクは「ラベルと実値の食い違い」を実値側に寄せて解消（apps/web 完結） |
| 凡例文を i18n / 定数化するか | **採（`ZONE_HELP` 定数）** | `format-attendance.ts` に集約し UI から参照。将来の文言変更点を一元化 |

## リスクと緩和

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| `ZONE_LABEL` 変更で既存 test（`format-attendance.spec.ts`）が fail | 中 | Phase 6 で新値へ test 更新を必須化（AC-3 trace） |
| fieldset `legend` の `float` レイアウトがブラウザ差で崩れる | 低 | `legend` を `width:100%` ブロック化し period/zone を下段に折り返す堅牢設計。Phase 11 で実機確認 |
| `auto-fit minmax` で極狭幅でカードが潰れる | 低 | `minmax(13rem,1fr)` / `minmax(20rem,1fr)` で 1 カラム fallback。狭幅 viewport を Phase 11 で確認 |
| `globals.css` への大量追加で他画面に波及 | 低 | セレクタは全て `.attendance-*` 名前空間に限定。グローバル要素セレクタ（`button` 等）は使わず `.attendance-period-filter button` のように親限定 |
| 色直書き混入で `verify-design-tokens` fail | 中 | Phase 2 の grep gate を Phase 6/9 で必須実行。CSS は token 参照のみ |

## トレーサビリティ（AC → 変更点）

| AC | 主担当の変更 | 検証手段 |
| --- | --- | --- |
| AC-1 レイアウト復旧 | globals.css `.attendance-kpi-grid` 他 | Phase 11 視覚 + DOM class 存在 test |
| AC-2 バー楕円解消 | globals.css `block-size` + ZoneChart `Math.max(0,…)` | `AttendanceZoneDistributionChart.spec.tsx` 新規 |
| AC-3 区画→出席回数帯+凡例 | `ZONE_LABEL` / `ZONE_HELP` / FilterBar legend / ZoneChart 凡例 | `format-attendance.spec.ts` 更新 + ZoneChart spec |
| AC-4 KPI ラベル是正 | `KpiPanel.tsx` hint/説明 | `KpiPanel.spec.tsx` 更新（既存 spec） |
| AC-5 見方ガイド/空状態 | `AttendanceAnalyticsPage.tsx` + globals.css empty | Phase 11 視覚 |
| AC-6 token 厳守 | globals.css 全色 var() | `verify:design-tokens` + grep gate |
| AC-7 API 非変更 | （変更しないこと） | `git diff --name-only apps/api` 空 |
| AC-8 green | 全変更 | typecheck/lint/focused vitest |
| AC-9 計算是正の分離 | `unassigned-task-specs/` 仕様 | Phase 12 unassigned-task-detection |

## レビュー判定

**PASS（実装フェーズ着手可）**。

- 全変更が `apps/web` に閉じ、不変条件 #1/#2/#5 に適合。
- 楕円潰れ・レイアウト崩れの根本原因（CSS 未配線・SVG 寸法欠落）に対し最小差分で本質的対処。
- 計算意味論の是正はユーザー指示どおり別タスクへ分離し、本タスクは 1 サイクル完結スコープ（CONST_007 適合）。
- MINOR 指摘: なし（Phase 10 追跡テーブルは「MINOR 0 件」を記録）。

## 完了条件

不変条件適合・リスク緩和・AC トレースが揃い、レビュー判定が PASS であること。
