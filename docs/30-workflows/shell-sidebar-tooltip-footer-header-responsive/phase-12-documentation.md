---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
phase_name: ドキュメント同期
作成日: 2026-06-03
task_id: shell-sidebar-tooltip-footer-header-responsive
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
parent_workflow: null
task_type: implementation
visual_category: VISUAL
implementation_mode: new
---

# Phase 12: ドキュメント同期

中学生レベル概念説明セクションを含む canonical 9 headings に従う。本 workflow は **独立 root（親 workflow 無し）** であり、Phase 12 strict 7 成果物はすべて本 root の `outputs/phase-12/` に物理配置する（aggregated-at-parent ではない）。

> **本サイクルの性質**: 状態は `implemented_local_evidence_captured`。2026-06-03 の automation-30 改善サイクルで実コード・focused shell tests・Phase 12 strict 7・aiworkflow 正本同期まで完了した。staging visual screenshot、commit、push、PR は user-gated として残す。

## 12.1 ゴール

中学生レベルで説明する。

サイドバー（左に並ぶメニュー）を細く畳むと、文字が消えてアイコンだけになる。畳んだ引き出しに小さな絵だけ描いてあるようなもので、「これは何の引き出し？」と分からなくなる。そこで、アイコンにマウスを乗せた（またはキーボードで選んだ）ときだけ、その引き出しの**ラベル（名札）**を横にぴょこっと出す。これがレーン A の「ツールチップ」。

公開サイトの一番下にある**ページの足跡（フッター：プライバシーポリシー・利用規約・著作権）**は、長いページを下までスクロールしないと見えなかった。これを画面の下端に貼りつけて、どこを見ていても**いつも見える足跡**にするのがレーン B。

スマートフォンで見ているとき、上のタイトル帯（ヘッダー）が一緒に上へ流れて消えてしまう。これを画面の上に貼りつけて、スクロールしても**いつも上にいるタイトル帯**にするのがレーン C。

なぜ必要か → 「今どこにいて、何ができるのか」を画面のどこを見ていても見失わないため。何をするか → A はアイコンに名札を添え、B はフッターを下に貼り、C はヘッダーを上に貼る。新しい仕掛け（JS の状態）はほとんど増やさず、ほぼ CSS の貼りつけ（`position: sticky`）と、すでにある `collapsed`（畳んでいるか）の合図だけで実現する。

## 12.2 アーキテクチャ整合

- **レーン A**: 新規 `SidebarTooltip`（`apps/web/src/components/shell/SidebarTooltip.tsx`・Client）が collapsed 時の icon-only コントロール（nav item / 公開に戻る / collapse toggle）を包み、`role="tooltip"` + `aria-describedby` の **description** としてラベルを付与する。表示は CSS `:hover` / `:focus-within` 駆動で、新規 JS state を持たない（I-4）。`collapsed === false` のときはラップせず children を直返しする（AC-A2）。
- **`<details>/<summary>` 例外**: user menu（`SidebarUserMenu.tsx`）は `<details>` 直下子が `<summary>` でなければならない制約により `SidebarTooltip` の `<span>` wrap が不適。`<summary>` を `relative` にして内部へ `role="tooltip"` バブルを直接配置する（同 `.ubm-shell-tooltip` CSS class 流用・Phase 3 D-3 で resolved）。
- **レーン B**: 公開フッター `[data-component="public-footer"]`（`legacy-public.css`）を `position: sticky; bottom: 0` + 不透明背景（`--ubm-color-surface-bg`）化。純 CSS で state を増やさない。
- **レーン C**: mobile-bar（`SidebarShell.tsx`）に inline Tailwind `sticky top-0 z-30` を付与。`md:hidden`（表示制御）は不変、固定のみ追加（I-6）。
- **z-index 階層（全レーン整合）**: drawer 40 > tooltip 30 = mobile-bar 30 > footer 20 = popover 20。同値ペア（tooltip/mobile-bar・footer/popover）は同時表示しないため衝突しない（Phase 2 §2.3.2）。

## 12.3 不変条件への反映

