# Unassigned Task Detection

本タスクは `spec_created` のため、実機反映 / 検証 / 周辺整備は別タスクへ繰り出す。
0 件でも出力する規約に従い、すべての候補を明示する（[Feedback 5]）。

## 候補一覧

| # | 候補 | 出典 | 優先度 | 状態 |
| --- | --- | --- | --- | --- |
| U1 | 実 settings / `~/.zshrc` 書き換えを行う実装タスク | 本タスクのスコープ外 | HIGH | `docs/30-workflows/unassigned-task/task-claude-code-permissions-apply-001.md` |
| U2 | bypass モード下での `permissions.deny` 実効性検証 | Phase 3 残存リスク R-1 / TC-05 | HIGH | `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md` |
| U3 | project-local-first（global を触らず project 単位で適用）案の比較設計 | Phase 3 impact-analysis | HIGH | `docs/30-workflows/unassigned-task/task-claude-code-permissions-project-local-first-comparison-001.md` |
| U4 | MCP server / hook の permission 挙動検証 | Phase 3 残存リスク R-2 | MEDIUM | 未タスク化候補 |
| U5 | pre-commit hook で `cc` alias 整合 check（重複定義検出） | Phase 10 MINOR | LOW | `task-git-hooks-lefthook-and-post-merge` へ統合候補 |
| U6 | `Edit` / `Write` whitelist のスコープ限定設計（パス pattern / プロジェクト単位） | Phase 10 MINOR（格下げ登録） | LOW | `task-claude-code-permissions-apply-001` の設計入力 |
| U7 | 公式 docs URL の引用を `claude-code-config.md` に反映 | Phase 10 MINOR（格下げ登録） | LOW | `task-claude-code-permissions-apply-001` の設計入力 |

## 関連タスク差分確認

| 既存タスク候補 | 統合判断 |
| --- | --- |
| `task-claude-code-config-setup`（仮） | 重複の場合は ID 統合。現状未確認のため別タスク立てを既定とする |
| `task-git-hooks-lefthook-and-post-merge` | U5（pre-commit alias check）の実装先候補 |

## 決定事項

- HIGH 候補（U1 / U2 / U3）解消が `~/.claude/settings.json` および `~/.zshrc` への書き込み開始の前提。
- LOW 候補（U5 / U6 / U7）は別タスク化を推奨し、本タスクのスコープには戻さない。
- MEDIUM（U4）は実装タスク内で観測のみ実施し、ブロッカー化した場合に別タスクへ昇格する。

## 計上

合計 7 件 / HIGH 3 は formalized 済み / MEDIUM 1 / LOW 3 / 0 件ではない。
