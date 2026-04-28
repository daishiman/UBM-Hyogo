# task-aiworkflow-worktree-index-guard

| 項目 | 内容 |
| --- | --- |
| status | detected |
| detected_in | task-worktree-environment-isolation |
| priority | low |
| owner_candidate | aiworkflow-requirements maintenance |

## Why

worktree isolation の仕様は development guidelines と lessons learned に反映済みだが、aiworkflow-requirements の generated index は再生成や merge で drift する可能性がある。

## What

- `keywords.json` / `topic-map.md` / `resource-map.md` に worktree isolation 導線が残ることを検証する。
- `generate-index.js` 実行後に literal link が消えていないか確認する。
- drift 検出を Phase 12 チェックへ組み込む。

## Acceptance Criteria

- `worktree-isolation` / `tmux-session-scoped-env` / `gwt-auto-lock` が検索可能である。
- `development-guidelines-core.md` と `development-guidelines-details.md` への導線が index に残る。
- 再生成後の diff が意図した index 更新だけである。

## References

- `.claude/skills/aiworkflow-requirements/scripts/generate-index.js`
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/system-spec-update-summary.md`
