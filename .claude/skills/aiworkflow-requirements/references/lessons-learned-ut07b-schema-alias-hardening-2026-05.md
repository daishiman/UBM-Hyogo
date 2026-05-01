# UT-07B Schema Alias Hardening Lessons（2026-05）

## L-UT07B-H-001: write target replacement を上位前提にする

issue-191 で `schema_aliases` が manual alias の primary write target になった後は、07b 旧 direct update を historical baseline として扱う。hardening で `schema_questions.stable_key` を主書き込み先に戻さない。

## L-UT07B-H-002: collision は二段防御にする

repository pre-check だけでは race condition を閉じない。同一 revision / stable key / question alias の不変条件は partial unique index で物理防御し、pre-check は operator 向け error の品質を上げる役割に限定する。

## L-UT07B-H-003: retryable failure は HTTP 202 で表す

CPU budget exhausted はインフラ障害ではなく continuation state である。5xx ではなく HTTP 202 + `backfill_cpu_budget_exhausted` + `retryable=true` + `backfill.status='exhausted'` を返す。

## L-UT07B-H-004: cursor 風 contract は remaining-scan でも成立する

実 cursor を永続化しなくても、idempotent WHERE と remaining-scan により再開可能性は成立する。ただし continuation 対象は API / queue / documented operation から再発見できる必要がある。

## L-UT07B-H-005: local PASS と staging-deferred を分離する

local Miniflare D1 tests が PASS しても、10,000 行以上の Workers/D1 実測は staging credentials 前提なら `staging-deferred` と明記する。Phase 12 で runtime PASS として扱わない。
