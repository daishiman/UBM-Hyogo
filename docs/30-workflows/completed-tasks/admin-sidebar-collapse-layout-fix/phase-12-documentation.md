# Phase 12: ドキュメント同期

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- workflow_state: `implemented_local_evidence_captured`（実装・focused vitest・local screenshot 取得済み。commit / push / PR / staging visual は user-gated）
- taskType: `implementation` / visualEvidence: `VISUAL`
- 本 Phase の責務: strict 7 成果物を `outputs/phase-12/` に作成し、Phase 1-11 の設計・検証内容を正本として同期する

> **条件付き分量超過の理由**: 本タスクは VISUAL の実装仕様書であり、collapsed/expanded レイアウト整合という
> 単一関心の中で 4 コンポーネント + 4 テストの Before→After・9 必須見出しの compliance check を横断参照する必要があるため、
> 意味的に分割すると追跡性を損なう。条件付き超過許容（phase-template-phase12.md 参照）。

## 目的

サイドバー collapsed/expanded レイアウト是正仕様書（admin-sidebar-collapse-layout-fix）の
Phase 1〜11 成果物を、Phase 12 strict 7 へ集約・正本同期する。

主な成果物:
- `apps/web` の sidebar shell コンポーネント群のみのスコープで、collapsed 時のはみ出し・中央軸不一致を Tailwind className 分岐で是正する実装仕様
- 計算/API/D1/Form は無変更（不変条件 #1 #5）。tooltip overflow clip（OOS-1）は baseline として未タスク分離せず記録のみ

## 実行タスク（Phase 12 の 6 タスク）

| Task | 成果物 | 説明 | 状況 |
| --- | --- | --- | --- |
| 12-1 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル・例え話・専門用語セルフチェック表）+ Part 2（変更 4 コンポーネントの Before→After・className 設計・検証コマンド・既知制限）。識別子は実コード Read で引用 | completed |
| 12-2 仕様更新 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C 完了記録 / Step 2 = N/A（新規 interface / 型 / 定数なし。Tailwind className 分岐のみ） | completed |
| 12-3 changelog | `outputs/phase-12/documentation-changelog.md` | 全 Step の結果を個別明記（「該当なし」も記録）。workflow-local 同期と global skill sync を別ブロックで記載 | completed |
| 12-4 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | `current`（本サイクル検出 = 0 件）と `baseline`（OOS-1 tooltip overflow clip）を分離記録。0 件でも出力必須 | completed |
| 12-5 skill feedback | `outputs/phase-12/skill-feedback-report.md` | テンプレ/ワークフロー/ドキュメント観点の観察。改善点なしでも出力必須 | completed |
| 12-6 compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し（template `Required Sections` 1..9）に逐語準拠。implemented_local_evidence_captured の文脈で各見出しを埋める | completed |
| 12-7 本体サマリ | `outputs/phase-12/main.md` | Phase 12 全体サマリ・strict 7 索引（strict 7 の 7 ファイル目） | completed |

## 参照資料

| 種別 | Path | 内容 |
| --- | --- | --- |
| 共有設計コンテキスト | `_shared-context.md` | 根本原因 / 修正方針 / 変更対象 / AC / 命名規則の凝縮正本 |
| 要件定義 | `phase-1-requirements.md` | AC-1..AC-9・根本原因 |
| 設計 | `phase-2-design.md` | 変更 4 コンポーネント・className 分岐設計 |
| 設計レビュー | `phase-3-design-review.md` | 不変条件適合・設計判断・PASS 判定 |
| タスク索引 | `index.md` | Phase 構成・タスク概要 |
| artifacts | `artifacts.json` | gates / phase12_strict_outputs / verify_commands |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Phase 12 規約 |
| compliance SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical 9 見出し |

### システム仕様（参照）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX 禁止 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ構成 |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ・strict 7 索引 |
| `outputs/phase-12/implementation-guide.md` | Part 1（例え話）+ Part 2（技術者向け className 分岐・変更ファイル詳細） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 N/A 理由 |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル・validator 結果・全 Step 結果・skill sync 別ブロック |
| `outputs/phase-12/unassigned-task-detection.md` | current 0 件 / baseline（OOS-1）分離記録 |
| `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善観察 / routing |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 / 4 条件 verdict |

## 統合テスト連携

| テスト種別 | 対象 Phase | 本 Phase との関係 |
| --- | --- | --- |
| focused vitest（SidebarNavItem / SidebarUserMenu / SidebarShell） | Phase 4/6/8/9 | 実行済み。結果は `outputs/phase-11/manual-test-result.md` と implementation-guide に転記済み |
| pnpm verify:tokens | Phase 6/9 | AC-7 token gate。コマンドを implementation-guide に明記 |
| git diff apps/api | Phase 9 | AC-8 API 非変更確認。コマンドを documentation-changelog に記録 |
| pnpm typecheck / pnpm lint | Phase 9 | 実行済み |

## Phase 10 MINOR 追跡テーブル

Phase 3 設計レビューにて MINOR 指摘なし（明示 0 件）。OOS-1（tooltip overflow clip）は MINOR ではなく
scope 境界の baseline（CONST_007 例外: 回帰リスクの分離）として `unassigned-task-detection.md` に記録する。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | -------------- | -------- | ---------- |
| （なし） | — | — | — | — | 0 件 |

## 完了条件

1. strict 7 ファイルが `outputs/phase-12/` に実体として存在すること。
2. `phase12-task-spec-compliance-check.md` の canonical 9 見出しが template 準拠であること。
3. `unassigned-task-detection.md` が current（0 件）と baseline（OOS-1）を分離記録していること。
4. `artifacts.json` の Gate-A `evidence_path` が `outputs/phase-12/phase12-task-spec-compliance-check.md` を指していること。
5. Phase 13 が `pending_user_approval` 状態で、commit/push/PR/staging visual が user-gated として明記されていること。
