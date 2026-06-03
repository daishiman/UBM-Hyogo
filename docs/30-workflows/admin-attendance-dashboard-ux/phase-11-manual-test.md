# Phase 11: 手動テスト（視覚確認計画・VISUAL）

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- visualEvidence: `VISUAL`（出席ダッシュボードの見た目・レイアウトが変わる）
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest・local fixture screenshot は完了。本 Phase は staging 視覚確認の **計画**も保持）
- evidence_status: `local_visual_present_staging_pending`（local fixture pixel screenshot は取得済み。staging 認証済み baseline は **user-gated**）
- 本 Phase の責務: local fixture `/(admin)/admin/dashboard/attendance` の AC-1..AC-5 視覚確認証跡、staging 視覚確認観点、狭幅 fallback、jsdom 検証境界、代替 evidence、スクリーンショット配置先を確定する

> **二層 evidence の明示**: `outputs/phase-11/manual-test-result.md` は local focused vitest / apps-api 非変更の
> 証跡として存在する。`outputs/phase-11/screenshots/*.png` には local fixture Playwright の desktop / narrow viewport 証跡が存在する。
> staging 認証済み baseline は user-gated runtime 生成物であり、本サイクルでは作成しない。
> 本 Phase 11 は「local evidence / local screenshot は present、staging baseline は runtime_pending」の境界を記述する。

## 目的

jsdom（focused vitest）では検証できない「CSS の効き（レイアウト・バー形状・余白・カード化）」を、
local fixture pixel screenshot で確認し、staging 認証済み baseline で再確認する手順と PASS 観点を確定する。
本タスクは `apps/web` の CSS/ラベル/KPI 是正が主目的の VISUAL タスクであり、
レイアウト復旧（AC-1）・バー楕円解消（AC-2）・凡例（AC-3）・KPI 説明（AC-4）・見方ガイド/空状態（AC-5）の
視覚的成立は local fixture で確認済みとし、staging 認証ゲートに守られる実データ baseline の取得は user-gated とする。

## 実行タスク

### 1. 視覚確認対象と evidence 境界

| 対象 | staging route | jsdom で確認可 | staging 実機で確認すべき範囲 |
| --- | --- | --- | --- |
| KPI カードグリッド / フィルタバー / 2 カラムチャート | `/(admin)/admin/dashboard/attendance` | DOM class 付与のみ（ZC-6 / KP-* / grep） | グリッド整列・カード化・余白・横並びの **描画結果**（CSS の効き） |
| 区画分布バー / Top10 バーの形状 | 同上 | 幅属性の数値（ZC-1/ZC-2） | バーが楕円化せず細い横棒で描画されるか（`block-size` の効き） |
| 凡例キャプション / 出席回数帯ラベル | 同上 | 文言の DOM 存在（ZC-3/ZC-4） | レイアウト内での視認性・配置 |
| 見方ガイド / 空状態 | 同上 | class 付与（grep） | スタイル付き表示・破綻なし |

> jsdom は class 付与と DOM 文言・属性値までしか保証できず、`grid` / `block-size` / `flex` の **レンダリング結果**は確認不能。
> その差分は local fixture screenshot で埋める。staging 実機 screenshot は認証済み実データ baseline として user-gated に残す。

### 2. テストケース

