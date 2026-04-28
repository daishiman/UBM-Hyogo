# Phase 12 — システム仕様更新サマリ（system-spec-update-summary）

> 本タスクは **spec_created / docs-only / NON_VISUAL**。コード変更・実インターフェース追加なし。

## 0. 概要

Phase 12 は task-specification-creator の Step 1（タスク完了記録）と Step 2（システム仕様更新）の判定・記録 Phase。本タスクは仕様書草案の確定だが、既存正本 `deployment-branch-strategy.md` の承認不要方針と差分があるため、Step 2 は `deployment-branch-strategy.md` への spec_created 追記として実施済み。

## 1. Step 1-A: 完了タスク記録（更新方針）

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| 完了日 | 2026-04-28（spec_created の確定日） |
| 状態 | spec_created |
| 種別 | docs-only / NON_VISUAL |
| 成果物総数 | 各 Phase 成果物 + Phase 12 root evidence 1 件 |
| 記録先 | `.claude/skills/aiworkflow-requirements/LOGS.md` / `deployment-branch-strategy.md` 変更履歴 / 本 Phase 12 evidence |

## 2. Step 1-B: 実装状況テーブル（spec_created）

| 項目 | 値 |
| --- | --- |
| implementation_status | `spec_created` |
| code_changes | none |
| infrastructure_changes | none（草案のみ） |
| follow_up_implementation_task | Phase 13 のユーザー承認後に別タスクとして発番 |

判定根拠: branch protection JSON / GHA YAML はいずれも草案であり、`.github/` 配下や repo settings へは未投入。

## 3. Step 1-C: 関連タスクテーブル

| 関連タスク | 関係 | 影響範囲 |
| --- | --- | --- |
| task-conflict-prevention-skill-state-redesign | auto-rebase の停止後通知を委譲 | 通知設計 |
| task-git-hooks-lefthook-and-post-merge | CI status check と hook の同名規約を共有 | ジョブ命名 |
| task-worktree-environment-isolation | CI は worktree 不可知（衝突なし） | env 隔離 |
| task-claude-code-permissions-decisive-mode | GHA 最小権限と独立に成立（衝突なし） | 権限ポリシー |

## 4. Step 2: システム仕様更新（実施済み）

| 観点 | 判定 | 根拠 |
| --- | :-: | --- |
| API スキーマ追加 / 変更 | N/A | 該当なし（apps/api 変更なし） |
| UI 仕様追加 / 変更 | N/A | NON_VISUAL |
| データモデル / D1 schema | N/A | DB 変更なし |
| 認証仕様 | N/A | Auth.js 設定変更なし |
| ブランチ戦略 / repository governance | CONDITIONAL PASS | `deployment-branch-strategy.md` に current applied（承認不要）と draft proposal（dev=1名 / main=2名レビュー、squash-only、linear history、8 required status checks）を分離して追記 |
| 不変条件追加 | N/A | CLAUDE.md §「重要な不変条件」7 項目に変化なし |

→ **Step 2 は deployment branch strategy のみ CONDITIONAL PASS**。アプリ API / UI / DB / 認証仕様は N/A。

## 5. CLAUDE.md / docs/00-getting-started-manual/ 参照更新候補

| ファイル | 更新候補 | 必須? |
| --- | --- | :-: |
| `CLAUDE.md` ブランチ戦略表 | 本草案と一致。追記不要 | × |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | 既存の承認不要方針を dev=1名 / main=2名レビュー草案へ同期 | ○（実施済み） |
| `docs/00-getting-started-manual/specs/00-overview.md` | 現行値と草案値を分離し、正本仕様への参照を追記 | ○（実施済み） |
| `docs/01-infrastructure-setup/` | 後続実装タスク発番時にリンク追加 | △（実装タスク側の責務） |

## 6. 結論

- Step 1-A / 1-B / 1-C: 本書および documentation-changelog.md に記録。
- Step 2: `deployment-branch-strategy.md` への spec_created 追記として実施済み。ただし実適用前に required status checks の実在 job 名同期が必要。
- 後続実装タスクの発番時に、本書の §3 関連タスクテーブルと `unassigned-task-detection.md` §3 current 表を引き継ぐこと。