- **I-1**: API endpoint / D1 / Google Form schema / auth middleware は不変。本タスクは純 `apps/web` UI、`apps/api` 差分は 0。
- **I-2**: 色・寸法は `tokens.css` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 対象）。ツールチップ・フッター背景も token 経由。
- **I-3**: 新規 primitive は shell 固有の `SidebarTooltip` 1 個のみ。`apps/web/src/components/ui/` の汎用 primitive は増やさない。
- **I-4**: state owner は既存 `useSidebarState` 1 系のみ。ツールチップは CSS（`:hover` / `:focus-within`）駆動で新規 JS state を持たない。
- **I-5**: collapsed 判定は既存 `collapsed` prop 由来。新規の collapsed source を作らない。
- **I-6**: breakpoint 判定は CSS（Tailwind `md:`）正本。mobile-bar の `md:hidden`（表示制御）は不変、`sticky top-0 z-30`（固定）のみ追加。
- **I-7**: 新規 test は `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8）。
- **I-8**: 既存 a11y（aria-label / sr-only ラベル / aria-current / drawer の `role="dialog"`）を壊さず、ツールチップ追加で二重読み上げにしない。

## 12.4 タスク完了記録（Task 12-1〜12-6）

| # | タスク | 実施内容 | 結果 |
|---|--------|----------|------|
| 12-1 | Phase 1-13 仕様書と実コードの整合確認 | `index.md` / `phase-1..13` / `artifacts.json` の scope_files（新規 3 / 編集 11 = 14）・canonical screenshot 名・gates の整合を確認 | PASS（drift 0） |
| 12-2 | strict 7 成果物作成 | 本 root `outputs/phase-12/` に 7 件（`main.md` / compliance-check / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report） | 作成済（§12.7） |
| 12-3 | implementation-guide 作成 | 中学生レベル Part 1 + 技術者 Part 2（型定義 / a11y / CSS / z-index 階層 / 変更ファイル表 / I-1..I-8） + 視覚証跡 | 作成済 |
| 12-4 | システム仕様更新要否判定 | API / IPC / DB 変更不要。aiworkflow-requirements の workflow discoverability / artifact inventory / changelog / LOGS は同期 | PASS（§12.6 / system-spec-update-summary.md） |
| 12-5 | 未タスク検出 | current 0 件 / baseline 候補は §1.6 スコープ外 3 件 + Phase 10 MINOR（責務独立の構造境界） | 0 件（unassigned-task-detection.md） |
| 12-6 | skill フィードバック | テンプレート / ワークフロー / ドキュメントの 3 観点を記録（改善点なしでも出力） | 記録済（skill-feedback-report.md） |

### close-out 手順記録（Step 1-A / 1-B / 1-C / Step 2）

| Step | 内容 | 判定 | 根拠 |
|------|------|------|------|
| Step 1-A | タスク完了の workflow-local 記録 | 記録（implemented_local_evidence_captured 段階の完了記録） | documentation-changelog.md Step 1-A |
| Step 1-B | 関連 reference / index の同期 | 実施（aiworkflow quick-reference / resource-map / task-workflow-active / artifact inventory） | documentation-changelog.md Step 1-B |
| Step 1-C | global skill sync（lessons / patterns 反映） | 実施（artifact inventory に lessons routing / no-op 根拠を記録） | documentation-changelog.md Step 1-C |
| Step 2 | システム仕様（API/IPC/DB）更新要否 | **条件付き該当**: API/IPC/DB は変更不要だが、新規インターフェース `SidebarTooltip`（`SidebarTooltipProps`）の公開 surface が追加されるため、その存在を記録する | system-spec-update-summary.md Step 2 |

> Step 1-A〜1-C を N/A で省略せず、各 Step の判定理由を明記する（close-out ルール）。Step 2 は API/IPC/DB の正本仕様（aiworkflow-requirements）には触れないが、`SidebarTooltip` という新規コンポーネント公開 surface が生まれるため「条件付き該当」として記録する。

## 12.5 公式ドキュメント更新（本 root 内）

- 本 root `outputs/phase-12/implementation-guide.md` に 3 レーンの実装ガイドを記載（中学生レベル Part 1 + 技術者 Part 2）。
- `SidebarTooltip.tsx` で `SidebarTooltipProps`（`label` / `collapsed` / `children`）と「collapsed=false パススルー」「`role="tooltip"` + `aria-describedby` description 連携」「CSS `:hover`/`:focus-within` 駆動・JS state なし」契約を型と実装で反映済み。
- 親 workflow が無い独立 root のため、親 root への集約は発生しない。strict 7 はすべて本 root に物理配置する。

## 12.6 システム仕様更新要否（Step 2）

- aiworkflow-requirements の正本仕様（API endpoint / IPC / D1 schema）変更は **該当なし**（UI コンポーネント追加のみ）。
- ただし `SidebarTooltip`（公開 props: `SidebarTooltipProps`）が新規 shell コンポーネント surface として追加される事実は記録する（system-spec-update-summary.md §Step 2）。

## 12.7 strict 7 成果物の一覧と物理配置

本 root は独立 root（`parent_workflow: null`）のため、strict 7 をすべて `outputs/phase-12/` に present として物理配置する（aggregated-at-parent ではない）。

| # | File | 配置 | 備考 |
|---|------|------|------|
| 1 | `phase12-task-spec-compliance-check.md` | 本 root `outputs/phase-12/` | canonical 9 セクション・Gate-A evidence |
| 2 | `main.md` | 本 root `outputs/phase-12/` | Phase 12 strict 7 main（物理配置必須） |
| 3 | `implementation-guide.md` | 本 root `outputs/phase-12/` | Part 1（中学生）+ Part 2（技術者）+ 視覚証跡 |
| 4 | `system-spec-update-summary.md` | 本 root `outputs/phase-12/` | Step 1 / Step 2 判定 |
| 5 | `documentation-changelog.md` | 本 root `outputs/phase-12/` | Step 1-A/B/C + Step 2 個別記録 |
| 6 | `unassigned-task-detection.md` | 本 root `outputs/phase-12/` | 0 件でも出力（current / baseline 分離） |
| 7 | `skill-feedback-report.md` | 本 root `outputs/phase-12/` | 3 観点（改善点なしでも出力） |

## 12.8 evidence

- spec compliance check: `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-12/phase12-task-spec-compliance-check.md`（Gate-A evidence）。
- 視覚証跡（VISUAL）: canonical screenshot 3 件（`sidebar-collapsed-tooltip.png` / `public-footer-sticky-bottom.png` / `mobile-header-sticky.png`）は local browser で取得済み。staging visual は user gate。local semantic evidence は focused shell Vitest 5 files / 33 tests PASS。

## 12.9 完了条件

- 本 `phase-12-documentation.md`（canonical 9 headings）作成済。
- strict 7 outputs を本 root `outputs/phase-12/` に作成済（aggregated-at-parent ではない）。
- `outputs/artifacts.json` と root `artifacts.json` の parity 維持。
- canonical screenshot 名（`sidebar-collapsed-tooltip.png` / `public-footer-sticky-bottom.png` / `mobile-header-sticky.png`）を全成果物で一致。
- Step 1-A/B/C / Step 2 を各成果物で個別記録（「該当なし」も明記）。
