# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

task-specification-creator の Phase 12 必須 5 タスクを実行し、aiworkflow-requirements の正本仕様へ T-6 close-out を同期する。

## 実行タスク

1. 実装ガイドを作成する（Part 1 中学生レベル + Part 2 技術者レベル）。
2. システム仕様書更新サマリーを作成し、Phase 11 evidence が正本仕様との差分を示す場合は aiworkflow-requirements references を更新する。
3. ドキュメント更新履歴を作成する。
4. 未タスク検出レポートを作成する（0 件でも必須）。
5. スキルフィードバックレポートを作成する（改善点なしでも必須）。
6. Phase 12 タスク仕様準拠チェックを root evidence として作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 5 タスク |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れ防止 |
| 必須 | .claude/skills/aiworkflow-requirements/references/spec-guidelines.md | 正本仕様更新ルール |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-fragment-spec.md | A-2 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md | A-1 正本 |

## 実行手順

1. Phase 11 evidence を読み、close-out 範囲を確定する。
2. Phase 12 必須 5 成果物を作成する。
3. aiworkflow-requirements の index 再生成が必要な場合は `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行する。

## 多角的チェック観点（AIが判断）

- 5 成果物のうち 0 件レポート系を省略していないか。
- 正本仕様と workflow outputs に情報が二重化しすぎていないか。
- spec_created close-out と実装 close-out を混同していないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 実装ガイド | completed | Part 1 / 2 必須 |
| 2 | システム仕様書更新サマリー | completed | aiworkflow sync |
| 3 | ドキュメント更新履歴 | completed | changelog |
| 4 | 未タスク検出 | completed | 0 件でも必須 |
| 5 | skill feedback | completed | 0 件でも必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| サマリー | outputs/phase-12/main.md | Phase 12 全体まとめ |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 |
| 仕様更新 | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements 同期 |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| 未タスク | outputs/phase-12/unassigned-task-detection.md | 0 件でも出力 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 改善点なしでも出力 |
| 準拠チェック | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 必須タスクの root evidence |

## 完了条件

- [x] Phase 12 必須 5 タスクがすべて完了
- [x] 必須 7 成果物がすべて配置済み
- [x] aiworkflow-requirements 反映要否が明記されている
- [x] spec_created close-out と実装 close-out の境界が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスク（5 件）が completed
- [x] 成果物が `artifacts.json` の outputs と一致

## 次Phase

- 次 Phase: 13 (PR 作成)
