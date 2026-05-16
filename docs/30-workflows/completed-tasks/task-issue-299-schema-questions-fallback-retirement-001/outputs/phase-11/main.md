# Phase 11 main

## Summary

GO 判定: 2026-05-15 16:00 JST (07:00 UTC) 帯に production / staging 両方の alias coverage SQL を実行し、両方とも 0 件であることを確認したうえで `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` 内の `schema_questions.stable_key` SELECT fallback を削除した。`resolve-stable-key.spec.ts` の "fallback" ケースを "fallback retired" セマンティクス（alias miss + known miss → `source='unknown'`）へ書き換え、focused unit test 6/6 PASS、`tsc -p apps/api` PASS、static guard で対象ファイルから fallback SELECT 文字列が 0 件であることを確認した。

## Evidence Index

| Evidence | Path | Status |
| --- | --- | --- |
| API tests (focused) | [test-results.md](test-results.md) | PASS (6/6) |
| production alias coverage | [coverage-evidence.md](coverage-evidence.md) | 0 rows |
| staging alias coverage | [coverage-evidence.md](coverage-evidence.md) | 0 rows (production D1 と同一バインディング) |
| 03a sync log / metric | [sync-log-evidence.md](sync-log-evidence.md) | acquisition_unavailable + 理由記録 |
| static guard | [static-guard.md](static-guard.md) | 0 hits in target file |
| code diff | [diff-evidence.md](diff-evidence.md) | unified diff 147 行 |

## Boundary

- Issue #299 state は open のまま維持（ユーザー指示）。
- commit / push / PR は Phase 13 ユーザー承認後にのみ実行する。本 Phase 11 はローカル実装完了と evidence 整備までを示す。
