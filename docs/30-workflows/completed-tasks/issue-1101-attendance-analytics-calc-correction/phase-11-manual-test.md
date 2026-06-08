# Phase 11: 手動テスト（証跡計画・VISUAL）

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- taskType: `implementation` / visualEvidence: `VISUAL`（KPI タイル 1 枚追加 + zone label 文言変更）/ implementation_mode: `new`
- workflow_state: `implemented_local_evidence_captured`（実コード・focused tests・正本仕様同期まで完了。commit/PR/staging screenshot は user-gated）
- evidence_status: `local_test_primary_staging_visual_pending`（focused vitest=jsdom component test を主証跡とし、staging 実画面 pixel screenshot は user-gated runtime 証跡）
- 本 Phase の責務: 本タスクの証跡区分を確定し、UI 変更（unique KPI タイル追加 + zone label 文言変更）の検証観点と「jsdom で確認できる範囲 / staging 実機に委ねる範囲」の境界、代替証跡（focused vitest）の方針、実画面確認手順（user-gated）を確定する

> **二層 evidence の明示**: 本タスクの UI 変更は (a) `KpiPanel` への unique KPI タイル 1 枚追加、(b) `ZONE_LABEL` の文言変更（`zone_100_plus`=「100 回以上」/ `unknown`=「分類不能」）の 2 点に限られ、レイアウト・CSS の構造変更はない。
> したがって **主証跡は focused vitest（jsdom component test）**: `KpiPanel.spec.tsx`（unique タイルの DOM 存在・文言・testId）と `format-attendance.spec.ts`（新 5 キーの label / SELECTABLE_ZONES / ZONE_HELP）。
> staging 認証済み実画面の pixel screenshot は user-gated runtime 生成物であり、本サイクルでは作成しない。

## 証跡区分の判定

| 判定軸 | 内容 | 帰結 |
| --- | --- | --- |
| visualEvidence | KPI タイル 1 枚追加 + label 文言変更（DOM 文言と data-testid で検証可能） | `VISUAL`（ただし CSS レイアウト変更なし） |
| 主証跡 | jsdom component test（`KpiPanel.spec.tsx` / `format-attendance.spec.ts`）+ repository / internals test | **focused vitest** |
| 副証跡（user-gated） | staging `/(admin)/admin/dashboard/attendance` の実画面 pixel screenshot | `runtime_pending`（CONST_002） |

> 本タスクは見た目の構造（grid / flex / バー形状）を変えないため、jsdom が DOM 文言・属性・testId で **PASS 判定に必要な情報を全て保持**する。
> 実画面 screenshot は「unique タイルが既存 4 タイルと同列で破綻なく並ぶか」「zone-distribution に `zone_100_plus` 帯ラベルが新文言で出るか」の最終視認確認のみを担う（user-gated）。

## 目的

計算意味論是正（zone 境界バグ修正・enum 機械可読化・unique 指標追加）の結果が、
focused vitest（jsdom）で「DOM 文言・testId・rate 計算結果」のレベルまで PASS することを確認し、
jsdom で確認できない「実画面での視認性」を staging 実機で再確認する手順（user-gated）を確定する。

## 実行タスク

### 1. 3 層評価（Semantic / Visual / AI UX）の観点

