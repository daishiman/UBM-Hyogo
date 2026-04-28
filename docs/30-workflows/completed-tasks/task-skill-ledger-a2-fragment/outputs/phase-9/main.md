# Phase 9 — 品質保証 main

## 自動チェック実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts
rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills scripts | grep -v _legacy | grep -v .backups
git grep -n 'SKILL-changelog\.md' .claude/skills/ | grep -v _legacy | grep -v .backups
diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
```

## 結果サマリー

| Q-ID | 項目 | 結果 |
| ---- | ---- | ---- |
| Q-1 | typecheck | PASS |
| Q-2 | lint | PASS |
| Q-3 | test 全件 | PASS（16/16 Green） |
| Q-4 | render 単体テスト | PASS（C-4〜C-12 + F-9〜F-11 Green） |
| Q-5 | append 単体テスト | PASS（C-1〜C-3 Green） |
| Q-6 | writer 残存 grep（LOGS.md） | **PASS** — `log_usage.js` 系 4 件を fragment writer へ切替済み |
| Q-7 | writer 残存 grep（SKILL-changelog.md） | PASS（writer 経路 0 件） |
| Q-8 | `_legacy.md` 履歴連続性 | PASS（`git mv` で rename 検出済） |
| Q-9 | path 上限 240 byte | PASS（`isWithinPathByteLimit` 単体テストで検証） |
| Q-10 | line budget（500 行未満） | PASS（各 main.md は ≤120 行） |
| Q-11 | mirror parity（.claude / .agents） | PASS（8 skills すべて diff 0） |
| Q-12 | link 整合 | PASS（main.md → 隣接ファイルの相対リンク存在確認） |
| Q-13 | artifacts.json 同期 | PASS（13 phase の outputs[] と実体が 1 対 1） |

## FAIL 詳細と差戻先

### Q-6: writer 残存（log_usage.js）

該当ファイル:
- `.claude/skills/aiworkflow-requirements/scripts/log_usage.js`
- `.claude/skills/automation-30/scripts/log_usage.js`
- `.claude/skills/github-issue-manager/scripts/log_usage.js`
- `.claude/skills/int-test-skill/scripts/log_usage.js`

対応: 本レビューで 4 件を fragment writer へ切替済み。
- 本タスクは `implementation` ワークフローで render/append helper の **新規実装と仕様書化** が範囲。
- 各 script は `LOGS/<timestamp>-<branch>-<nonce>.md` に front matter 付き fragment を生成する。

## 4 worktree smoke の取扱い

Phase 9 では単体・lint・mirror を確実に通すスコープ。実機 4 worktree smoke は Phase 11 の証跡フォーマットで扱い、最終確認では未実行リスクとして残す。

## 関連ファイル

- [`quality-gate.md`](./quality-gate.md)
