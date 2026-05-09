# Phase 12: ドキュメント・未タスク・スキルフィードバック

`outputs/phase-12/` 配下に **必ず 7 ファイル** を生成する（task-specification-creator skill の Phase 12 strict 7 outputs ルール）。

## 12.1 必須 7 ファイル

| ファイル | 役割 | 主な内容 |
| --- | --- | --- |
| `main.md` | Phase 12 サマリ | 7 ファイル index / 状態遷移結果 / 次アクション |
| `implementation-guide.md` | 中学生レベル概念説明 + 実装ハイライト | 「workflow_state とは何か」「状態語彙の昇格とは」「なぜ skill 本体に集約するのか」「変更ファイル diff のハイライト」 |
| `system-spec-update-summary.md` | aiworkflow-requirements 等システム正本仕様への影響 | Issue #534 inventory / ledger / indexes sync を含む。CLAUDE.md / docs/00-getting-started-manual/specs/ への変更なしを明記 |
| `documentation-changelog.md` | このタスクで生成・編集された全ドキュメントの changelog | skill 配下 9 ファイル + workflow ディレクトリ自身の生成 |
| `unassigned-task-detection.md` | 後続タスク（未アサイン） | (1) workflow_state 機械的強制 hook (2) compliance-check 自動生成 CI gate（Phase 10.3 で挙げた 2 件） |
| `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への feedback | 本タスク自身の運用で気づいた skill 改善点 |
| `phase12-task-spec-compliance-check.md` | 本タスクの spec vs 実装の整合確認 | 新 reference `references/phase12-compliance-check-template.md` を **本タスク自身に対して適用**して生成（drink-your-own-champagne） |

## 12.2 implementation-guide.md の中学生レベル説明（必須セクション）

```markdown
## このタスクで何をしたか（中学生向け説明）

### 1. workflow_state って何？
プロジェクトの「いま、どこまで進んだか」を表す合言葉。たとえば:
- spec_created = 仕様書を書いただけ
- completed = ぜんぶ終わった
合言葉が人によって違うと「終わった/終わってない」が食い違うので、辞書を作る必要があった。

### 2. なぜ skill に集約したか
これまで合言葉の説明が 3 つの別々のファイルに散らばっていた。だから誰かが新しい合言葉を覚えても、別のファイルを読んだ人は知らない、という事故が起きた。1 ファイルに集めて、他のファイルからは「ここを読んでね」とリンクするだけにした。

### 3. 何を作ったか
- 合言葉の辞書（workflow-state-vocabulary.md）
- 「合言葉どおりに動いているかを確認するチェックリスト」（phase12-compliance-check-template.md）

### 4. 次は何が残っているか
辞書はできたが「合言葉を守っているか自動でチェックする仕組み」（hook / CI gate）はまだ。これは別のタスクとして切り出した。
```

## 12.3 unassigned-task-detection.md（後続タスク 2 件）

### Task A: workflow_state hook 機械的強制

```yaml
task_id: task-spec-skill-workflow-state-hook-enforcement
priority: medium
scale: medium
status: unassigned
parent_task: docs/30-workflows/issue-534-skill-workflow-state-guidance/
spec_path: docs/30-workflows/unassigned-task/task-spec-skill-workflow-state-hook-enforcement.md
```

目的: `artifacts.json.metadata.workflow_state` と `phases[].status` の整合を pre-commit hook / CI gate で検査し、drift 発生時に commit / push を block する。

### Task B: compliance-check 自動生成 CI gate

```yaml
task_id: task-spec-skill-compliance-check-ci-gate
priority: low
scale: small
status: unassigned
parent_task: docs/30-workflows/issue-534-skill-workflow-state-guidance/
spec_path: docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md
```

目的: PR で `outputs/phase-12/phase12-task-spec-compliance-check.md` の存在を CI で検査する gate を追加。

両タスクとも本タスクの完了後に独立 PR として実装する。本タスクと一括にしない理由は CONST_007 例外条件（hook 設計 / CI 設計を含む独立スコープ）に該当するため。

## 12.4 skill-feedback-report.md の観点

- 本タスクで vocabulary を新設して気づいた skill 構造の改善点（Phase 12 strict 7 outputs ルールが skill 本体に明記されているか確認）
- 親タスクで報告された promotion target が本タスクで完全に解消されたか（L9-13 の項目を逐次チェック）
- 新 reference `phase12-compliance-check-template.md` を本タスク自身の compliance-check に適用して気づいた改善点

## 12.5 phase12-task-spec-compliance-check.md（drink-your-own-champagne）

新 reference `phase12-compliance-check-template.md` を **本タスク自身**に適用して生成する。観点:

- 状態 vs 実コード乖離: vocabulary に「実装済み」と書いた状態（`implemented_local_evidence_captured`）と本タスクの実体が一致しているか
- outputs と code の整合: `outputs/phase-11/evidence/` の log と skill 配下の実 diff が一致しているか
- skill 本体（SKILL.md / references / changelog / LOGS）が同一 wave で更新されているか
- 禁止表記が混入していないか
- workflow root の削除・移動がある場合に aiworkflow indexes / active ledger / LOGS が stale 参照を残していないか

## 12.6 状態遷移

- 本 Phase 完了時点: artifacts.json `metadata.workflow_state` を `implemented_local_evidence_captured` に更新（Phase 13 commit/push/PR merge 後に `completed`）

## DoD

- [ ] 12.1 の 7 ファイルが `outputs/phase-12/` 配下に配置されている
- [ ] implementation-guide.md に中学生レベル説明 4 節が含まれる
- [ ] unassigned-task-detection.md に後続タスク 2 件のメタ情報が記述され、`docs/30-workflows/unassigned-task/` に spec stub を配置
- [ ] phase12-task-spec-compliance-check.md が新 reference テンプレに従って生成されている

## 次フェーズへの引き渡し

Phase 13 で commit / PR を行う。ただし **ユーザー承認が必須**（artifacts.json の `phases[13].user_approval_required: true`）。
