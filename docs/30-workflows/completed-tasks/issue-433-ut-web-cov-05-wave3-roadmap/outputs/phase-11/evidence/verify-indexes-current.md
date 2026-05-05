# verify-indexes Current Evidence

Status: `LOCAL_VERIFIED_PENDING_CI`

Phase 10 で `mise exec -- pnpm indexes:rebuild` を実行し、ローカルの indexes drift を解消済。

## ローカル diff

```
$ git diff --stat .claude/skills/aiworkflow-requirements/indexes/
.../aiworkflow-requirements/indexes/keywords.json  | 26 +++++++++++-----------
.../aiworkflow-requirements/indexes/topic-map.md   | 25 ++++++++++-----------
2 files changed, 25 insertions(+), 26 deletions(-)
```

drift は roadmap / outputs 新規ファイルの自然な再生成のみで、追加 25 / 削除 26 の対称的な差分。

## CI 側の確認

push / PR は本タスクスコープ外（実行制約）。CI `verify-indexes-up-to-date` の green 確認は push 後の Phase 13 で改めて取得する。

```bash
gh run list --workflow verify-indexes.yml --branch "$(git branch --show-current)" --limit 5 --json status,conclusion,headSha,url
```
