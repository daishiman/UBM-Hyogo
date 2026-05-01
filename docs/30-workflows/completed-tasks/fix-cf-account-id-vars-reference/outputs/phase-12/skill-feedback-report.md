# Skill Feedback Report

## Feedback

- Phase 12 の説明では「5タスク」と「7ファイル」を分けて書く必要がある。
- `taskType` は canonical 値 `implementation` とし、詳細分類は `subtype` へ分離する。
- 正本仕様 drift を検出した場合、Step 2 N/A とせず更新対象を明記する。
- Phase 11 NON_VISUAL evidence のファイル名は `manual-smoke-log.md` / `manual-test-result.md` のどちらかに統一する。混在すると coverage trace が割れる。
- `actionlint` / `yamllint` がローカル未導入の場合は PASS と書かず、deferred と代替検証を同じ Phase 11 / 12 に記録する。
