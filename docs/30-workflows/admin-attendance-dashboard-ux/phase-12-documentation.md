# Phase 12: ドキュメント同期

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest は本改善サイクルで完了）
- taskType: `implementation` / visualEvidence: `VISUAL`
- 本 Phase の責務: strict 7 成果物を `outputs/phase-12/` に作成し、
  Phase 1-11 の設計・検証内容を正本として同期する

> **300 行超許容の理由**: 本タスクは `implemented_local_runtime_pending` の実装仕様書であり、
> 別タスク分離仕様（AC-9）を含む 9 必須見出しの compliance check は横断参照が必要で
> 意味的に分割すると追跡性を損なう。また strict 7 の索引・Task 進捗・Phase 10 MINOR 追跡
> テーブルを直列記述する必要があるため、条件付き超過許容（phase-template-phase12.md 参照）。

## 目的

出席ダッシュボード UI/UX 是正仕様書（admin-attendance-dashboard-ux）の
Phase 1〜11 成果物を、Phase 12 strict 7 へ集約・正本同期する。

主な成果物:
- `apps/web` のみのスコープで CSS 崩れ/バー楕円潰れ/ラベル不整合を是正する実装仕様
- 計算意味論是正（`apps/api`）は別タスクへ分離（AC-9/CONST_007）

## 実行タスク

| Task | 成果物 | 説明 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル例え話）+ Part 2（CSS 配置・コンポーネント変更・トークン使用例） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 = N/A（UI 表示のみ・ドメイン仕様無影響） |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/B/C 結果、別タスク分離記録、validator 結果 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 検出 1 件（AC-9 計算意味論是正）、配置先 `unassigned-task-specs/` |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善点 / 観察事項 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠確認 |
| 12-7 | `outputs/phase-12/main.md` | Phase 12 全体サマリ・strict 7 索引 |

## 参照資料

| 種別 | Path | 内容 |
| --- | --- | --- |
| 要件定義 | `phase-1-requirements.md` | AC-1..AC-9・根本原因 |
| 設計 | `phase-2-design.md` | 変更 10 ファイル・CSS ブロック・ラベル設計 |
| 設計レビュー | `phase-3-design-review.md` | 不変条件適合・設計判断・PASS 判定 |
| タスク索引 | `index.md` | Phase 構成・タスク概要 |
| artifacts | `artifacts.json` | gates / phase12_strict_outputs / verify_commands |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Phase 12 規約 |
| compliance SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical 9 見出し |

### システム仕様（参照）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX 禁止 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ構成 |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ・strict 7 索引 |
| `outputs/phase-12/implementation-guide.md` | Part 1（例え話）+ Part 2（技術者向け CSS・変更ファイル詳細） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 N/A 理由 |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル・validator 結果・Step 結果 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク 1 件（AC-9 計算是正）・配置先記録 |
| `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善提案 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 / 4 条件 verdict |
| `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` | AC-9 計算意味論是正 Issue-ready 仕様書 |

## 統合テスト連携

| テスト種別 | 対象 Phase | 本 Phase との関係 |
| --- | --- | --- |
| focused vitest（format-attendance / ZoneChart / KpiPanel） | Phase 4/6/8/9 | 本改善サイクルで実行済み。結果は `outputs/phase-11/manual-test-result.md` と implementation-guide に明記 |
| pnpm verify:tokens | Phase 6/9 | AC-6 token gate。コマンドを implementation-guide に明記 |
| git diff apps/api | Phase 9 | AC-7 API 非変更確認。コマンドを documentation-changelog に記録 |
| pnpm typecheck / pnpm lint | Phase 9 | 後続実装サイクルで実行 |

## Phase 10 MINOR 追跡テーブル

Phase 3 設計レビューにて MINOR 指摘なし（明示 0 件）。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | -------------- | -------- | ---------- |
| （なし） | — | — | — | — | 0 件 |

## 完了条件

1. strict 7 ファイルが `outputs/phase-12/` に実体として存在すること
2. `phase12-task-spec-compliance-check.md` の canonical 9 見出しが template 準拠であること
3. AC-9 計算意味論是正が `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` として実体化していること
4. `artifacts.json` の Gate-A `evidence_path` が `outputs/phase-12/phase12-task-spec-compliance-check.md` を指していること
5. Phase 13 が `pending_user_approval` 状態で、commit/push/PR が user-gated として明記されていること