| 層 | 観点 | 本タスクで確認すべき項目 | 確認手段 |
| --- | --- | --- | --- |
| Semantic（意味的正しさ） | 計算意味論が正しいか | (a) `zoneFromCount(100)` 以上が `zone_100_plus`（旧 `unknown` 誤分類の解消・AC-1）<br>(b) 旧矢印値（`"0→1"` 等）が `normalizeZone` で新キーへ吸収（AC-2）<br>(c) `overallRate`（延べ率）/ `uniqueAttendeeCount` / `uniqueAttendanceRate` の分母分子が定義通り（AC-3）<br>(d) `AttendanceZoneZ` と `zoneFromCount` 返り値集合が一致（AC-4） | internals / repository focused vitest |
| Visual（表示の正しさ） | UI ラベル・KPI が新仕様を反映するか | (a) zone ラベルが新境界表示（`0 回（未出席）` / `1〜9 回` / `10〜99 回` / `100 回以上`）<br>(b) 100 回以上が「分類不能」でなく「100 回以上」と表示<br>(c) `unknown` のみ「分類不能」<br>(d) unique KPI タイル（`data-testid="attendance-kpi-unique"`）が表示され、`uniqueAttendanceRate` / `uniqueAttendeeCount` を表示（AC-5 / AC-6） | `KpiPanel.spec.tsx` / `format-attendance.spec.ts`（jsdom）+ staging 実画面（user-gated） |
| AI UX（管理者の読み取り） | 管理者が誤読しないか | (a) 100+ 出席者を「不明」と誤認しない（zone ラベルが正しい）<br>(b) 延べ率（overallRate）と unique 出席率を別 KPI として区別できる<br>(c) unique タイルの hint で「期間内 1 回以上出席した会員割合（N 名）」が読める | staging 実画面（user-gated）+ KPI hint 文言の DOM 検証 |

### 2. テストケース

> 本タスクの UI 変更は jsdom で DOM レベルまで検証可能なため、主証跡 `TC-11-*` は focused vitest で取得する。
> staging pixel screenshot は user-gated のため `PENDING_STAGING_VISUAL`。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 証跡ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | AC-1 境界修正 | `zoneFromCount(100)` / `zoneFromCount(1000)` が `"zone_100_plus"`。`zoneFromCount(-1)` / `zoneFromCount(NaN)` のみ `"unknown"` | `attendance-analytics-internals.spec.ts` | `PASS_FOCUSED_VITEST`（実装後） |
| TC-11-2 | AC-2 互換マッピング | `normalizeZone("0→1")==="zone_0"` / `"1→10"→"zone_1_9"` / `"10→100"→"zone_10_99"`、未知値は `"unknown"` | `attendance-analytics-internals.spec.ts` | `PASS_FOCUSED_VITEST`（実装後） |
| TC-11-3 | AC-3 rate 定義 | overview の `overallRate`（延べ率）/ `uniqueAttendeeCount` / `uniqueAttendanceRate`（0..1 clamp）が定義通りの値 | `attendance-analytics.repository.spec.ts` | `PASS_FOCUSED_VITEST`（実装後） |
| TC-11-4 | AC-4/AC-5 enum 一致・ラベル | `ZONE_LABEL` が新 5 キー網羅（`zone_100_plus`=「100 回以上」/ `unknown`=「分類不能」）、`SELECTABLE_ZONES` は `unknown` を除く 4 種 | `format-attendance.spec.ts` | `PASS_FOCUSED_VITEST`（実装後） |
| TC-11-5 | AC-6 unique KPI タイル | `KpiPanel` レンダリング結果に `data-testid="attendance-kpi-unique"` が存在し、`formatRate(uniqueAttendanceRate)` と `uniqueAttendeeCount`（N 名）を表示。既存 4 タイルは維持で計 5 タイル | `KpiPanel.spec.tsx` | `PASS_FOCUSED_VITEST`（実装後） |
| TC-11-6 | Visual / AI UX 最終視認 | staging 実画面で unique タイルが既存 4 タイルと破綻なく整列し、zone-distribution に `zone_100_plus` 帯が新文言で表示 | staging pixel screenshot | `PENDING_STAGING_VISUAL`（user-gated） |

### 3. 画面カバレッジマトリクス

