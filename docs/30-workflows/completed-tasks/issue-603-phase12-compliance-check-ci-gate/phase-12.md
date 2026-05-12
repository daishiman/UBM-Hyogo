# Phase 12: 実装ガイド・SSOT 同期・未タスク・skill feedback（strict 7 ファイル）

## 目的

Phase 12 必須 6 タスクを完遂し、`outputs/phase-12/` 配下に strict 7 ファイルを逐語固定で実体作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## strict 7 ファイル（逐語固定 / 短縮名禁止）

| # | 正規ファイル名 | 由来 Task |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 本体 index |
| 2 | `implementation-guide.md` | Task 1 |
| 3 | `system-spec-update-summary.md` | Task 2 |
| 4 | `documentation-changelog.md` | Task 3 |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須）|
| 6 | `skill-feedback-report.md` | Task 5（改善なしでも必須）|
| 7 | `phase12-task-spec-compliance-check.md` | Task 6 |

---

## Task 1: 実装ガイド（`implementation-guide.md`）

### Part 1: 中学生レベル

- 例え話:
  - 「タスク仕様書の compliance check」=「学校の宿題チェックリスト。提出する宿題に必須項目（名前・日付・本文・感想…）が全部書かれているかを先生が機械的に確認する」
  - 「CI gate」=「先生のチェックリストを自動採点機にしたもの。提出時に自動で評価される」
  - 「canonical heading」=「採点機が確認する『必須見出し』。9 項目決まっている」
  - 「spec-only root」=「まだ実装していない、設計だけの宿題。実装証拠は要求しない」
- セルフチェック表（5 用語以上）:
  - compliance check → 「ルール通りに書けているかの確認」
  - canonical heading → 「決められた見出し」
  - PR diff → 「変更された箇所」
  - workflow root → 「タスク 1 つ分のフォルダ」
  - exit code → 「成功か失敗かを表す番号」
- なぜ必要か → 何をするか: タスク仕様書が品質基準を満たしているかを毎回手で確認するのは大変 → 自動化して PR で必ず確認する

### Part 2: 技術者レベル

- TypeScript 型: `WorkflowRoot` / `WorkflowState` / `CanonicalHeading` / `ComplianceCheckResult`
- API:
  - `collectChangedWorkflowRoots(opts): Promise<WorkflowRoot[]>`
  - `loadCanonicalHeadings(templatePath): CanonicalHeading[]`
  - `verifyComplianceFile(opts): ComplianceCheckResult`
- 設定: `GITHUB_BASE_REF`（default `origin/dev`）/ `GITHUB_HEAD_REF`（default `HEAD`）/ `paths` filter（workflow 自身・`package.json`・`docs/30-workflows/**`・検証 script/test/fixture・canonical template）
- エラーハンドリング: exit 0/1/2、stdout JSON
- runtime path × evidence:

  | runtime path | evidence |
  | --- | --- |
  | local CLI run | `outputs/phase-11/evidence/local-verify.log` |
  | CI job | `outputs/phase-11/evidence/ci-job.log`（PR 作成後に user-gated） |
  | focused test | `outputs/phase-11/evidence/test.log` |

- forward-safe rollback: workflow disable または `continue-on-error: true` で即時無効化、script 削除で完全 rollback

---

## Task 2: system-spec 更新サマリ（`system-spec-update-summary.md`）

- 反映先 SSOT:
  - `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（drift 防止文言）
  - `.claude/skills/task-specification-creator/SKILL.md`（CI gate 名追記）
  - `.claude/skills/aiworkflow-requirements/references/deployment-core.md`（CI gate 一覧 SSOT）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active workflow inventory）
  - `.claude/skills/aiworkflow-requirements/references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md`（artifact inventory）
- 反映内容: `verify-phase12-compliance` workflow の存在、検査範囲、focused test 実行、SSOT 参照関係
- 差分要約: 文書・SSOT 同期、検証コード 5 ファイル、新規 workflow 1 ファイル、fixture 6 ファイル

---

## Task 3: documentation changelog（`documentation-changelog.md`）

- 新規: `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/`（本 root 14 ファイル）
- 編集: skill / SSOT 4 ファイル
- 削除: `docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md`（completed-tasks へ移動 or 本 root に統合）

---

## Task 4: 未タスク検出（`unassigned-task-detection.md`）

- 検出ルール: workflow_state hook（#602）/ phase-12 strict 7 ファイル名変更タスク等が分離候補
- 本サイクル分離タスク: なし（CONST_007 に従い 1 サイクル完結）
- 0 件でも本ファイル必須

---

## Task 5: skill feedback（`skill-feedback-report.md`）

- 対象 skill: `task-specification-creator`
- feedback 内容: Required Sections が CI gate の SSOT になる旨を template 内に明記
- 改善なしでも本ファイル必須

---

## Task 6: phase-12 compliance check（`phase12-task-spec-compliance-check.md`）

本 root 自身に対する compliance check。9 canonical heading 全てを含む。local 実装後は `implemented_local_runtime_pending` 状態で作成。

---

## 完了条件

- [ ] strict 7 ファイル全て逐語固定で作成
- [ ] artifacts.json parity 確認
- [ ] `pnpm test:phase12-compliance` と `pnpm verify:phase12-compliance` を本 root に対し実行し PASS

## Next Phase

- [Phase 13](phase-13.md): PR 作成
