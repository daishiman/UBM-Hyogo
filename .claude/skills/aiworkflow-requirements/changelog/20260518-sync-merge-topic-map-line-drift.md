# 2026-05-18 - sync-merge 後の topic-map 行ドリフト復旧

## Summary

- `dev → feature` の sync-merge で `references/task-workflow-active.md` が `merge=union` により行数増加し、`indexes/topic-map.md` の見出し L 番号と乖離する構造的事象を観測。
- `bash scripts/verify-pr-ready.sh` の `indexes:rebuild drift` gate が fail するため、`pnpm indexes:rebuild` 再生成結果を同一コミットに含めるのが正規復旧手順。
- 復旧手順を `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の失敗時対応順序に追記（§indexes:rebuild drift 項）。

## Lessons

- L-SMTMD-001: sync-merge 直後の `indexes:rebuild drift` は `topic-map.md` の見出し L 番号のみの drift である限り、再生成 → commit が常に正解。意図的な topic 構成変更ではないため diff レビューは行数差のみで完結する。
- L-SMTMD-002: `pre-push hook` で先回りブロックされる `verify-indexes-up-to-date` と同根。sync-merge を伴うブランチ更新では `pnpm indexes:rebuild` を `git merge dev` 直後に走らせる前提でフローを構築する。

## Boundary

skill reference 文書のみ。runtime / workflow / CI gate 仕様は不変。
