# Phase 3 — governance 文書 / SSOT 反映先設計

## 反映先一覧（実装済み確認）

| 反映先 | 種別 | 状態 |
| --- | --- | --- |
| `CLAUDE.md`「ブランチ戦略」章 | 編集 | 実装済（L81 に Issue #554 注記） |
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 新規 | 実装済 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | 実装済（branch-protection 参照あり） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 実装済（branch-protection キーワード追加） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | 実装済 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | 実装済 |

## branch-protection.md skeleton（実装内容）

実ファイル `.claude/skills/aiworkflow-requirements/references/branch-protection.md` を参照（current contract / required status checks / invariants / Issue #554 runbook の 4 セクション構成）。

## 文言ガイドライン適用

- 「required status check」表記で統一
- workflow / job セパレータは `audit-correlation-verify / verify`（半角スラッシュ前後スペース 1）
- 個別 contexts 一覧は GitHub 側を SSOT とし、本ファイルは不変条件 + 本タスク追加 context のみ正本扱い

## DoD

- [x] 反映先 5 件以上の編集差分プレビューが記録（実ファイル diff として確認可能）
- [x] `references/branch-protection.md` skeleton が実体化済
