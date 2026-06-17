# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 1（要件定義 / 用語リネーム正本表） |
| 下流 | Phase 3（設計レビュー） |
| 状態 | spec_created |

## 目的

Phase 1 の用語リネーム正本表（R/S/J/U）を、**ファイル別の具体的な変更マップ（どのファイルのどの文字列/属性を何に置き換えるか）** に落とし込む。文字列置換中心のため新規モジュール設計はないが、(1) 文言変更が DOM contract（testid/role/aria キー）を壊さないこと、(2) `formatDelta` の単位変更（`pt`→`ポイント`）のような**ロジックを含む箇所**の入出力契約、(3) 軽微 CSS 調整（U-03）の対象クラスとトークン、(4) テスト追従（T-01〜T-06）の対応関係、を設計として固定する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/_shared-context.md | 用語リネーム正本表（R/S/J/U）・AC・テスト追従 T-01〜T-06 |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-01/{main,rename-map}.md | Phase 1 で確定した inventory・命名規則・リネーム影響先 |
| 必須 | apps/web/src/features/admin/attendance/ | 対象コンポーネントの現状実装（読み取りのみ） |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本（U-03 軽微 CSS の token 名実在確認） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 文言・ラベルの分かりやすさ指針 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |

## 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 判断 | 内容 |
| --- | --- |
| 新規 component | **作らない**。既存 12 ファイルの文言と軽微 CSS のみ変更する |
| 新規 primitive | **作らない**（AC-6） |
| 新規 hook / util | **作らない**。`formatDelta` は既存関数のシグネチャを変えず戻り文字列の単位表記のみ変更（後述） |

## 実行タスク

1. **ファイル別変更マップ（change-map.md）の作成**: 12 実装ファイルそれぞれについて「対象箇所 → Before → After → 影響（表示/aria/test）→ リネーム ID（R/S/J/U）」を 1 行ずつ表で固定する。
2. **DOM contract 保持の設計**: 各変更が testid・`data-*`・`href`・`role` を変えないことを明記する。`aria-label` は**文言**を変える行（J-04 `出席KPI補助指標`→`出席のおもな指標`、J-09 `出席回数帯別分布`→`出席回数べつの人数`、J-01 `出席トレンド`→`出席の移り変わり`）のみ意図的変更とし、属性キー（`aria-label`）と役割は維持する。
3. **ロジック含有箇所の契約設計**:
   - `formatDelta(current, previous)`: 戻り値の単位 `pt` → `ポイント` のみ変更。`—`（previous 無効）・符号（↑/↓/→）・小数 1 桁・`Math.abs(diff*100).toFixed(1)` の計算は不変。入力型・戻り型（`string`）不変。
   - `PERIOD_PRESETS`: `label` のみ変更（`id` / `monthsBack` は不変 → `presetToPeriod` / URL クエリ・フィルタ挙動は完全不変）。
   - `ZONE_HELP`: 定数文字列の置換のみ。参照箇所（`AttendanceZoneDistributionChart` の凡例 + Playwright 前方一致）への波及を change-map に記す。
4. **軽微 CSS 調整（U-03）の設計**: 文言が長くなる箇所（`表計算ファイルで書き出す` = `.attendance-export-link`、`一度でも参加した人の割合` = `.attendance-kpi-support`）で折返し/はみ出しが起きないか確認し、必要時のみ `white-space` / `gap` / `flex-wrap` を `var(--ubm-*)` 準拠で調整する方針を記す。色変更はしない。
5. **テスト追従マップ**: T-01〜T-06 を「対象テスト → 旧アサート → 新アサート → 対応リネーム ID」で固定する。
6. **state ownership 確認**: `AttendanceDetailTabs` のタブ選択は `useState<DetailTabKey>`（internal state）であり、文言変更（ラベル `セッション別`→`開催回ごと` 等）は `value`（`"session"|"member"|"top10"`）に影響しない（label と value の分離）ことを明記する（[VSCPKR-03]）。

## 設計詳細

### ファイル別変更マップ（要約・正本は change-map.md）

