# Test Matrix（C-1〜C-16）

| ID | 系統 | テスト | 期待結果 | 検証コマンド |
| -- | ---- | ------ | -------- | ------------ |
| C-1 | append 衝突回避 | 同秒・同 branch で 2 件生成 | nonce 差で path 衝突 0 件 | `pnpm vitest run scripts/skill-logs-append.test.ts` |
| C-2 | append 衝突回避 | 異 branch / 異秒 | 衝突 0 件（自明） | 同上 |
| C-3 | append fail | nonce 衝突を 4 回連続注入 | `CollisionError` throw | 同上 |
| C-4 | render 出力 | fragment 0 件 | header のみ + exit 0 | `pnpm vitest run scripts/skill-logs-render.test.ts` |
| C-5 | render 出力 | fragment 1 件 | 1 件出力 + exit 0 | 同上 |
| C-6 | render 出力 | fragment N 件 | timestamp 降順 | 同上 |
| C-7 | render fail-fast | timestamp 欠損 | path を stderr + exit 1 | 同上 |
| C-8 | render fail-fast | YAML parse 不能 | path を stderr + exit 1 | 同上 |
| C-9 | render `--out` 拒否 | `--out` が `LOGS.md` | exit 2 | 同上 |
| C-10 | render legacy | window 内 `_legacy.md` | Legacy セクション末尾 | 同上 |
| C-11 | render legacy | window 外 `_legacy.md` | 出力されない | 同上 |
| C-12 | render `--since` | ISO since 以降のみ | filter + 降順 | 同上 |
| C-13 | CI guard | writer に `LOGS.md` 残存 | `git grep` ヒット ≥1 | `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills scripts` |
| C-14 | CI guard | writer に `SKILL-changelog.md` 残存 | 同上 | `git grep -n 'SKILL-changelog\.md' .claude/skills/` |
| C-15 | legacy migration | `git mv` 後の履歴連続 | `git log --follow` で旧履歴継続 | `git log --follow .claude/skills/aiworkflow-requirements/LOGS/_legacy.md` |
| C-16 | 4 worktree smoke | verify/a2-{1..4} で生成 → main 順次 merge | `git ls-files --unmerged` 0 行 | Phase 11 で実機 |

## TDD Red 状態（Phase 5 実装前）

| テスト | Red の理由 |
| ------ | ---------- |
| C-1 〜 C-12 | `scripts/skill-logs-{render,append}.ts` が未実装 |
| F-1 〜 F-11 | 同上 |
| C-13 / C-14 | writer 経路に `LOGS.md` 直接追記が残る |
| C-15 | `git mv` 未実行 |
| C-16 | Phase 11 実機 smoke 未実行 |

## targeted run

```bash
mise exec -- pnpm vitest run \
  scripts/skill-logs-render.test.ts \
  scripts/skill-logs-append.test.ts
```

## 4 worktree smoke 手順

```bash
for n in 1 2 3 4; do
  bash scripts/new-worktree.sh verify/a2-$n
done
# 各 worktree で append → main へ順次 merge → conflict 0 を確認
```