| テストケース | 画面 / 状態 | 検証層 | 撮影 / 検証対象 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1/2 | （UI なし・repository internals） | Semantic | `zoneFromCount` / `normalizeZone` 戻り値 | AC-1 / AC-2 |
| TC-11-3 | （UI なし・repository overview） | Semantic | `computeAttendanceOverviewExt` 戻り値 | AC-3 |
| TC-11-4 | KPI / zone label 文言 | Visual（jsdom） | `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` | AC-4 / AC-5 |
| TC-11-5 | KPI パネル | Visual（jsdom） | KPI カード群（`attendance-kpi-*` + 新 `attendance-kpi-unique`） | AC-6 |
| TC-11-6 | 出席ダッシュボード全景 | Visual / AI UX | `/(admin)/admin/dashboard/attendance` ページ全体 | AC-1 / AC-5 / AC-6（実機視認） |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: admin ダッシュボードはダークテーマ対象外 → N/A。
> - レイアウト構造変更: 本タスクは label 文言 + KPI タイル 1 枚追加のみで grid / flex 構造を変えない → 構造視覚 TC は N/A（親タスク `admin-attendance-dashboard-ux` で確認済み）。
> - 狭幅 fallback: KPI グリッドの折り返しは親タスクで確認済みの既存挙動を踏襲 → 本タスクでの再撮影は N/A。

### 4. jsdom で確認できる範囲と staging 実機の境界

| 検証要素 | jsdom で確認できる | staging 実機でのみ確認する内容 |
| --- | --- | --- |
| zone label 文言（`zone_100_plus`=「100 回以上」/ `unknown`=「分類不能」） | ◯ DOM 文言として `format-attendance.spec.ts` / `KpiPanel.spec.tsx` で検証可 | ラベルがバー帯内で視認できる配置か |
| unique KPI タイルの存在・文言・testId | ◯ `KpiPanel.spec.tsx` で `data-testid="attendance-kpi-unique"` + hint 文言を検証可 | 既存 4 タイルと同列で破綻なく並ぶか（グリッド整列の描画結果） |
| rate 計算結果（overallRate / uniqueAttendanceRate） | ◯ repository spec で数値検証可 | （実機固有の確認不要・データ依存のみ staging で確認） |
| zone-distribution の `zone_100_plus` 帯表示 | ◯ 帯キーの DOM 存在は親タスクの chart test で検証可 | 実データで 100+ 帯が「分類不能」でなく独立帯として描画されるか |

> 本タスクは CSS の「効き」（grid / block-size の描画）を変更しないため、jsdom 非算出領域は **新規追加した unique タイルの実画面整列**と **実データ下での `zone_100_plus` 帯の独立表示**のみ。これらは staging 実機（user-gated）で最終確認する。

代替証跡のコマンド（Phase 9 の DoD を再掲）:

```bash
# 主証跡: focused vitest（internals / repository / web format / web KpiPanel）
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx

# grep gate（旧矢印 enum 残存ゼロ・別ドメイン非変更）
rg -n '"0→1"|"1→10"|"10→100"' apps/api/src apps/web/src/features/admin/attendance packages/shared

# API 非変更確認（AC-8）
git diff --name-only -- apps/api/migrations apps/api/src/routes  # 空であること
```

### 5. 実画面確認手順（user-gated）

> 以下は **ユーザー承認後の staging 認証セッションで実施**する。本サイクルでは実行しない（CONST_002）。

1. staging へ `apps/api` / `apps/web` を deploy（user-gated）。
2. 管理者として認証し `/(admin)/admin/dashboard/attendance` を開く。
3. **KPI パネル**を確認: 既存 4 タイル（rate / attendees / avg / sessions）に加え、`attendance-kpi-unique`（「unique 出席率」値 + 「期間内 1 回以上出席した会員割合（N 名）」hint）が同列で破綻なく表示されること。
4. **区画分布（zone-distribution）**を確認: real D1 データで 100 回以上の会員が存在する場合に `zone_100_plus` 帯が独立帯として「100 回以上」ラベルで表示され、「分類不能」に落ちていないこと。
5. real D1 で overview の `uniqueAttendeeCount` / `uniqueAttendanceRate` が延べ率（`overallRate`）と区別された値で読めること。
6. pixel screenshot を `outputs/phase-11/screenshots/` に配置し、`screenshot-inventory.json` を更新（user-gated）。

