# Lessons learned: Issue #913 server idempotency-key persistence

`apps/api` に D1 ledger + Hono middleware で `Idempotency-Key` server-side persistence を導入し、admin mutation 全 12 route を `requireAdmin` / `adminGate` の直後に横断適用したサイクルの苦戦箇所と知見。issue-842 の [[lessons-learned-issue-842-admin-mutation-reliability-policy-2026-05]] は client 側の policy。本サイクルは server 側 ledger を分離して扱った。

## L-I913-001: UNIQUE INDEX を楽観ロックに使い、insert 失敗時は `findExistingByScope` で確定する

`(idempotency_key, request_method, request_path)` の UNIQUE INDEX を「先に insert in_flight する → SQLITE_CONSTRAINT が返れば既存 row を再 fetch」で楽観ロックとして使う。SELECT → INSERT を 2 phase に分けると Worker 並行 invocation の隙間で 2 つの in_flight row が並ぶ。pattern は `try { insertInFlight } catch IdempotencyConflictError { findExistingByScope → shouldReplay }`。D1 は per-database serial write なので楽観ロックで十分。

## L-I913-002: 5xx と non-JSON と 64KB 超は in_flight を **削除して** retry 可能に倒す

handler が成功 JSON を返した時だけ row を `completed` へ昇格させる。それ以外（5xx / non-JSON content-type / body > 64KB）は in_flight row を `deleteInFlight` で削除し、同一 key が再送されたら通常 handler を再実行する。「保存できない＝key 占有しない」原則。`saveResult` 自体が throw した場合も同じく削除＋handler の成功レスポンスは維持する（client 視点ではまず成功体験を優先）。

## L-I913-003: query string は scope から除外、fingerprint は method + path + body の SHA-256

scope を `(key, method, path)` で UNIQUE 化し、`?cursor=...` のような付帯 query を含めない。重複判定の本体は body / method / path の SHA-256 fingerprint。`mismatch` 時は 422、`completed` 一致時は replay、`in_flight` 一致時は 409、`completed` だが TTL 切れ時は `deleteById` で再開。`shouldReplay` を pure function に切り出すと repository test だけで decision matrix が網羅できる。

## L-I913-004: TTL は env override 可、ただし不正値は default にフォールバック

`IDEMPOTENCY_TTL_SECONDS` を `apps/api/src/env.ts` の zod に optional で足し、middleware は `resolveTtlMs(raw)` で `Number.isFinite && >0` のみ採用、その他は 24h default。env 検証段階で reject しない理由は、TTL は運用 tuning パラメタで起動を阻害したくないため。env contract と middleware の両層で default fallback を持つ二重防御。

## L-I913-005: lazy GC を middleware 入口に置き、scheduled worker を増やさない

`pruneExpired(db, nowIso)` を request 処理の最初に呼ぶ lazy GC 方式。Cloudflare Workers の cron trigger / DO を増やさず、対象 row が増えても DELETE は INDEX 利用で軽い。「アクセスがあるなら掃除する／無いなら掃除不要」という Workers 流の経済性。scheduled cron は将来必要になったら追加できる open path として残す。

## L-I913-006: middleware の wiring は `requireAdmin` / `adminGate` の **後ろ** に必ず置く

admin mutation route で `requireAdmin` / `adminGate` の前に `idempotency()` を入れると、未認証 request まで D1 ledger を消費する。順序は `requireAdmin → adminGate → idempotency` 固定。`_shared.ts` で wiring helper を作り、12 route（attendance / meetings / member-status / member-notes / member-notification-pref / member-delete / schema / sync-schema / tags-queue / requests / identity-conflicts / etc.）に同じ順序で適用した。

## L-I913-007: API contract spec は D1 lane（`vitest.d1.config.ts`）で走らせる

middleware spec は MSW / DOM 不要だが、`*.contract.spec.ts` 慣行と同じく D1 binding 必要なテストは `pnpm --filter api test` の unit config では走らない。今回は middleware を pure に保ち `crypto.subtle` / `D1Database` を fake binding で注入することで unit lane に閉じた。「D1 binding が必要 vs binding を fake で済む」の境界判定を spec 着手時に決める。[[project_contract_spec_d1_lane]]

## L-I913-008: 親 workflow の "スコープ外" 宣言を独立タスクに昇格する手順

issue-842 親 workflow の Phase 2 design で `server 側永続化はスコープ外` と明示されていた gap を、`docs/30-workflows/completed-tasks/issue-842-followup-003-server-idempotency-key-persistence.md`（旧 `unassigned-task/`）経由で independent workflow `docs/30-workflows/completed-tasks/issue-913-server-idempotency-key-persistence/` に昇格させた。元 one-pager は consumed trace（`canonical_workflow_path`）を更新したうえで `completed-tasks/` 配下へ移動し、`unassigned-task/` には残さない。Phase 12 `unassigned-task-detection.md` で「新規 backlog 0、user-gated remainder」を明示する flow が再現可能。
