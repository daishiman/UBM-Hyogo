# 4 Worktree Smoke Evidence（計画固定）

## NON_VISUAL / implementation の取扱

本タスクは `implementation` ワークフローのため、4 worktree smoke は **記録フォーマットの固定** までを範囲とする。実機 smoke は本仕様書を入力とする後続 implementation タスクで実行する。

## 実行手順（後続タスク向け）

```bash
for n in 1 2 3 4; do
  bash scripts/new-worktree.sh verify/a2-$n
done

for n in 1 2 3 4; do
  cd .worktrees/verify-a2-$n
  mise exec -- pnpm skill:logs:append --skill aiworkflow-requirements --type log \
    --message "smoke-${n}-$(date -u +%s)"
  git add .claude/skills/aiworkflow-requirements/LOGS
  git commit -m "smoke a2-${n}"
  git push -u origin verify/a2-${n}
  cd -
done

# main へ順次 merge して conflict 0 を確認
for n in 1 2 3 4; do
  git fetch origin verify/a2-${n}
  git merge --no-ff origin/verify/a2-${n}
done

git ls-files --unmerged   # 0 行であること
```

## 記録フォーマット

| 項目 | 記録内容 |
| ---- | -------- |
| 4 branch 名 | `verify/a2-1` 〜 `verify/a2-4` |
| 4 commit hash | 各 worktree の append commit hash |
| merge 結果 | 全 4 件 conflict 0 / `git ls-files --unmerged` 0 行 |
| render 確認 | `pnpm skill:logs:render --skill aiworkflow-requirements \| head -40` |
| 環境 | Node 24.15.0 / pnpm 10.33.2 / mise |

## 期待結果

- 4 件の fragment が `<dir>/<YYYYMMDD>-<HHMMSS>-verify-a2-<n>-<nonce>.md` として独立 path で生成
- 4-way merge で衝突 0 件
- render 出力で 4 件すべてが timestamp 降順に表示

## 失敗時の調査手順

- `git diff --name-only --diff-filter=U` で衝突 path を列挙
- 衝突発生時は path collision を疑い、nonce が一意か / branch escape が機能しているか確認
- `pnpm vitest run scripts/skill-logs-append.test.ts` の C-1 / C-3 を再実行
