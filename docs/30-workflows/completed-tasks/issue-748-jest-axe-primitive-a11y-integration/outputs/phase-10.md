# Phase 10 — ロールバック・撤退条件

[実装区分: 実装仕様書]

## 10.1 ロールバック手順

PR がマージ後に CI / dev で問題が出た場合:

```bash
git revert <merge-commit-sha>
git push origin dev
```

production への影響は無いため hot rollback は不要。

## 10.2 撤退条件

| 条件 | 対応 |
| --- | --- |
| axe-core が jsdom で恒常的に SEGV / hang する | T1 で導入した `axe.ts` を削除し、`describe.each` ブロックを skip。issue を再 open して Playwright axe に移行 |
| 5 primitive の color-contrast 違反が disable では収まらない別 rule で大量噴出 | rule baseline を見直し、それでも収束しなければ revert |
| test 時間が +5 秒以上に膨らむ | rule subset をさらに縮小、それでもダメなら primitive ごとに `.skip` |

## 10.3 部分撤退

- 共有 `axe.ts` は残し、特定 primitive ケースのみ `.skip` する形で部分撤退可能。
