# Phase 12: close-out（実装ガイド・仕様同期・未タスク・スキルフィードバック）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 12 / 13 |
| Phase 名称 | close-out |
| 作成日 | 2026-05-02 |
| 前 Phase | 11 (evidence 取得 NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| user_approval_required | false |
| docs_only | true |
| visualEvidence | NON_VISUAL |

## 目的

skill `task-specification-creator` Phase 12 の必須 7 成果物を作成し、本タスクの close-out 文書群を確定する。本タスクは **spec_created / docs-only=true / NON_VISUAL** であり、Phase 11 の evidence 7 種は実行 wave で取得する計画 evidence として扱う。Phase 13 commit / push / PR は承認ゲートに残す。

## spec_created / docs-only=true / NON_VISUAL の close-out 境界

| 観点 | 本タスクでの扱い |
| --- | --- |
| root `metadata.workflow_state` | `spec_created`（実装フェーズ自体が docs 編集のため、別状態に昇格させない） |
| phase 11 / 12 の status | `completed`（仕様書作成完了として） |
| evidence 実取得 | Phase 11 runbook 通り 7 件を取得済み。`verify-indexes.log` は `pnpm indexes:rebuild` 成功 + Issue #346 resource-map row の意図的 index 更新、link check は targeted PASS（full checker 未設定） |
| Phase 13 との境界 | Phase 12 完了でも commit / push / PR は **不可**。Phase 13 で承認ゲート |

## 7 必須成果物（strict 命名表）

| # | 必須ファイル名 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | close-out 全体サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル概念説明 + Part 2 技術者レベル |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 3 ファイル反映差分サマリ + 09a-c 参照差分サマリ |
| 4 | `outputs/phase-12/documentation-changelog.md` | 本 wave で更新したファイル一覧（spec / index / phase 13 件 + outputs） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 検出 0 件でも出力必須 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への改善提案（該当 0 件でも明記） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 ファイル parity / artifacts.json 整合 / Phase status 整合 |

## 実行タスク

### Task 12-1: implementation-guide.md 作成

- **Part 1（中学生レベル）**: 「タスクの引き出しが空っぽだったら？」のたとえで、08a の canonical path 欠落を「教科書のページが破れていた状態」として説明。「破れたページを履歴から戻し、目次が元のページを指せるようにした」ことが本タスクの核心であると平易に表現。
- **Part 2（技術者レベル）**: 状態決定アルゴリズム / aiworkflow-requirements 3 ファイル更新手順 / 09a-c 参照同期 / `pnpm indexes:rebuild` の役割 / `verify-indexes-up-to-date` gate の意味を runbook 形式で記述。

### Task 12-2: system-spec-update-summary.md 作成

- aiworkflow-requirements 3 ファイル（`legacy-ordinal-family-register.md` / `resource-map.md` / `task-workflow-active.md`）の反映差分サマリ
- 09a / 09b / 09c spec の 08a 参照置換差分サマリ
- `docs/00-getting-started-manual/specs/00-overview.md` への参照追記要否判定（不変条件 #5/#6/#7 への影響なしのため追記不要、と判定根拠を記載）

### Task 12-3: documentation-changelog.md 作成

- 本 wave で更新した spec / index.md / phase-01〜13.md / outputs/* を列挙
- aiworkflow-requirements 3 ファイル + indexes 再生成差分も明記
- 09a / 09b / 09c / unassigned-task の参照置換差分も明記

### Task 12-4: unassigned-task-detection.md 作成

- 本タスクが既に未タスク（`docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md`）から派生していることを明記
- 09a / 09b / 09c spec が物理不在の場合は新規未タスク候補として「09a-c spec 作成」を起票
- それ以外で新規未タスク候補がなければ「該当 0 件」と明記

### Task 12-5: skill-feedback-report.md 作成

- docs-only / canonical tree restore タイプのタスクで closed issue から spec 作成する運用が `task-specification-creator` skill の標準フローに含まれているかを確認
- 改善点なしでも空 report ではなく「該当 0 件」と記載
- aiworkflow-requirements の `legacy-ordinal-family-register.md` における `current/partial` 状態語の取り扱いガイドが skill 側に欲しい場合はその旨を記録

### Task 12-6: phase12-task-spec-compliance-check.md 作成

- root `artifacts.json` と `outputs/artifacts.json` の parity を明記
- 7 ファイル実体確認
- Phase status 整合（phase 1〜12 = completed、phase 13 pending_user_approval）
- root `metadata.workflow_state` が `spec_created` であること

### Task 12-7: main.md 作成

- 上記 6 task のサマリと完了判定
- 推奨案 A 採用結果と evidence PASS / FAIL の総合判定

## 完了条件

- [x] 7 ファイル実体存在
- [x] root `artifacts.json` が唯一正本である旨を compliance check に明記
- [x] root `metadata.workflow_state` は `spec_created`
- [x] phase 12 status を `completed` に更新

## タスク100%実行確認【必須】

- [x] 全実行タスク completed
- [x] artifacts.json の phase 12 を `completed`
- [x] Phase 13 への引き継ぎ準備完了

## 次 Phase

- 次: Phase 13 (PR 作成 — 承認ゲート)
- 引き継ぎ: 7 ファイル成果物 + change-summary 入力
