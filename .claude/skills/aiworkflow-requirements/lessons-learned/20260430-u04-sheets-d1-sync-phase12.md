# U-04 Sheets → D1 Sync Phase 12 Lessons

| ID | Lesson | Future action |
| --- | --- | --- |
| L-U04-001 | `LOGS.md` 前提は fragment 化済み skill とずれやすい。Phase 12 では `LOGS/` fragment / `_legacy.md` / workflow-local changelog のどれを使ったかを明記する。 | `system-spec-update-summary.md` に LOGS 実体判定を必ず残す |
| L-U04-002 | `topic-map.md` は generated artifact なので手編集しないが、N/A ではない。正本追記後の `generate-index.js` 実行証跡が必要。 | compliance check に generator 実行結果を記録する |
| L-U04-003 | API-only / NON_VISUAL task の Part 1 説明に `sync layer` や `evidence` が残りやすい。 | 初学者向け説明だけを技術語 grep し、同文で日常語に置き換える |
| L-U04-004 | Sheets API Service Account JWT を Workers `crypto.subtle` だけで署名する実装は、Node SDK 前提の設計から外れやすい。 | sync 系タスクでは Phase 2 に Workers 互換 auth / retry / redaction の検証項目を置く |
