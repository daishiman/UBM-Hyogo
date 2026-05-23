# Phase 4: テスト戦略

本タスクは skill 本体の文書化が中心のため runtime テストは存在しない。代わりに **静的検査（grep gate / link 到達性 / indexes diff）** を Phase 7-8 で実施し、Phase 11 evidence として log を残す。

## 4.1 検査対象と手段

| カテゴリ | 検査対象 | 手段 | 期待値 |
| --- | --- | --- | --- |
| 状態語彙網羅 | vocabulary に必要 5 状態が含まれるか | `rg -n 'spec_created\|CONTRACT_READY_IMPLEMENTATION_PENDING\|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING\|implemented_local_evidence_captured\|completed' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md` | 5 識別子すべて 1 件以上ヒット |
| 禁止表記の自己整合 | vocabulary 自身に禁止表記節があるか | `rg -n 'PASS 単独\|状態混在' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md` | 1 件以上ヒット |
| SKILL.md 登録 | References 表に新 reference 2 件が登録されているか | `grep -E 'workflow-state-vocabulary\|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md` | 2 件以上ヒット |
| 既存 reference link | 3 ファイルから新 reference へのリンクが存在 | `grep -l workflow-state-vocabulary .claude/skills/task-specification-creator/references/{phase-12-spec.md,phase12-skill-feedback-promotion.md,phase-template-phase11.md}` | 3 ファイルすべてヒット |
| compliance-check テンプレ構成 | 観点リスト + 検証コマンド + drift 例の 3 部構成 | `rg -n '^## ' .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | 「観点」「検証コマンド」「drift」3 章を含む |
| changelog 連番 | 既存最新 version 行の上に追記 | `head -10 .claude/skills/task-specification-creator/SKILL-changelog.md` | 本タスクの version 行が最新行として存在 |
| LOGS sync | usage log が追記されている | `grep issue-534 .claude/skills/task-specification-creator/LOGS/_legacy.md` | 1 件以上ヒット |
| indexes drift | aiworkflow-requirements indexes に drift がない | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` | exit 0 |

## 4.2 検査コマンドの実行順序

1. ファイル新規作成 / 編集の完了後にローカルで上記 8 コマンドを実行
2. 各コマンドの出力を `outputs/phase-11/evidence/` 配下に log として保存:
   - `grep-vocabulary.log`（状態語彙網羅）
   - `link-reachability.log`（SKILL.md / 既存 reference からのリンク確認）
   - `indexes-rebuild.log`（rebuild 出力）
   - `indexes-diff.log`（rebuild 後の `git diff --stat`）

## 4.3 失敗時のフォールバック

- 状態語彙が抜けていた場合: vocabulary を編集して再 grep
- 既存 reference からのリンク漏れ: 該当ファイルに link を追加して再 grep
- indexes drift が出る場合: rebuild の差分を含めて commit する（drift と判定されないよう同一 commit に含める）

## 4.4 テスト追加（コード実行が伴うもの）

本タスクは skill 文書化のみで、`apps/api` / `apps/web` のコードに変更が入らないため、Vitest / E2E の追加は不要。`mise exec -- pnpm typecheck` / `pnpm lint` は Phase 7 で実行し、影響がない（=既存と差分が出ない）ことを確認する。

## 4.5 次フェーズへの引き渡し

Phase 5 では本検査基準を満たす実装ランブック（reference 作成 → link → changelog → indexes 再生成の手順）を作成する。