> 視覚 TC（`TC-11-*`）は local fixture screenshot で代表 viewport を取得済み。staging pixel screenshot は user-gated のため `PENDING_STAGING_BASELINE`。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 想定証跡ファイル | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | AC-1 レイアウト復旧 | KPI が**カードグリッド**で整列、フィルタバー（期間ボタン・区画チェック・CSVエクスポート）が**横並び整列**、チャートが**2 カラムグリッド**で表示。素のブロック積み上げでない | `screenshots/TC-11-1-attendance-layout-desktop.png` | `PASS_LOCAL_SCREENSHOT` |
| TC-11-2 | AC-2 バー楕円解消 | 区画分布バー・Top10 バーが**細い横棒**（高さ ≈ 0.5rem）で描画。0% / 低率バーが**楕円ブロブにならない**。0% は幅 0 | `screenshots/TC-11-1-attendance-layout-desktop.png` | `PASS_LOCAL_SCREENSHOT` |
| TC-11-3 | AC-3 出席回数帯・凡例 | 行ラベルが回数表記（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）、フィルタ legend が「出席回数帯」、区画分布セクションに**凡例キャプション**（`ZONE_HELP`）が表示 | `screenshots/TC-11-1-attendance-layout-desktop.png` | `PASS_LOCAL_SCREENSHOT` |
| TC-11-4 | AC-4 KPI ラベル/説明 | 「期間内出席者数」の補足が**延べ出席数**表記（「unique」非表示）、4 KPI すべてに用途が分かる**短い hint** が付く | `screenshots/TC-11-1-attendance-layout-desktop.png` | `PASS_LOCAL_SCREENSHOT` |
| TC-11-5 | AC-5 見方ガイド・空状態 | ダッシュボード冒頭の**見方ガイド**・各セクションの**1 行説明**が表示。データ無しセクションが**スタイル付き空状態**（素テキストでない） | `screenshots/TC-11-1-attendance-layout-desktop.png` | `PASS_LOCAL_SCREENSHOT` |
| TC-11-6 | AC-1 狭幅 fallback | 狭幅 viewport（例: 幅 ≈ 480px）でチャートグリッド・KPI グリッドが**1 カラムに fallback**し、カードが潰れず縦積みで読める | `screenshots/TC-11-6-attendance-narrow-mobile.png` | `PASS_LOCAL_SCREENSHOT` |

### 3. 画面カバレッジマトリクス

| テストケース | 画面 / 状態 | viewport | 撮影セレクタ / 対象 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | 出席ダッシュボード 全景 | desktop（≈1280px） | `[data-testid="attendance-zone-distribution"]` を含むページ全体 | AC-1 |
| TC-11-2 | 区画分布 / Top10 バー | desktop | バー要素（`.attendance-zone-bar` / `.attendance-top10-bar`） | AC-2 |
| TC-11-3 | 区画分布セクション + フィルタ legend | desktop | 区画分布カード + フィルタバー | AC-3 |
| TC-11-4 | KPI パネル | desktop | KPI カード群（`attendance-kpi-*`） | AC-4 |
| TC-11-5 | 冒頭ガイド + 空状態 | desktop | ページ冒頭 + 空状態セクション（`attendance-zone-empty` 等） | AC-5 |
| TC-11-6 | 狭幅 1 カラム fallback | narrow（≈480px） | ページ全体 | AC-1 |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: 本タスクは admin ダッシュボードでダークテーマ対象外 → N/A。
> - インタラクション状態（modal / hover）: 本タスクは静的レイアウト是正で対話状態追加なし → N/A。

### 4. jsdom で確認できない CSS の「効き」と staging 実機の境界

| 視覚要素 | jsdom で確認できない理由 | 代替 evidence（jsdom / gate 側） | staging で確認する内容 |
| --- | --- | --- | --- |
| KPI カードグリッド整列 | `display:grid` / `gap` のレイアウト結果は jsdom が算出しない | DOM class 付与（ZC-6）+ `grep "attendance-kpi-grid" globals.css` | 実際の整列・カード化・余白 |
| バーの横棒形状 | `block-size: 0.5rem` の描画高さは jsdom 非算出（fill 幅の数値のみ算出可） | `AttendanceZoneDistributionChart.spec.tsx`（ZC-1 幅 `"0"` / ZC-2 幅 `"1"`） | 楕円化せず細い横棒で描画されること |
| 凡例 / ラベル配置 | レイアウト内の視認性は描画依存 | `format-attendance.spec.ts`（ZL-1..5）+ ZC-3/ZC-4 文言 DOM 存在 | 配置・視認性 |
| 見方ガイド / 空状態スタイル | スタイル適用結果は描画依存 | class 付与の grep（`attendance-page-guide` / `attendance-section-intro`） | スタイル付き表示・破綻なし |
| 狭幅 1 カラム fallback | media / `minmax` の折り返しは jsdom 非算出 | CSS 定義（`minmax(13rem,1fr)` 等）の grep | 実際に 1 カラムへ折り返すこと |

代替 evidence のコマンド（Phase 9 で確定済を再掲）:

```bash
# focused vitest（DOM class / 文言 / 幅属性）
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__

# grep gate（CSS 定義 / token / API 非変更）
grep -n "attendance-kpi-grid\|attendance-filter-bar\|attendance-charts-grid" apps/web/src/styles/globals.css
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
```

