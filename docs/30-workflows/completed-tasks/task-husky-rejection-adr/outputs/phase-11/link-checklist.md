# Phase 11: link-checklist.md

日付: 2026-04-28

## ADR-0001 内のリンク

| リンク先 | 種別 | 解決確認 |
| --- | --- | --- |
| `../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | 派生元 | OK |
| `../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | 派生元 | OK |
| `../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` | 派生元 | OK |
| `../../lefthook.yml` | 正本 | OK |
| `../00-getting-started-manual/lefthook-operations.md` | 正本 | OK |
| `../../CLAUDE.md` | 正本 | OK |
| `../../docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md` | 関連タスク | OK（ファイル本文ステータスは未実施） |

## doc/decisions/README.md 内のリンク

| リンク | 解決確認 |
| --- | --- |
| `./0001-git-hook-tool-selection.md` | OK |

## 派生元 → ADR の backlink

| 派生元 | リンク | 解決確認 |
| --- | --- | --- |
| `phase-2/design.md` | `../../../../../../doc/decisions/0001-git-hook-tool-selection.md` | OK |
| `phase-3/review.md` | `../../../../../../doc/decisions/0001-git-hook-tool-selection.md` | OK |

## 重複 backlink チェック

- `grep -c '0001-git-hook-tool-selection' phase-2/design.md` → 1 回のみ
- `grep -c '0001-git-hook-tool-selection' phase-3/review.md` → 1 回のみ

## 結論

全リンク解決 OK。重複なし。
