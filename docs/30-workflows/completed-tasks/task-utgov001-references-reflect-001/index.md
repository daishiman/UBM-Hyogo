# task-utgov001-references-reflect-001 - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #303 |
| タスクID | task-utgov001-references-reflect-001 |
| タスク名 | Reflect UT-GOV-001 second-stage applied branch protection into aiworkflow-requirements |
| ディレクトリ | docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001 |
| 作成日 | 2026-05-01 |
| 状態 | spec_created / Phase 1-12 completed |
| タスク種別 | docs-only |
| workflow_state | spec_created |
| visualEvidence | NON_VISUAL |
| Issue状態 | closed のまま参照。再オープンしない |

## 目的

UT-GOV-001 second-stage reapply の Phase 13 applied GET evidence を唯一の正本入力として、GitHub branch protection の最終適用状態を aiworkflow-requirements の references / indexes / task-workflow 系へ反映する。

## スコープ

### 含む

- `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-{dev,main}.json` の存在と内容検証
- GitHub GET evidence 由来であることを明記した `.claude/skills/aiworkflow-requirements/` 正本更新手順
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` の同期判断
- `.claude` 正本と `.agents` mirror の差分確認
- Issue #303 は closed のまま `Refs #303` として扱う方針

### 含まない

- GitHub branch protection PUT
- Phase 13 applied evidence が placeholder の状態での推測反映
- commit / push / PR 作成
- Issue #303 の再オープンまたは close 操作

## 重要ゲート

現ローカルの `outputs/phase-13/branch-protection-applied-{dev,main}.json` は fresh GitHub GET evidence であり、`required_status_checks.contexts` を含む。`blocked_until_user_approval` placeholder は上流 placeholder を拒否するための境界条件としてのみ扱い、current applied state には混入しない。

## 受入条件 (AC)

- AC-1: applied GET evidence の `required_status_checks.contexts` を dev / main 別に検証し、placeholder や null を final state として扱わない
- AC-2: 反映先 references / indexes の current state と GitHub GET evidence の対応表を作成する
- AC-3: `.claude/skills/aiworkflow-requirements/` を正本、`.agents/skills/aiworkflow-requirements/` を mirror として扱う
- AC-4: `expected-contexts-*` や payload ではなく `branch-protection-applied-*` の fresh GET 由来であることを全更新記録に明記する
- AC-5: Issue #303 は closed のまま `Refs #303` のみ採用し、`Closes #303` を使わない
- AC-6: Phase 11 は NON_VISUAL 代替証跡で実施し、スクリーンショットを要求しない
- AC-7: Phase 12 で implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check を作る
- AC-8: Phase 13 は user approval gate を保持し、commit / push / PR は明示承認まで blocked とする

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue | GitHub Issue #303 | 元要求、closed のまま扱う制約 |
| 未タスク正本 | docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001.md | Issue本文と同一の初期仕様 |
| 上流workflow | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/ | Phase 13 evidence と Phase 12 handoff |
| 正本仕様 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch protection current/pending state |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | UT-GOV-001 / UT-GOV-004 早見表 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory |
| workflow台帳 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 上流から本タスクへの引き渡し |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/reflection-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/gate-decision.md |
| 4 | 検証戦略 | phase-04.md | completed | outputs/phase-04/validation-matrix.md |
| 5 | 仕様反映実行 | phase-05.md | completed | outputs/phase-05/update-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/failure-cases.md |
| 7 | ACマトリクス | phase-07.md | completed | outputs/phase-07/ac-matrix.md |
| 8 | DRY化 | phase-08.md | completed | outputs/phase-08/refactor-notes.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/go-no-go.md |
| 11 | NON_VISUAL walkthrough | phase-11.md | completed | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check,elegant-final-verification}.md |
| 13 | PR準備 | phase-13.md | pending_user_approval | outputs/phase-13/{local-check-result,change-summary,pr-info,pr-creation-result}.md |
