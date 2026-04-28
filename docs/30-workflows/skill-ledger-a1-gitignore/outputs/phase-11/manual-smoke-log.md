# Phase 11: 4 worktree 並列再生成 smoke 実行ログ

## ステータス: **NOT EXECUTED**

> 本ドキュメントはコマンド系列の仕様レベル固定であり、実走ログではない。
> 実走は Phase 5 実装ランブック完了後の別 PR で行う前提。
> screenshot を作らない理由: **NON_VISUAL** / **docs-only** / **spec_created** の 3 ラベルによる。

## メタ

| 項目 | 値 |
| --- | --- |
| 主証跡ソース | spec walkthrough（自動テスト件数: 0 / 実走テスト件数: 0） |
| screenshot 不要理由 | NON_VISUAL（UI 差分なし） / docs-only（仕様書のみ） / spec_created（実装は別 PR） |
| 実行日時 | N/A（NOT EXECUTED） |
| 実行者 | N/A（NOT EXECUTED） |
| 実走タイミング | Phase 5 実装ランブック完了後の別 PR |

## 実行コマンド一覧（NOT EXECUTED）

### §1: 2 worktree を新規作成

```bash
bash scripts/new-worktree.sh feat/skill-ledger-smoke-1
bash scripts/new-worktree.sh feat/skill-ledger-smoke-2
```

| 項目 | 内容 |
| --- | --- |
| 期待結果 | 2 worktree が `.worktrees/` 配下に作成され、main 同期と pnpm install が完了 |
| 実測 | NOT EXECUTED |
| ステータス | NOT EXECUTED |

### §2: 各 worktree で並列に派生物再生成

```bash
( cd .worktrees/<smoke-1> && mise exec -- pnpm indexes:rebuild ) &
PID1=$!
( cd .worktrees/<smoke-2> && mise exec -- pnpm indexes:rebuild ) &
PID2=$!
wait $PID1
RC1=$?
wait $PID2
RC2=$?
echo "rc1=$RC1 rc2=$RC2"
```

| 項目 | 内容 |
| --- | --- |
| 期待結果 | rc1=0 / rc2=0、各 worktree の `.claude/skills/*/indexes/{keywords.json,index-meta.json,*.cache.json}` と `LOGS.rendered.md` が再生成される |
| 実測 | NOT EXECUTED |
| ステータス | NOT EXECUTED |

### §3: 双方を main へ no-ff merge

```bash
git -C .worktrees/<smoke-1> checkout main
git -C .worktrees/<smoke-1> merge --no-ff feat/skill-ledger-smoke-1
git -C .worktrees/<smoke-2> checkout main
git -C .worktrees/<smoke-2> merge --no-ff feat/skill-ledger-smoke-2
```

| 項目 | 内容 |
| --- | --- |
| 期待結果 | merge コミットが 2 件成功（conflict 0） |
| 実測 | NOT EXECUTED |
| ステータス | NOT EXECUTED |

### §4: 派生物由来の conflict が 0 件であることを確認

```bash
git ls-files --unmerged | wc -l
```

| 項目 | 内容 |
| --- | --- |
| 期待結果 | `0`（派生物 4 系列 + `LOGS.rendered.md` が gitignore 済のため index 不在 → conflict 不発生） |
| 実測 | NOT EXECUTED |
| ステータス | NOT EXECUTED |

### §5: 後始末（rollback 動作確認）

```bash
# tracked に戻す（緊急時のみ）
git add -f .claude/skills/<skill>/indexes/keywords.json
git commit -m "revert(skill): re-track A-1 ledger files"
```

| 項目 | 内容 |
| --- | --- |
| 期待結果 | `git add -f` で再 track 可能、1〜2 コミット粒度でロールバック完了 |
| 実測 | NOT EXECUTED |
| ステータス | NOT EXECUTED |

## L4: 意図的 violation snippet（spec walkthrough のみ）

```bash
# わざと LOGS.md（A-2 fragment 化対象正本）を target glob に含めるケース
# .gitignore 末尾に下記を誤って追加する仮説:
#   /.claude/skills/*/LOGS.md
#
# 期待挙動: A-2 未完了下では LOGS.md が untrack され、worktree 削除や別 PR の checkout で履歴が消える
# = 「赤がちゃんと赤になる」検出が必要
```

| 項目 | 内容 |
| --- | --- |
| 期待結果（red 確認） | A-2 完了確認ゲート（Phase 3 NO-GO 条件）が triger されて実走をブロックする |
| 実測 | NOT EXECUTED（spec walkthrough で red パスが Phase 3 NO-GO 条件として機能することを確認済） |
| ステータス | spec-confirmed |

## 既知制限

| # | 制限 | 影響範囲 | 委譲先 |
| --- | --- | --- | --- |
| 1 | 本 Phase は実走しない | 実走時 race / inode 衝突 / idempotency は本ログでは検証不可 | Phase 5 実装ランブック完了後の実走 PR |
| 2 | screenshot 取得対象なし | UI 差分 0 のため検証対象が存在しない | 該当なし |
| 3 | A-2 未完了下では本 smoke の実走自体が NO-GO | A-2 fragment 化が完了するまで Phase 5 着手禁止 | A-2 タスク完了確認 |

## 完了確認

- [x] §1〜§5 のコマンド系列が網羅されている
- [x] 各セクションに「期待結果」「実測」「ステータス」記録
- [x] L4 violation 仮説の spec walkthrough 記録
- [x] 全行に NOT EXECUTED ステータスが明示されている
- [x] screenshot 不要理由（NON_VISUAL / docs-only / spec_created）明記
