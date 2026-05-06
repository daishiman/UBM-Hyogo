# Skill Feedback Report

## テンプレ改善

なし。既存 task-specification-creator の Phase 12 strict 7 files、NON_VISUAL evidence、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 境界語彙で扱える。

## ワークフロー改善

あり。Issue #401 review で、実装着手後も artifacts が `spec_created / not_started` のまま残る drift、Phase 11 declared evidence の placeholder 欠落、mail config readiness の claim 前 gate 不足を検出した。task-specification-creator 側へは「implemented-local reclassification」「NON_VISUAL per-evidence pending placeholder」「external provider config 不備時は queue を mutate しない」を次回テンプレ改善候補として戻す。

## ドキュメント改善

なし。aiworkflow-requirements には 05b-A env 正本、04b admin request resolve、D1 / cron 境界が既に存在し、それに対象仕様書を同期した。

## Routing

| Item | Routing | Evidence |
| --- | --- | --- |
| outputs 実体欠落 | workflow fix | `outputs/phase-*` |
| env drift | workflow + aiworkflow sync | `phase-02.md`, `phase-06.md`, quick-reference |
| retry state machine | workflow fix | `phase-02.md`, `phase-05.md`, `phase-07.md` |
| recipient lookup | workflow fix | `phase-02.md`, `phase-05.md` |
| cron integration | workflow fix | `phase-02.md`, `phase-06.md` |
| mail config readiness | code + docs fix | `apps/api/src/index.ts`, `notification-mail-config.test.ts`, implementation guide |
| stale dispatching recovery | code + tests fix | `notificationOutbox.ts`, `notificationDispatchTick.test.ts` |
| provider error redaction | code + tests fix | `dispatcher.ts`, `dispatcher.test.ts` |