### 6. 証跡メタ（manual-test-result.md の方針 [Feedback 4]）

`outputs/phase-11/manual-test-result.md`（実装サイクルで生成）には以下の証跡メタを明記する:

| 項目 | 内容 |
| --- | --- |
| 主証跡ソース | focused vitest（4 spec ファイル）。理由: 本タスクの UI 変更は label 文言 + KPI タイル追加に限られ、jsdom が PASS 判定に必要な DOM 文言・testId・rate 計算結果を全て保持するため |
| focused vitest 件数 | `attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` / `format-attendance.spec.ts` / `KpiPanel.spec.tsx` の合計件数（実装後に実測値を記録） |
| 副証跡（staging visual） | user-gated runtime。本サイクルでは `PENDING_STAGING_VISUAL` |
| API 非変更 | `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空（AC-8） |

### 7. Gate-B 状態

`artifacts.json` の Gate-B（evidence_path: `outputs/phase-11/manual-test-result.md`）は、
実装完了後に focused vitest PASS を記録した時点で `passed`（local implementation review）となる。
本仕様作成時点では Phase 13 が user-gated のため、`manual-test-result.md` は実装サイクルで生成し、
staging pixel screenshot は user-gated runtime artifact として未生成のまま維持する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-1-requirements.md` | AC-1..AC-8 / 変更対象 inventory |
| 設計（正本） | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-2-design.md` | enum 再設計・rate 定義・SQL・4 面一致マップ |
| タスク索引 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/index.md` | Phase 構成・検証コマンド（DoD） |
| 親タスク Phase 11 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-11-manual-test.md` | VISUAL 証跡計画の前例（フォーマット） |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` | 必須セクション・selector ルール |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 状態 |
| --- | --- | --- |
| 本 Phase 11 仕様書 | 文書 | 作成済（証跡区分判定・3 層評価・TC-11-1..6・jsdom 境界・実画面手順） |
| `outputs/phase-11/manual-test-result.md` | local evidence + runtime boundary | 実装サイクルで生成（focused vitest PASS / staging visual pending） |
| `outputs/phase-11/screenshots/*.png` | staging visual evidence | `runtime_pending`（user-gated） |
| `outputs/phase-11/screenshot-inventory.json` | visual inventory | `runtime_pending`（user-gated・screenshot 取得後に生成） |

## 統合テスト連携

- focused vitest（internals / repository / format / KpiPanel）の PASS が Phase 9 / Phase 10 の AC-1..AC-6 判定根拠となり、本タスクの主証跡を構成する。
- staging pixel screenshot（TC-11-6）は認証済み実データ baseline として `runtime_pending`（user-gated）。
- grep gate（旧矢印残存ゼロ / 別ドメイン非変更）と `git diff apps/api`（AC-8）は Phase 9 で確定し、本 Phase の証跡メタにも再掲する。

## 完了条件

1. 証跡区分が「主証跡=focused vitest（jsdom component test）/ 副証跡=staging pixel screenshot（user-gated）」と判定・記録されていること。
2. 3 層評価（Semantic / Visual / AI UX）で本タスクの確認項目（zone ラベル新境界・100 回以上が「分類不能」でなく「100 回以上」・unique KPI タイル表示）が確定していること。
3. TC-11-1..6 と「何を見れば PASS か」が確定し、jsdom で確認できる範囲と staging 実機の境界が明記されていること。
4. `outputs/phase-11/manual-test-result.md` の証跡メタ（主ソース=focused vitest 件数と理由）の方針が記載されていること。
5. 実画面確認手順（staging `/(admin)/admin/dashboard/attendance` の unique タイル・`zone_100_plus` 帯確認）が user-gated として明記されていること。
