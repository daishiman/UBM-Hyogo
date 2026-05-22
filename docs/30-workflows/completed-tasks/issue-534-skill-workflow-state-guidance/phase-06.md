# Phase 6: コードレビュー観点

skill 文書のみの変更だが、レビューで以下を確認すること。

## 6.1 用語整合

- [ ] vocabulary 内の状態識別子が SKILL-changelog.md の過去 version 行で使われている表記と完全一致するか
  - 確認: `grep -E 'CONTRACT_READY|PASS_BOUNDARY_SYNCED|RUNTIME_PENDING' .claude/skills/task-specification-creator/SKILL-changelog.md`
- [ ] 「workflow_state」と「workflow state」「state」「ステータス」を文中で混在させていないか
- [ ] phase status の語彙（`completed` / `pending` / `blocked`）と workflow_state の `completed` の責務分離が文中で説明されているか

## 6.2 リンク死活

- [ ] SKILL.md の References 表に追加した 2 行が markdown link として有効か
- [ ] 既存 3 reference に追加したリンクが相対パスで正しく解決するか（`references/workflow-state-vocabulary.md` 形式 — 同一ディレクトリ内のため `./` 不要）
- [ ] 親タスク Phase 12 成果物への参照パスが `docs/30-workflows/completed-tasks/issue-371-...` で正しい

## 6.3 状態語彙網羅

- [ ] vocabulary に最低 5 状態（spec_created / CONTRACT_READY_IMPLEMENTATION_PENDING / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implemented_local_evidence_captured / completed）が定義されている
- [ ] 各状態に「直前条件」「後続状態」「必要証跡」が記述されている
- [ ] 状態 → 必要証跡マッピング表が縦軸 5 状態 × 横軸 5 証跡カテゴリ以上で構成されている

## 6.4 禁止表記節

- [ ] `PASS` 単独表記禁止が明示されている
- [ ] phase-status と workflow-status の混在禁止が明示されている
- [ ] 状態名の和訳禁止（英識別子のまま使う）が明示されている

## 6.5 compliance-check テンプレ

- [ ] 「観点リスト」「検証コマンド」「drift パターン例」の 3 章構成
- [ ] drift パターン例に親タスクの実例（「outputs は spec-only を主張、実コードは完了済み」）が含まれる
- [ ] 検証コマンドが実行可能（`rg`、`mise exec`、`git diff` で構成）

## 6.6 changelog / LOGS

- [ ] SKILL-changelog.md の version 行が既存最新行の **上** に追加されており過去行は変更されていない
- [ ] LOGS/_legacy.md の usage log が追記され、既存行を破壊していない
- [ ] version 識別子に重複がない（`grep '^| v2026.05.08-skill-workflow-state-vocabulary' .claude/skills/task-specification-creator/SKILL-changelog.md` が 1 件）

## 6.7 indexes

- [ ] `mise exec -- pnpm indexes:rebuild` 後に `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` が 0
- [ ] indexes に差分が発生した場合は同一コミットに含まれている（drift のまま push しない）

## 6.8 機械的強制への引き渡し

- [ ] vocabulary 末尾に「機械的強制が必要」と明示し、後続タスクで分離する旨が記述されている

## 次フェーズへの引き渡し

Phase 7 では静的解析（typecheck / lint）と indexes 検査を実施する。
