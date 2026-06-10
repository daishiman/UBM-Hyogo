# Phase 12: ドキュメント同期

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck/lint/token gate 完了。本 Phase は strict 7 と local evidence を記録）
- taskType: `implementation` / visualEvidence: `VISUAL`
- 本 Phase の責務: strict 7 成果物を `outputs/phase-12/` に作成し、Phase 1-11 の設計・検証内容を正本として同期する

> **300 行超許容の理由**: 本タスクは VISUAL の実装完了タスク（`implemented_local_evidence_captured`）であり、AC-1..AC-12 の 12 受入基準と
> strict 7 成果物の compliance マトリクスは横断参照が必要で、意味的に分割すると追跡性を損なう。
> また strict 7 の索引・Task 進捗・Phase 10 MINOR 追跡テーブルを直列記述する必要があるため、条件付き超過許容
> （phase-template-phase12.md「phase-12.md の 300 行上限と設計タスクの例外条項」参照）。

## 目的

開催日/出席管理ドロワーの出席者追加を「1 名ずつ select → 追加」から「複数会員同時選択 → 一括追加」へ是正する
実装仕様書（`admin-meeting-bulk-attendance-select`）の Phase 1〜11 成果物を、Phase 12 strict 7 へ集約・正本同期する。

主な内容:
- `apps/web` のみのスコープで、既存の一括取込 endpoint（`POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false`）を
  再利用して複数選択 → 一括追加を実現する実装仕様（API / D1 / Google Form は非変更・AC-12）
- ドロワー内チェックリスト（主経路）と大量選択モーダル（補助経路）の 2 経路を `useBulkAttendanceSelection` に集約
- all-or-nothing commit を「未出席候補のみ選択」で構造的に回避する UX 設計

## 実行タスク

| Task | 成果物 | 説明 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル例え話）+ Part 2（型 / API 契約 / コード例 / 変更ファイル Before→After / 検証コマンド） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C 結果 / Step 2 = N/A（新規 shared 型なし・UI 表示と既存 endpoint 再利用のみ） |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 本 wave で作成した strict 7、実装予定ファイル一覧、workflow-local 同期 / global skill sync の分離記録、validator 結果 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | current 0 件 / baseline に M-1（CSV アップロード UI）・M-2（attendance route 二系統統合）を記録。SF-03 4 パターン照合 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | 改善点（調査 SubAgent の別 route 誤報 → 直接 Read 訂正の教訓 / 既存 endpoint 再利用で API 変更ゼロ） |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 + Task 12-1..12-6 + Step 1-A..1-C / Step 2 充足を root evidence として記録 |
| 12-7 | `outputs/phase-12/main.md` | Phase 12 全体サマリ・strict 7 索引 |

## 参照資料

| 種別 | Path | 内容 |
| --- | --- | --- |
| 要件定義 | `phase-1-requirements.md` | AC-1..AC-12・根本原因・前提コード検証 |
| 設計 | `phase-2-design.md` | アーキテクチャ・コンポーネント設計・状態引き渡しテーブル・CSS 設計 |
| 設計レビュー | `phase-3-design-review.md` | 4 条件評価・MINOR 指摘（M-1/M-2）・PASS 判定 |
| SSOT | `outputs/phase-1/shared-context.md` | API 契約・主要シグネチャ・all-or-nothing UX・不変条件チェックリスト |
| タスク索引 | `index.md` | Phase 構成・タスク概要 |
| artifacts | `artifacts.json` | gates / phase12_strict_outputs / verify_commands |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Phase 12 規約 |
| compliance SSOT | `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md` | canonical 9 見出し |

### システム仕様（参照）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX 禁止 |
| API schema | `.claude/skills/aiworkflow-requirements/references/api-*.md` | attendance import endpoint 契約 |
| ui-ux | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin primitive / FormField 規約 |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ・strict 7 索引 |
| `outputs/phase-12/implementation-guide.md` | Part 1（例え話）+ Part 2（型 / API 契約 / コード例 / 変更ファイル詳細） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 N/A 理由 |
| `outputs/phase-12/documentation-changelog.md` | 実装予定ファイル・validator 結果・current/baseline |
| `outputs/phase-12/unassigned-task-detection.md` | current 0 件 / baseline M-1・M-2 記録 |
| `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善点 / 観察事項 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 / 4 条件 verdict |

## 統合テスト連携

| テスト種別 | 対象 Phase | 本 Phase との関係 |
| --- | --- | --- |
| focused vitest（Checkbox / useBulkAttendanceSelection / BulkAttendanceChecklist / BulkAttendanceModal / MeetingAttendanceDrawer / importAttendance） | Phase 4/6/7 | PASS（focused Vitest 10 files / 38 tests） |
| pnpm verify:tokens | Phase 6/9 | AC-11 token gate。コマンドを implementation-guide に明記 |
| git diff apps/api packages | Phase 9 | AC-12 API 非変更確認。コマンドを documentation-changelog に記録 |
| pnpm typecheck / pnpm lint | Phase 9 | PASS |

## Phase 10 MINOR 追跡テーブル

Phase 3 設計レビューで MINOR を 2 件記録（M-1 / M-2）。いずれも本サイクル非対象で baseline 候補。

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | ------------- | -------- | ---------- |
| M-1 | CSV ファイルアップロード一括取込 UI（import endpoint の email 行・dryRun preview 活用） | — | Phase 12 | baseline 記録（将来の別 UX） | 未タスク化（baseline・起票見送り） |
| M-2 | attendance route 二系統（plural toggle / import）の統合は API リファクタで別タスク | — | Phase 12 | baseline 記録（apps/api スコープ） | 未タスク化（baseline・起票見送り） |

> M-1 / M-2 は CONST_007（1 サイクル完結）の例外として Phase 3 で別タスク化候補に記録済み。
> current 由来の起票必須未タスクは 0 件（`unassigned-task-detection.md` 参照）。

## 完了条件

1. strict 7 ファイルが `outputs/phase-12/` に実体として存在すること
2. `phase12-task-spec-compliance-check.md` の canonical 9 見出しが template 準拠であること
3. `unassigned-task-detection.md` の current が 0 件で、baseline に M-1 / M-2 が記録されていること
4. `artifacts.json` の Gate-A `evidence_path` が `outputs/phase-3/design-review-result.md` を指し、Gate-B / Gate-C が pending であること
5. Phase 13 が `pending_user_approval` 状態で、commit/push/PR/staging 視覚 baseline が user-gated として明記されていること
