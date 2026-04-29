# システム仕様更新サマリー — UT-GOV-001

> Step 1-A / 1-B / 1-C 全件 REQUIRED + Step 2 REQUIRED 判定。
> aiworkflow-requirements 仕様への反映: CLAUDE.md ブランチ戦略章 / `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`。

## Step 1-A: 完了タスク記録 + 関連 doc リンク + LOGS.md×2 + topic-map（REQUIRED）

| 同期対象 | 記述内容 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | UT-GOV-001 Phase 1〜13 を `spec_created` 行として追記。Phase 1〜3 = `completed` / Phase 4〜13 = `pending`。実 PUT は Phase 13 ユーザー承認後の別オペレーション | 実施済 |
| `.claude/skills/task-specification-creator/LOGS.md` | NON_VISUAL Phase 11 代替 evidence プレイブック適用例（github_governance / branch protection apply）として 1 行追記 | 実施済 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | governance / branch strategy トピックに UT-GOV-001 反映済み reference 見出しを同期 | 実施済（generate-index） |
| `CLAUDE.md` ブランチ戦略章 | 「solo 運用ポリシー（`required_pull_request_reviews=null`）」が GitHub 実値と drift しないことを `gh api` GET + grep で検証する旨の注記を **追記**（既存記述は変更しない） | 実施済 |
| 関連 doc 双方向リンク | 親タスク `task-github-governance-branch-protection` と本ワークフローの `index.md` 相互リンク | 実施済（index / related links） |

## Step 1-B: 実装状況テーブル更新（REQUIRED）

| 対象 | 更新内容 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` の governance テーブル | UT-GOV-001 行を `spec_created`（仕様書整備済 / 実 PUT は Phase 13 ユーザー承認後）に更新 | 実施済 |
| 親タスク `completed-tasks/task-github-governance-branch-protection/` の派生タスクテーブル | UT-GOV-001 は親 Phase 12 の U-1 と本 workflow index で相互追跡 | 既存リンクで充足 |

## Step 1-C: 関連タスクテーブル更新（REQUIRED）

| 対象 | 更新内容 | 状態 |
| --- | --- | --- |
| `completed-tasks/UT-GOV-002-pr-target-safety-gate-dry-run.md` | UT-GOV-001 への関連記述確認 | 既存記述あり。本レビューでは変更なし |
| `completed-tasks/UT-GOV-003-codeowners-governance-paths.md` | 同上 | 既存記述あり。本レビューでは変更なし |
| `completed-tasks/UT-GOV-004-required-status-checks-context-sync.md` | UT-GOV-001 上流前提として明記（5 重明記の 5 箇所目） | 既存記述あり。Phase 1/2/3/11/12 でも明記 |
| `completed-tasks/UT-GOV-005`〜`UT-GOV-007` | UT-GOV-001 への関連記述確認 | 既存記述あり。本レビューでは変更なし |

> **UT-GOV-004 完了前提の 5 重明記（5 箇所目）**: Phase 1（要件定義）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）/ Phase 11 STEP 0（再掲）/ 本サマリ Step 1-C で 5 重明記済み。

## Step 1-A/1-B/1-C 判定込み総括

| Step | 判定 | 適用範囲 |
| --- | --- | --- |
| Step 1-A | REQUIRED | 完了タスク記録 + LOGS.md×2 + topic-map + CLAUDE.md 注記追加 + 双方向リンク |
| Step 1-B | REQUIRED | governance テーブル `spec_created` 更新 |
| Step 1-C | REQUIRED | UT-GOV-002〜007 双方向リンク + UT-GOV-004 上流前提再掲 |

`spec_created` ステータスでも N/A 不可（Phase 12 spec §「`spec_created` UI task の Phase 12 close-out ルール」に準拠）。

## Step 2: aiworkflow-requirements 仕様更新 = REQUIRED

### REQUIRED 判定根拠

本タスクは GitHub branch protection の実適用値を扱うため、`aiworkflow-requirements` の正本仕様である `deployment-branch-strategy.md` と整合させる必要がある。既存正本には 2026-04-28 草案として `dev=1名 / main=2名` のレビュー要件が残っている一方、本 workflow は solo 運用ポリシーとして `required_pull_request_reviews=null` を採用する。これは運用値の衝突であり、Step 2 は REQUIRED と判定する。

### 更新対象

| 対象 | 更新内容 | 理由 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | UT-GOV-001 適用値として `required_pull_request_reviews=null` / `required_status_checks.contexts` は UT-GOV-004 積集合のみ / `lock_branch=false` / `enforce_admins=true` を current applied 予定値として追記 | branch protection 実値の正本 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | `generate-index.js` で再生成 | aiworkflow-requirements skill の index 同期ルール |
| `CLAUDE.md` | GitHub 実値が正本、CLAUDE.md は参照であることを追記 | 二重正本 drift 防止 |

### 非対象

| 確認項目 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし |
| 既存アプリ API schema の変更 | なし |
| D1 / IPC / UI 仕様の変更 | なし |
| GitHub branch protection 運用値 | あり。`deployment-branch-strategy.md` に反映必須 |

## docs-only モード適用確認

| 項目 | 適用 |
| --- | --- |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-001-github-branch-protection-apply` のみ実行（typecheck / lint / app test 対象外） |
| 実コード変更 | なし（タスク仕様書のみ整備） |
| 実 PUT 実行 | なし（Phase 13 ユーザー承認後の別オペレーション） |

## 関連

- Phase 12 index: [./main.md](./main.md)
- 実装ガイド: [./implementation-guide.md](./implementation-guide.md)
- 更新履歴: [./documentation-changelog.md](./documentation-changelog.md)
- 親仕様: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)