### 5. スクリーンショット取得・配置計画（local present / staging user-gated）

本改善サイクルで local fixture Playwright の代表 screenshot を取得済み。ユーザー承認後、staging 認証セッションで同観点の baseline を追加取得する。

| 配置先 | 内容 | 状態（本仕様作成時点） |
| --- | --- | --- |
| `outputs/phase-11/screenshots/TC-11-1-attendance-layout-desktop.png` | desktop 全景 local fixture screenshot | `present` |
| `outputs/phase-11/screenshots/TC-11-6-attendance-narrow-mobile.png` | narrow viewport local fixture screenshot | `present` |
| `outputs/phase-11/screenshot-inventory.json` | screenshot inventory | `present` |
| `outputs/phase-11/manual-test-result.md` | TC-11-* の PASS/FAIL 結果記録・仕様照合サマリー | `present` |
| staging 認証済み baseline screenshots | 実データ・実認証環境の pixel screenshot | `runtime_pending`（user-gated） |

> local fixture screenshot は overlay 非表示処理後に取得し、desktop / narrow の視覚破綻がないことを確認した。
> staging deploy + 認証セッションを前提とする baseline 取得は、後続のユーザー承認後に実施する。

### 6. Gate-B 状態

`artifacts.json` の Gate-B（evidence_path: `outputs/phase-11/manual-test-result.md`）は
local implementation review として **passed** である。
`manual-test-result.md` は present で、focused vitest PASS / local fixture screenshot PASS / apps-api 非変更 / staging baseline pending を記録する。
staging pixel screenshot は user-gated runtime artifact として未生成のまま維持する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-1-requirements.md` | AC-1..AC-9 / 背景スクリーンショット現象 |
| テスト計画 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-4-test-plan.md` | jsdom 代替 evidence（ZC/ZL/KP）・grep gate |
| QA | `docs/30-workflows/admin-attendance-dashboard-ux/phase-9-qa.md` | 検証コマンド・gate・AC マッピング |
| 最終レビュー | `docs/30-workflows/admin-attendance-dashboard-ux/phase-10-final-review.md` | AC 3-state トレース・green 化対象 |
| artifacts | `docs/30-workflows/admin-attendance-dashboard-ux/artifacts.json` | Gate-B（evidence_path / passed local review） |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` | 必須セクション・selector ルール |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 状態 |
| --- | --- | --- |
| 本 Phase 11 仕様書 | 文書 | 作成済（視覚確認計画・TC-11-1..6・カバレッジマトリクス・jsdom 境界） |
| `outputs/phase-11/screenshots/*.png` | local visual evidence | `present`（desktop / narrow local fixture screenshot） |
| `outputs/phase-11/screenshot-inventory.json` | local visual inventory | `present` |
| `outputs/phase-11/manual-test-result.md` | local evidence + runtime boundary | `present`（focused vitest PASS / local screenshot PASS / staging baseline pending） |

## 統合テスト連携

- jsdom 代替 evidence（focused vitest ZC/ZL/KP）の PASS が Phase 9 / Phase 10 の AC-2/3/4 判定根拠となる。
- local fixture screenshot（TC-11-1 / TC-11-6）が AC-1/2/3/5 の代表視覚確認を担い、Gate-B の根拠となる。
- staging pixel screenshot（TC-11-1..6）は認証済み実データ baseline として `runtime_pending`。
- 狭幅 fallback（TC-11-6）は local fixture screenshot で、AC-1 の堅牢性（Phase 3 リスク「極狭幅でカードが潰れる」緩和）を確認する。

## 完了条件

1. AC-1/2/3/4/5 の視覚確認観点（TC-11-1..6）と「何を見れば PASS か」が確定していること。
2. 狭幅 1 カラム fallback（TC-11-6）の確認観点が含まれること。
3. jsdom で確認できない CSS の「効き」と staging 実機の境界が明記され、代替 evidence（focused vitest / grep gate）が記載されていること。
4. `outputs/phase-11/manual-test-result.md` が present で local focused vitest PASS / local fixture screenshot PASS を記録し、`outputs/phase-11/screenshots/*.png` が存在すること。
5. Gate-B が local review として passed、staging 認証済み baseline screenshot が user-gated pending である旨が記載されていること。
