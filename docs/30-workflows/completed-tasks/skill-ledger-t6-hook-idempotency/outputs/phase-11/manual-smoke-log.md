# manual-smoke-log — T-6 hook 冪等化 4 worktree smoke 記録

> **本ワークフローはタスク仕様書整備のみ**。実 smoke 実走と実コミットは別 PR で行う。本ファイルは実走時に書かれるべきフォーマットを定義し、NOT EXECUTED 状態で確保する。

## 1. 実行メタ（実走時に上書き）

| 項目 | 値 |
| --- | --- |
| date_utc | NOT EXECUTED |
| operator | NOT EXECUTED |
| host (uname -srm) | NOT EXECUTED |
| node -v | NOT EXECUTED |
| pnpm -v | NOT EXECUTED |
| mise -V | NOT EXECUTED |
| jq --version | NOT EXECUTED |
| base commit (`git rev-parse HEAD`) | NOT EXECUTED |
| 実 hook PR ref | NOT EXECUTED |

## 2. コマンド系列（仕様）

phase-02.md §6 と一致。実走者は以下をそのまま実行し、出力を本ファイルに転記する。

```bash
git checkout main

# (1) 4 worktree 作成
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/t6-$n; done

# (2) 並列再生成 + wait $PID 個別集約（AC-6）
pids=()
rcs=()
for n in 1 2 3 4; do
  ( cd .worktrees/verify-t6-$n && mise exec -- pnpm indexes:rebuild ) &
  pids+=("$!")
done
rc=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    rc=$?
    rcs+=("pid=$pid rc=$rc")
  fi
done
echo "failed_pids=${rcs[@]:-none}"

# (3) 部分 JSON リカバリ（lane 2）
find .worktrees/verify-t6-*/.claude/skills -name '*.json' \
  -exec sh -c 'jq -e . "$1" >/dev/null 2>&1 || rm -v "$1"' _ {} \;

# (4) merge → unmerged=0 検証（AC-4）
for n in 1 2 3 4; do git merge --no-ff verify/t6-$n; done
test "$(git ls-files --unmerged | wc -l | tr -d ' ')" = "0"
```

事前 smoke は `n` を `1 2` に縮約し同系列を 1 度実行する（AC-7）。

## 3. 2 worktree 事前 smoke（gate）

| 項目 | 値 |
| --- | --- |
| 実行コマンド | NOT EXECUTED |
| pids | NOT EXECUTED |
| return codes | NOT EXECUTED |
| 部分 JSON 検出 | NOT EXECUTED |
| 削除した JSON 一覧 | NOT EXECUTED |
| `git ls-files --unmerged \| wc -l` | NOT EXECUTED |
| 判定 | NOT EXECUTED（`unmerged=0` で PASS、それ以外 FAIL） |

## 4. 4 worktree full smoke

| 項目 | 値 |
| --- | --- |
| 実行コマンド | NOT EXECUTED |
| pids[] | NOT EXECUTED |
| return codes[] | NOT EXECUTED |
| failed_pids 出力 | NOT EXECUTED |
| 部分 JSON 検出 | NOT EXECUTED |
| 削除した JSON 一覧 | NOT EXECUTED |
| merge 順序 | NOT EXECUTED |
| 各 merge の `git status` | NOT EXECUTED |
| `git ls-files --unmerged \| wc -l` | NOT EXECUTED |
| 所要秒 | NOT EXECUTED |
| 判定 | NOT EXECUTED |

## 5. 部分 JSON リカバリ実走

| 項目 | 値 |
| --- | --- |
| 検出ファイル数 | NOT EXECUTED |
| 削除 → 再 `pnpm indexes:rebuild` 結果 | NOT EXECUTED |
| 再生成後 `jq -e .` 全 PASS か | NOT EXECUTED |

## 6. ログ末尾

| 項目 | 値 |
| --- | --- |
| 終了時刻 (UTC) | NOT EXECUTED |
| 結論 | NOT EXECUTED（PASS / FAIL） |
| 後続フェーズ | Phase 12（PASS 時） / Phase 6 or 9（FAIL 時） |
