# 未割当タスク: skill ledger hook 冪等化と並列 smoke 実走

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-hooks |
| 作成日 | 2026-04-28 |
| 起点 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/unassigned-task-detection.md |
| 種別 | implementation / infrastructure_governance / NON_VISUAL |
| 優先度 | High |
| 状態 | unassigned |

## 背景

`skill-ledger-a1-gitignore` の Phase 12 review で、A-1 の `.gitignore` / untrack 方針だけでは hook 実行時の race、部分 JSON 書き込み、4 worktree smoke の実測が未解決になることを確認した。既存の `task-skill-ledger-hooks.md` はこの worktree に存在しなかったため、本ファイルを T-6 の受け皿として作成する。

## スコープ

### 含む

- post-commit / post-merge hook が skill ledger 派生物を git index に再追加しない冪等ガード
- `pnpm indexes:rebuild` 失敗時の部分 JSON リカバリ手順
- 2 worktree 事前 smoke と 4 worktree full smoke の実走ログ
- `wait $PID` ごとの return code 個別集約
- `git ls-files --unmerged | wc -l` が 0 であることの証跡

### 含まない

- A-2 fragment 化
- A-1 `.gitignore` glob 決定そのもの
- B-1 `.gitattributes` merge driver 設定
- UI / API / D1 / Cloudflare Secret の変更

## 受入条件

- AC-1: hook は `git add`, `git stage`, `git update-index --add` を呼ばない。
- AC-2: 派生物が存在する場合は再生成をスキップし、tracked canonical を上書きしない。
- AC-3: `pnpm indexes:rebuild` が失敗した場合、部分 JSON を検出して削除または再生成できる。
- AC-4: 4 worktree 並列再生成 smoke で `git ls-files --unmerged | wc -l` が `0` になる。
- AC-5: A-2 完了前は実行しないことを gate として明記する。

## 参照

- `docs/30-workflows/skill-ledger-a1-gitignore/`
- `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md`
- `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md`
