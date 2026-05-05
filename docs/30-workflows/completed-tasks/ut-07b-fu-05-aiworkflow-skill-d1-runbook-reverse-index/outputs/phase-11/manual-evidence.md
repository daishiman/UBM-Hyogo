# Phase 11 manual evidence

## NON_VISUAL 代替証跡

| ID | 証跡 | 状態 |
| --- | --- | --- |
| G-01 | `resource-map.md` reverse-index row | captured |
| G-02 | `quick-reference.md` `bash scripts/cf.sh d1:apply-prod` row | captured |
| R-01 | `mise exec -- pnpm indexes:rebuild` | captured / exit 0 |
| R-02 | `mise exec -- pnpm indexes:rebuild` 2 回目 | captured / exit 0 |
| R-03 | `git diff --stat .claude/skills/aiworkflow-requirements/indexes` | captured / intended index diffs only |
| L4-01 | temp copy から FU-03 resource-map 行を削除して grep | captured / exit 1 red |
| B-01 | production D1 apply | not executed / user gated |

## 境界

この Phase 11 は index 整備の静的証跡のみを扱う。`bash scripts/cf.sh d1:apply-prod` の実行、production D1 mutation、commit、push、PR は Phase 13 以降のユーザー承認対象であり、本改善では実行していない。

## 実体存在確認

| Path | Result |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` | exists |
| `scripts/d1/preflight.sh` | exists |
| `scripts/d1/postcheck.sh` | exists |
| `scripts/d1/evidence.sh` | exists |
| `scripts/d1/apply-prod.sh` | exists |
| `scripts/cf.sh` | exists |
| `.github/workflows/d1-migration-verify.yml` | exists |

## Index drift snapshot

`git diff --stat .claude/skills/aiworkflow-requirements/indexes` after rebuild:

```text
quick-reference.md | 15 ++++++++++++++-
resource-map.md    |  2 +-
topic-map.md       | 16 ++++++++--------
```

`topic-map.md` の差分は `pnpm indexes:rebuild` による生成差分。2 回目 rebuild も exit 0 で、追加の実行失敗はない。
