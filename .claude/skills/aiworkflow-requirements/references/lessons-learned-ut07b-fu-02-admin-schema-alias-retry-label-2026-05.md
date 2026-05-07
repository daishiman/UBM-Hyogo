# UT-07B-FU-02 Admin Schema Alias Retry Label Lessons（2026-05）

対象 workflow: `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/`（Issue #362）。
対象実装: `apps/web/src/lib/admin/api.ts` の `isSchemaAliasRetryableContinuation` predicate と `apps/web/src/components/admin/SchemaDiffPanel.tsx` の retryable continuation feedback。
API contract と D1 schema は不変。

## L-UT07B-FU02-001: HTTP 202 retryable continuation は 5 点完全合致で narrowing する

HTTP 202 を「成功 / 失敗」二分法に押し込めると、`exhausted` を generic error として誤分類してしまう。
web client では HTTP `status === 202` / `body.backfill.status === 'exhausted'` / `body.retryable === true` / `body.code === 'backfill_cpu_budget_exhausted'` / `body.mode === 'apply'` の 5 点が**完全合致**したときだけ retryable continuation として narrowing する。
predicate は `isSchemaAliasRetryableContinuation` として `apps/web/src/lib/admin/api.ts` に集約し、UI 層に条件分岐を漏らさない。

## L-UT07B-FU02-002: `confirmed=true` と `backfill.status='exhausted'` は責務を分離して UI に渡す

`confirmed` は「適用フェーズに入った（dryRun ではない）」を表し、`backfill.status` は「適用後の back-fill 状態」を表す。
両者は直交する。SchemaDiffPanel では `confirmed=true && backfill.status='exhausted'` のときに「適用は受理済み・続きから再試行可能」と表現し、`confirmed=true && backfill.status='completed'` の通常成功と区別する。1 つの bool に潰さない。

## L-UT07B-FU02-003: predicate code 不一致は generic path にフォールバックする

`code` が `backfill_cpu_budget_exhausted` 以外のときは、たとえ HTTP 202 でも retryable continuation 扱いにしない。
predicate は不一致時に `false` を返し、呼び出し側は通常の success / validation error / conflict error の generic path に戻す。これにより将来 API 側で他の retryable code が増えたときも、UI ラベル汚染を防げる。

## L-UT07B-FU02-004: 4 状態同時 override の manual screenshot は Phase 11 から分離する

200 success / 202 retryable / 422 validation / 409 conflict の 4 状態を同一 dev server で同時に再現するには、上流 API の response override が必要で、ローカル dev server だけでは再現コストが高い。
focused component evidence（Vitest 30 PASS, JUnit `outputs/phase-11/test-junit.xml`）で behavior は担保し、runtime screenshot は `VISUAL_ON_EXECUTION` として deferred に明示する。Phase 12 を runtime PASS と誤記しない。

## 適用対象

- web client から admin schema apply を呼ぶ全箇所
- 将来 retryable continuation を別 endpoint へ拡張する場合は、predicate 構造（5 点合致 + code 識別）を踏襲する
- API/D1 contract は本 lessons の責務外。contract 拡張は UT-07B 本体 / FU-01 の lessons を参照
