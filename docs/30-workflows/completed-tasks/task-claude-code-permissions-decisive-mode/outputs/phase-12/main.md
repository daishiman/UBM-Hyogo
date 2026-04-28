# Phase 12 Main: ドキュメント更新サマリ

## 位置付け

Phase 11 までで固定したシナリオ・チェックリスト・テンプレートを、6 種類の Phase 12 canonical 成果物として統合し、`docs/00-getting-started-manual/claude-code-config.md` への階層優先順位追記方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| taskType | docs-only |
| workflow | spec_created |
| visualEvidence | NON_VISUAL |
| 採用案 | A（全層 `defaultMode: "bypassPermissions"` 統一） |

## 6 必須成果物

| # | ファイル | 役割 |
| --- | --- | --- |
| 12-1 | `implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術詳細） |
| 12-2 | `system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2 方針 |
| 12-3 | `documentation-changelog.md` | Step 別 / sync 別の変更履歴 |
| 12-4 | `unassigned-task-detection.md` | 別タスク化候補（0 件でも出力） |
| 12-5 | `skill-feedback-report.md` | テンプレ・ワークフロー・docs 改善提案 |
| 12-6 | `phase12-task-spec-compliance-check.md` | index/artifacts 三者同期 + 6 成果物 ls 突合 |

## Phase 13 への引き渡し

- Phase 13 は `user_approval_required: true` で `blocked`
- 実装着手は別タスク（HIGH ブロッカー解消後）
- 実 `~/.claude/settings.json` および `~/.zshrc` への書き込みは本タスクでは行わない

## 採用案 A の要点

1. 3 階層（global / globalLocal / projectLocal）の `defaultMode` を `bypassPermissions` で統一
2. `cc` エイリアスに `--dangerously-skip-permissions` を併用しモード復帰事故を防止
3. `permissions.allow` / `permissions.deny` で whitelist と禁止コマンドを明示

## 関連参照

- `outputs/phase-10/final-review-result.md`（最終レビュー結果）
- `outputs/phase-11/manual-smoke-log.md`（NON_VISUAL 主証跡）
- `docs/00-getting-started-manual/claude-code-config.md`（Step 2 追記対象）
