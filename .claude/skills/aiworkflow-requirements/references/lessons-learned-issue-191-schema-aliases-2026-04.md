# Lessons Learned: issue-191 schema aliases closeout（2026-04）

## L-I191-001: docs-only closeout still needs canonical spec sync

`spec_created / docs_only` の task でも、正本仕様に stale な「未解決事項」が残る場合は Phase 12 で更新する。issue-191 では `database-implementation-core.md` に `schema_aliases` 契約を反映した。

## L-I191-002: endpoint compatibility and write-target change are separate decisions

07b の既存 endpoint `POST /admin/schema/aliases` は維持し、内部書き込み先だけを `schema_questions.stableKey` direct update から `schema_aliases` INSERT へ変更する。route 名変更を設計改善として混ぜると下流 contract test と UI wiring が分岐する。

## L-I191-003: detected follow-ups must be materialized

Phase 12 の unassigned-task-detection に A/B/C を書くだけでは追跡できない。実装本体、fallback 廃止、direct update guard は個別の `docs/30-workflows/unassigned-task/` ファイルとして起票する。

## L-I191-004: transient alias lookup errors must not fallback

`schemaAliasesRepository.lookup` が D1 transient error の場合、`schema_questions.stable_key` fallback へ進むと古い値を正として扱う危険がある。sync を `failed` に倒し、`sync_jobs` retry で回復する。

