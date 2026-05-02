# S1 main 昇格 evidence (AC-2)

実行日時: 2026-05-02 22:00 JST (approx)

```
$ git fetch origin main
From https://github.com/daishiman/UBM-Hyogo
 * branch              main       -> FETCH_HEAD

$ git rev-parse origin/main
ac1dd37bd3bdfedfb233932a2a6957fd75cb2d59

$ git log origin/main -1 --pretty=format:'%H %s%n%an %ad' --date=iso
ac1dd37bd3bdfedfb233932a2a6957fd75cb2d59 Merge pull request #421 from daishiman/docs/issue-346-08a-canonical-workflow-tree-restore-task-spec
daishiman 2026-05-02 21:22:03 +0900
```

`origin/main` head: `ac1dd37bd3bdfedfb233932a2a6957fd75cb2d59`

## 注意

本ブランチ (`docs/issue-353-09c-production-deploy-execution-spec`) はまだ main に merge されていない。本タスクの spec PR を merge してから Phase 6 以降を実行する場合、deploy 対象 commit は **merge 後の origin/main** になる (現在の `ac1dd37b` ではない)。

[DRY-RUN] 2026-05-02T22:00:34+09:00