| ファイル | 変更ID | 種別 |
| --- | --- | --- |
| `page.tsx` | R-01 | 文字列（eyebrow prop 値） |
| `AttendanceAnalyticsPage.tsx` | R-02〜R-06, S-10, J-02, J-05 | 文字列（h2/h3/intro/sectionLabel prop） |
| `KpiPanel.tsx` | S-01〜S-03, J-03, J-04, J-06, J-12 | 文字列（label/hint/support/aria-label） |
| `AttendanceAbsenteeAlert.tsx` | S-04, S-05, U-01 | 文字列 + 軽微行リズム |
| `AttendanceDetailTabs.tsx` | R-07, R-08, S-06, S-07 | 文字列（options label / sectionLabel） |
| `AttendanceFilterBar.tsx` | R-09, J-10 | 文字列（リンク文言 / legend） |
| `AttendanceTrendChart.tsx` | S-09, J-01 | 文字列（title / aria-label / empty） |
| `AttendanceZoneDistributionChart.tsx` | J-08, J-09 | 文字列（empty / aria-label） |
| `SessionAttendanceTable.tsx` | S-08 | 文字列（empty） |
| `lib/format-attendance.ts` | R-10, J-07, J-11 | 文字列（PERIOD_PRESETS.label / formatDelta 単位 / ZONE_HELP） |
| `globals.css` | U-03 | 軽微 CSS（必要時のみ） |
| `__tests__/*`, `playwright/*` | T-01〜T-06 | テスト追従 |

### 3 ゾーンの見出し対応（構造維持の確認）

| ゾーン | 旧 h2（英語） | 新 h2（日本語） | 直下の補助文（既存 intro・維持/微修正） |
| --- | --- | --- | --- |
| PRIMARY | PRIMARY | 全体の状況 | 「全体の健全性と、今日フォローすべき対象を最初に判断します。」（維持） |
| TREND | TREND | 出席の移り変わり | J-02 で平易化 |
| DETAIL | DETAIL | くわしい一覧 | 「詳細テーブルは必要な観点だけを切り替えて確認します。」（維持・「テーブル」は許容範囲。必要なら「一覧」へ） |

> ゾーンの順序・カード配置・grid 構造は変更しない（Q3 = 微調整）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | change-map → 回帰テスト設計 / T-01〜T-06 追従設計 |
| Phase 5 | change-map を実装手順の唯一の正とする |
| Phase 7 | AC ↔ change-map 行のトレース |
| Phase 11 | 見出し対応表を screenshot 意図に反映 |

## 多角的チェック観点（AIが判断）

| 観点 | 確認内容 |
| --- | --- |
| 責務境界 | 全変更が `apps/web` 表現層に閉じる。`apps/api` / `packages/shared` を change-map に含めない |
| 状態所有権 | `AttendanceDetailTabs` の label/value 分離（label 変更が state に波及しない） |
| 契約保持 | `formatDelta` / `PERIOD_PRESETS` / `ZONE_HELP` の入出力契約（単位/ラベル文字列のみ変更） |
| a11y | aria-label の文言変更は意図的（J-01/J-04/J-09）。属性キー・role・focus は不変 |
| token 整合 | U-03 は `var(--ubm-*)` のみ・HEX 0・新規 token 0 |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | ファイル別変更マップ作成（change-map.md） | spec_created |
| 2 | DOM contract 保持設計 | spec_created |
| 3 | ロジック含有箇所の契約設計（formatDelta/PRESETS/ZONE_HELP） | spec_created |
| 4 | 軽微 CSS 調整（U-03）設計 | spec_created |
| 5 | テスト追従マップ（T-01〜T-06） | spec_created |
| 6 | state ownership 確認（[VSCPKR-03]） | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計の実体（再利用判断 / DOM contract / 契約 / CSS / state） |
| ドキュメント | outputs/phase-02/change-map.md | ファイル別変更マップ（Before/After/影響/リネーム ID）正本 |
| メタ | artifacts.json | Phase 2 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-02/change-map.md` に 12 ファイルの行別 Before/After/影響/リネーム ID が固定されている
- [ ] DOM contract（testid/`data-*`/`href`/`role`）不変・aria-label 文言変更は意図的、が明記されている
- [ ] `formatDelta` / `PERIOD_PRESETS` / `ZONE_HELP` の入出力契約（単位/ラベルのみ変更）が記録されている
- [ ] U-03 軽微 CSS の対象クラスとトークンが `var(--ubm-*)` 準拠で記録され HEX が無い
- [ ] T-01〜T-06 のテスト追従マップが完成している
- [ ] `AttendanceDetailTabs` の label/value 分離が明記されている（[VSCPKR-03]）

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-02/{main,change-map}.md` が配置されている
- [ ] 新規 component/primitive ゼロ方針が再確認されている（AC-6）
- [ ] artifacts.json の Phase 2 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 3（設計レビュー）
- 引き継ぎ事項: change-map.md（ファイル別変更マップ）/ 契約設計 / テスト追従マップ
- ブロック条件: change-map が未完成、または契約を含む箇所（formatDelta 等）の入出力が未固定の場合は Phase 3 に進めない
