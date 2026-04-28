# System Spec Update Summary

本タスクは `spec_created` / `docs-only` / `NON_VISUAL`。
ランタイム / 設定ファイル / shell の実書き換えは行わず、後続の実装タスクへ引き渡す。

## Step 1-A: 完了タスク記録

| 対象 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | DevEx 衝突防止 spec wave に本タスクを追記 |
| `.claude/skills/task-specification-creator/LOGS.md` | spec normalization 履歴に本タスクを追記 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | "claude-code permissions / settings hierarchy" のエントリに本タスクの canonical path を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | canonical task root を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | cross-task order に登録（既出ならスキップ） |
| `docs/30-workflows/task-claude-code-permissions-decisive-mode/index.md` | Phase 表 / 成果物リンクが現状の outputs と整合 |

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| workflow state | `spec_created` |
| code / config 変更 | 未適用（実機反映は別タスク） |
| Phase 1〜12 | `pending`（本 Phase 12 完了で内部遷移可） |
| Phase 13 | `blocked`（`user_approval_required: true`） |

## Step 1-C: 関連タスクテーブル

| Related task | 関係 | 備考 |
| --- | --- | --- |
| `task-worktree-environment-isolation` | upstream 依存 | `depends_on` 済み |
| `task-claude-code-permissions-apply-001` | 本タスクの後続 | HIGH ブロッカー解消後に着手 |
| `task-conflict-prevention-skill-state-redesign` | cross-task 順序 | 同 wave |
| `task-git-hooks-lefthook-and-post-merge` | cross-task 順序 | pre-commit による alias 整合 check 候補 |
| `task-github-governance-branch-protection` | cross-task 順序 | `permissions.deny` の git 操作と整合 |

## Step 2: システム仕様更新方針

対象ファイル: `docs/00-getting-started-manual/claude-code-config.md`

追記方針（実装タスクで反映）:

1. **階層優先順位セクションの新設**
   - 4 階層（projectLocal > project > globalLocal > global）の表
   - 同名キーは上層が下層を完全上書き
2. **`--dangerously-skip-permissions` 併用方針**
   - `cc` alias の正準形を記載
   - settings の `defaultMode` 統一とコマンド併用の二重防壁
3. **whitelist 例**
   - `permissions.allow` / `deny` の代表例
   - `Edit` / `Write` のスコープ限定は別タスクで詳細設計
4. **公式 docs URL の引用**

| Topic | URL |
| --- | --- |
| Claude Code settings | https://docs.anthropic.com/en/docs/claude-code/settings |
| Configure permissions / deny rules | https://code.claude.com/docs/en/permissions |
| Devcontainer warning for `--dangerously-skip-permissions` | https://docs.anthropic.com/en/docs/claude-code/devcontainer |

> 新規ランタイムインターフェースの追加なし。運用ルールの追記のみ。Step 2 は本タスクで追記方針を確定し、実反映は `docs/30-workflows/unassigned-task/task-claude-code-permissions-apply-001.md` で行う。

## Artifacts Sync

- ルート `artifacts.json` と `outputs/artifacts.json` は同一内容
- `phases[*].outputs` 列挙ファイルは全て実在することを Phase 12-6 で照合
