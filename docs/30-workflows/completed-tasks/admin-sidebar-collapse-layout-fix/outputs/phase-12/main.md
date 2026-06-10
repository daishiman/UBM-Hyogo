# Phase 12 main — admin-sidebar-collapse-layout-fix

## サマリ

本 Phase 12 パッケージは「サイドバー collapsed/expanded レイアウト是正」タスク（`admin-sidebar-collapse-layout-fix`）の
**implemented_local_evidence_captured** close-out 成果物群である。Phase 1-13 の実装仕様書・apps/web 実コード差分・focused vitest・local screenshot は取得済み。staging 視覚証跡は Phase 13 user-gated とする。

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation` / visualEvidence: `VISUAL`
- implementation_mode: `edit`（既存 shell コンポーネントの Tailwind className を編集。新規 test ファイルなし）
- スコープ: `apps/web` の sidebar shell コンポーネント群のみ（公開 / 会員 / 管理の 3 層で共有される shell）。API / D1 / Google Form は非変更（不変条件 #1 #5）。
- 変更対象 5 コンポーネント + テスト 3。実装・local evidence は取得済み。
- 未タスク分離: **0 件**（1 サイクル完結）。OOS-1（collapsed tooltip overflow clip）は baseline として `unassigned-task-detection.md` に記録（起票しない）。
- PR base: `dev`。commit / push / PR / staging 視覚 baseline は user-gated。

本タスクは「collapsed 時に各行が `px-3` を剥がさず内側 16px に icon/avatar/mark が溢れる + 中心軸不一致」を `apps/web` の
sidebar shell コンポーネントの Tailwind className 分岐のみで是正する実装仕様書である。Explore の「avatar 40px 不整合説」は
legacy CSS（`.ui-sidebar-*`）が現行 shell で未配線のため棄却済み（`_shared-context.md` §3.5）。

## strict 7 索引

| # | ファイル | 役割 | 状態 |
| - | --- | --- | --- |
| 1 | [`main.md`](main.md) | Phase 12 サマリ・strict 7 索引 | present |
| 2 | [`implementation-guide.md`](implementation-guide.md) | Part 1（中学生レベル例え話・専門用語セルフチェック表）+ Part 2（変更 4 コンポーネント Before→After・className 設計・検証コマンド・既知制限・視覚証跡） | present |
| 3 | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1-A/1-B/1-C 完了記録 / Step 2 = N/A（新規 interface / 型 / 定数なし） | present |
| 4 | [`documentation-changelog.md`](documentation-changelog.md) | 全 Step 結果（「該当なし」も記録）・workflow-local 同期と global skill sync の別ブロック・validator 結果 | present |
| 5 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | current 0 件 / baseline（OOS-1 tooltip overflow clip）分離記録 | present |
| 6 | [`skill-feedback-report.md`](skill-feedback-report.md) | テンプレート/ワークフロー/ドキュメント観点の観察・routing | present |
| 7 | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠 / 4 条件 verdict | present |

## Phase 12 タスク完了状況

| Task | 名称 | 状況 | 成果物 |
| --- | --- | --- | --- |
| Task 1 | 実装ガイド作成（Part 1/Part 2） | completed (spec content) | [`implementation-guide.md`](implementation-guide.md) |
| Task 2 | システム仕様更新サマリ（Step 1-A〜1-C + Step 2） | completed (spec content) | [`system-spec-update-summary.md`](system-spec-update-summary.md) |
| Task 3 | ドキュメント更新履歴 | completed (spec content) | [`documentation-changelog.md`](documentation-changelog.md) |
| Task 4 | 未タスク検出レポート（current 0 件 / baseline 分離） | completed (spec content) | [`unassigned-task-detection.md`](unassigned-task-detection.md) |
| Task 5 | スキルフィードバックレポート | completed (spec content) | [`skill-feedback-report.md`](skill-feedback-report.md) |
| Task 6 | Phase 12 仕様準拠チェック | completed (spec content) | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) |

## same-wave sync（implemented_local_evidence_captured）

| Step | 本タスクでの扱い |
| --- | --- |
| Step 1-A | 完了タスク記録は workflow 自身（`index.md` / `phase-12-documentation.md` / `_shared-context.md`）に集約。implemented_local_evidence_captured の active workflow として aiworkflow-requirements の workflow ledger（inventory / quick-reference / resource-map / task-workflow-active / changelog）へ同 wave 同期 |
| Step 1-B | 実装状況テーブルに `implemented_local_evidence_captured` を記録（実装・focused vitest・local screenshot 取得済み、staging visual / PR は user-gated） |
| Step 1-C | 関連タスクテーブル: current 未タスク 0 件。OOS-1 を baseline として current facts に記録（起票しない） |
| Step 2 | N/A（新規インターフェース / API / 型 / 定数の追加なし。Tailwind className 分岐のみ。詳細は system-spec-update-summary.md） |

## スコープ境界

本サイクル（実装仕様）で閉じる範囲（AC-1..AC-9、すべて `apps/web` sidebar shell）:

- `SidebarNavItem.tsx`: collapsed 時に `px-0 w-full justify-center`、icon span を 40px 角枠中央化（AC-1/2/3/4）。
- `SidebarUserMenu.tsx`: collapsed 時に summary を `px-0 w-full justify-center`、avatar を 40px 角枠中央化（AC-1/2/3/6）。
- `SidebarBrand.tsx`: collapsed 分岐を新設（`px-0 justify-center`）、mark 32px を 40px 角枠中央化（AC-1/2/3）。
- `SidebarShell.tsx`（AdminPublicReturn）: collapsed 時に `px-0 w-full justify-center`（NavItem と統一）（AC-1/2/3）。
- `SidebarNavGroup.tsx`: `ul` default margin/padding/list-style を除去。
- `SidebarNav.tsx`: overflow 整合確認のみで無変更。
- focused tests 3 ファイル（NavItem / UserMenu / SidebarShell 更新）。

スコープ外（baseline・起票しない・CONST_007 例外: 回帰リスクの分離）:

- OOS-1: collapsed hover tooltip（`ubm-shell-tooltip`）が `[data-shell="sidebar"]{overflow:hidden}` でクリップされうる問題。
  overflow 戦略変更が `height:100dvh` sticky と相互作用する回帰リスクのため独立検証を要する
  → `unassigned-task-detection.md` の baseline に記録。Phase 11 TC-11-3 で clip 有無を実機確認する。

## user-gated 境界

authenticated staging screenshot / staging 視覚 baseline / commit / push / PR は
ユーザー明示承認後に実行する。本 Phase 12 は implemented_local_evidence_captured の close-out であり、実コード差分・focused vitest・local screenshot は取得済み。staging runtime 証跡は生成しない。
