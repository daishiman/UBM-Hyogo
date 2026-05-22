# Phase 8: テスト方針

## テストカテゴリ

| カテゴリ | 対象 | 実施方法 |
|---------|------|---------|
| 構文/lint | `scripts/new-worktree.sh` | `bash -n scripts/new-worktree.sh` で syntax check |
| 統合（手動） | worktree 生成 | `bash scripts/new-worktree.sh feat/dev-flow-test-XYZ` を別dir で実行→`origin/dev` 起点を確認後、`git worktree remove` |
| 統合（CI） | dev push → staging deploy | PR マージ後、`gh run list --branch dev --workflow=backend-ci` で `deploy-staging` job が success |
| ドキュメント整合 | CLAUDE.md / diff-to-pr.md | PR 作成セクション内の `origin/main` merge と `--base main` が 0 件。ただし dev → main 昇格説明の `--base main --head dev` は許容 |

## 期待ケース

### TC-01: dev は main と同期している

```bash
git fetch origin
[ "$(git rev-parse origin/main)" = "$(git rev-parse origin/dev)" ] && echo PASS || echo FAIL
```

### TC-02: new-worktree が dev から作成

```bash
bash scripts/new-worktree.sh feat/_smoke-$$
cd .worktrees/$(ls -t .worktrees/ | head -1)
[ "$(git merge-base HEAD origin/dev)" = "$(git rev-parse origin/dev)" ] && echo PASS || echo FAIL
cd - && git worktree remove .worktrees/$(ls -t .worktrees/ | head -1) --force
```

### TC-03: dev push で staging CD job が走る

PR マージ後手動確認:

```bash
gh run list --branch dev --workflow=backend-ci --limit 1 --json conclusion,status
# 期待: conclusion=success, status=completed
```

## 不要なテスト

- unit test 追加（既存 script の分岐元置換のみで関数境界なし。`bash -n` と grep 証跡を正とする）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

テスト方針を NON_VISUAL evidence として固定する。

## 実行タスク

テストカテゴリ、期待ケース、不要なテストを整理する。

## 参照資料

Phase 11 evidence files。

## 成果物

テスト方針表。

## 完了条件

実行する検証と実行しない検証の境界が明確である。

## 統合テスト連携

Phase 11 の local smoke と Phase 13 の post-merge CD gate に接続する。
