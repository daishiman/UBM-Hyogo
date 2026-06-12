# Phase 12 main — responsive-mobile-tablet-ui-fixes

## サマリ

本 Phase 12 パッケージは「全画面レスポンシブ（携帯・タブレット）UI/UX 是正」タスク（`responsive-mobile-tablet-ui-fixes`）の
**実装済みローカル視覚証跡取得（implemented_local_visual_present_staging_pending）**の close-out 成果物群である。`apps/web` の実コード、focused Vitest、token/type/lint、local runtime smoke、local physical PNG capture は本サイクルで完了した。authenticated admin staging screenshot / commit / push / PR は user-gated である。

- workflow_state: `implemented_local_visual_present_staging_pending`
- taskType: `implementation` / visualEvidence: `VISUAL`
- implementation_mode: `new`（既存 sidebar drawer 化を土台に新規是正を同一サイクルで実装）
- スコープ: `apps/web` 表現層（全 19 ルートの CSS / Tailwind breakpoint / レイアウト primitive）のみ。API / D1 / Google Form は非変更（不変条件 #1 #5）。
- 変更済みファイル: tokens/globals/legacy-public/auth の 4 CSS + SidebarDrawer + focused spec + visual-full guard + viewport fixture。
- 未タスク検出: current 0 件（1 サイクル完結・CONST_007）。
- PR base: `dev`。commit / push / PR / authenticated staging 視覚 baseline は user-gated。

本タスクは「全 19 ルートで携帯(375/390)・タブレット(768) のレイアウト崩れ・要素はみ出し・画面外への隠れ・横スクロール強制」を
`apps/web` 表現層のみで是正する実装仕様書である。崩れの根本は共通 CSS 層（`globals.css` / `legacy-public.css` / `tokens.css` / `auth.css`）の
非標準メディアクエリ境界・固定幅・テーブル/オーバーレイ未対応に集中するため、route 個別改修は限定的で 1 サイクルに収まる（先送りなし）。

## strict 7 索引

| # | ファイル | 役割 | 状態 |
| - | --- | --- | --- |
| 1 | [`main.md`](main.md) | Phase 12 サマリ・strict 7 索引 | present |
| 2 | [`implementation-guide.md`](implementation-guide.md) | Part 1（中学生レベル例え話）+ Part 2（breakpoint 体系・変更ファイル Before→After・clamp/minmax・検証コマンド） | present |
| 3 | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1（ドキュメント反映）完了記録 / Step 2 = N/A（CSS / breakpoint のみ・新規 interface/型/API/定数なし） | present |
| 4 | [`documentation-changelog.md`](documentation-changelog.md) | 変更ファイル・workflow-local 同期 / global skill sync・drift 観察・validator 結果 | present |
| 5 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | 検出 0 件（1 サイクル完結）・current / baseline 分離 | present |
| 6 | [`skill-feedback-report.md`](skill-feedback-report.md) | テンプレート/ワークフロー改善観察・promotion / no-op routing（改善点なしでも出力） | present |
| 7 | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠 / 4 条件 verdict | present |

## Phase 12 タスク完了状況

| Task | 名称 | 状況 | 成果物 |
| --- | --- | --- | --- |
| Task 1 | 実装ガイド作成（Part 1/Part 2） | completed (spec content) | [`implementation-guide.md`](implementation-guide.md) |
| Task 2 | システム仕様更新サマリ（Step 1-A〜1-C + Step 2 N/A） | completed (spec content) | [`system-spec-update-summary.md`](system-spec-update-summary.md) |
| Task 3 | ドキュメント更新履歴 | completed (spec content) | [`documentation-changelog.md`](documentation-changelog.md) |
| Task 4 | 未タスク検出レポート（検出 0 件） | completed (spec content) | [`unassigned-task-detection.md`](unassigned-task-detection.md) |
| Task 5 | スキルフィードバックレポート | completed (spec content) | [`skill-feedback-report.md`](skill-feedback-report.md) |
| Task 6 | Phase 12 仕様準拠チェック | completed (spec content) | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) |

## same-wave sync（implemented_local_visual_present_staging_pending）

| Step | 本タスクでの扱い |
| --- | --- |
| Step 1-A | 仕様書記録は workflow 自身（index.md / phase-12-documentation.md）に集約。`implemented_local_visual_present_staging_pending` の active workflow として aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 |
| Step 1-B | 実装状況テーブルに `implemented_local_visual_present_staging_pending` を記録（local implementation + local PNG done / authenticated admin staging visual・PR は user-gated） |
| Step 1-C | 関連タスクテーブル: 未タスク検出 0 件（1 サイクル完結）。baseline MINOR 候補も 0 件として current facts に記録 |
| Step 2 | N/A（新規インターフェース / API / 型 / 定数の追加なし。CSS / breakpoint のみ。詳細は system-spec-update-summary.md） |

## スコープ境界

本サイクルで閉じた範囲（AC-1..AC-10、すべて `apps/web` 表現層）:

- `tokens.css` に breakpoint 変数（`--bp-md/lg/xl`）+ 規約コメントを追加（AC-1）。
- `globals.css` のメディアクエリ境界統一（`max-width: 767/768/900/1024px` → 767.98 / 1023.98 等の標準境界へ）・grid 流体化・テーブル可視性・オーバーレイ収納（AC-1/2/4/6/7/8）。
- `legacy-public.css` の main 幅 clamp・stat-card / hero grid 流体化（AC-2/6）。
- `auth.css` の auth-card 狭幅 padding（AC-3/5）。
- `SidebarDrawer.tsx` の drawer 幅、`globals.css` の tooltip/popover viewport-safe 化（AC-8）。
- 共通画面 / auth は既存構造を維持し、`auth.css` と runtime smoke で狭幅 padding / 中央表示を確認（AC-3/AC-5）。
- test 2 ファイル（既存 Playwright visual full に horizontal overflow guard 追加 + `SidebarDrawer.spec.tsx` 構造 spec）（AC-2..AC-10/AC-8）。

スコープ外（不変条件で禁止・先送りではない）:

- API endpoint 追加・D1 schema 変更・Google Form 仕様変更（不変条件 #1 #5）。
- 配色・タイポグラフィの再設計（design token 正本据置・不変条件 #2）。
- 新規デザイン primitive の追加（不変条件 #3）。

## user-gated 境界

authenticated admin staging screenshot / staging 視覚 baseline / commit / push / PR は、ユーザー明示承認後に実行する。
Local 実装証跡、local runtime smoke、local physical PNG baseline は本サイクルで生成済みである。
