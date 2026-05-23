# Phase 11: NON_VISUAL evidence contract

本タスクは UI を伴わない skill 文書化タスクのため、`artifacts.json.metadata.visualEvidence: NON_VISUAL` を採用し、Phase 11 縮約テンプレ（`.claude/skills/task-specification-creator/references/phase-template-phase11.md` の docs-only / NON_VISUAL 縮約節）に従って evidence を contract する。

## 11.1 必須 evidence ファイル

`docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/` 配下に以下を配置する:

| ファイル | 内容 | 取得方法 |
| --- | --- | --- |
| `main.md` | Phase 11 サマリ（NON_VISUAL declaration / evidence index / 検査結果一覧） | 手動作成（テンプレに従う） |
| `evidence/typecheck.log` | `mise exec -- pnpm typecheck` 出力 | Phase 7.1 |
| `evidence/lint.log` | `mise exec -- pnpm lint` 出力 | Phase 7.2 |
| `evidence/indexes-rebuild.log` | `mise exec -- pnpm indexes:rebuild` 出力 | Phase 7.3 |
| `evidence/indexes-diff.log` | rebuild 後の `git diff --stat .claude/skills/aiworkflow-requirements/indexes` | Phase 7.3 |
| `evidence/grep-vocabulary.log` | 状態語彙網羅検査 + 禁止表記節検査 | Phase 8.1-8.2 |
| `evidence/link-reachability.log` | SKILL.md References / 既存 reference link 検査 | Phase 8.3-8.4 |
| `evidence/changelog-sync.log` | SKILL-changelog.md 行追加検査 | Phase 8.5 |
| `evidence/logs-sync.log` | LOGS/_legacy.md 行追加検査 | Phase 8.6 |
| `evidence/compliance-check-structure.log` | compliance-check テンプレ章構成検査 | Phase 8.7 |
| `evidence/changelog-deletions.log` | SKILL-changelog.md 削除行ゼロ検査 | Phase 9.3 |
| `evidence/logs-deletions.log` | LOGS/_legacy.md 削除行ゼロ検査 | Phase 9.4 |
| `evidence/skillmd-deletions.log` | SKILL.md 削除行ゼロ検査 | Phase 9.5 |

## 11.2 main.md テンプレ

```markdown
# Phase 11 — NON_VISUAL evidence main

## 宣言
- visualEvidence: NON_VISUAL
- 採用テンプレ: phase-template-phase11.md §「docs-only / NON_VISUAL 縮約テンプレ」（実態は skill 文書化のため `taskType: implementation` だが UI 変更ゼロのため NON_VISUAL を採用）

## 検査結果サマリ
| 検査 | コマンド | 期待 | 実測 | 結果 |
| --- | --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | exit 0 (`evidence/typecheck.log`) | PASS |
| lint | `mise exec -- pnpm lint` | exit 0 | exit 0 (`evidence/lint.log`) | PASS |
| indexes:rebuild | `mise exec -- pnpm indexes:rebuild` | exit 0 | exit 0 (`evidence/indexes-rebuild.log`) | PASS |
| indexes diff | `git diff --stat .claude/skills/aiworkflow-requirements/indexes` | expected same-wave diff | quick-reference/resource-map/topic-map updated (`evidence/indexes-diff.log`) | PASS |
| 状態語彙網羅 | rg 5 識別子 | 5 件 | 5+ hits (`evidence/grep-vocabulary.log`) | PASS |
| 禁止表記節 | rg 'PASS 単独\|状態混在' | >=1 件 | hits recorded (`evidence/grep-vocabulary.log`) | PASS |
| SKILL.md 登録 | grep 新 reference 2 件 | 2 件 | 2 links (`evidence/link-reachability.log`) | PASS |
| 既存 reference link | grep 3 ファイル | 3 件 | 3 references linked (`evidence/link-reachability.log`) | PASS |
| changelog 連番 | head + grep 新 version 行 | 1 件 | 1 hit (`evidence/changelog-sync.log`) | PASS |
| LOGS/_legacy.md sync | grep issue-534 | >=1 件 | 1+ hit (`evidence/logs-sync.log`) | PASS |
| compliance-check 構成 | rg ^## | 観点 / 検証コマンド / drift | sections present (`evidence/compliance-check-structure.log`) | PASS |
| 削除行ゼロ | git diff grep content deletions in skill ledgers | 0 件 | 0 content deletion lines in skill files | PASS |

## state 表記
- 本タスクの workflow_state（Phase 11 evidence 配置完了時点）: `implemented_local_evidence_captured`
- runtime smoke は本タスクに存在しないため、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は使わない。runtime/deploy/production evidence が外部承認待ちのタスクだけがこの語彙を使う。

## evidence index
（11.1 表をリンク化して列挙）
```

## 11.3 状態遷移

- Phase 10 終了時点: `CONTRACT_READY_IMPLEMENTATION_PENDING`
- Phase 11 evidence 配置完了時点（本 Phase 完了時）: `implemented_local_evidence_captured`
- artifacts.json の `metadata.workflow_state` は **「実装」=「skill 文書を書くこと」が完了した時点** で `implemented_local_evidence_captured` に更新し、Phase 13 PR merge 後に `completed` へ遷移する。

## DoD

- [ ] 11.1 の必須 evidence 全 13 ファイルが配置されている
- [ ] main.md の検査結果サマリに 12 行すべて PASS が記録されている
- [ ] artifacts.json `metadata.workflow_state` を `implemented_local_evidence_captured` に更新し、Phase 1-12 status を completed に揃える

## 次フェーズへの引き渡し

Phase 12 では implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main の 7 ファイルを生成する。
