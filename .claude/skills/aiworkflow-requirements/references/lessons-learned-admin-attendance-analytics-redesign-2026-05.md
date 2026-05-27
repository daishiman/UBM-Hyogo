# Lessons Learned: admin-attendance-analytics-redesign (2026-05)

## L-ATTN-001: local implementation と staging visual evidence を分離する

`apps/` / `packages/` / canonical spec に実装差分が入ったら `spec_created` のまま close-out しない。local tests/typecheck/lint/build がある場合は `implemented_local_runtime_pending` に昇格し、staging deploy / browser screenshot / CSV runtime download は user-gated runtime evidence として分離する。

## L-ATTN-002: API 正本更新済みのものを future 扱いに戻さない

`docs/00-getting-started-manual/specs/01-api-schema.md` に endpoint contract が反映済みなら、system-spec summary と aiworkflow `api-endpoints.md` も同じ事実へ同期する。「未実装なので API 正本未変更」と書くと implementation diff と矛盾する。

## L-ATTN-003: skill-feedback no-op は実態一致が前提

skill-feedback で template no-op と判定する場合でも、workflow state、Phase 11 evidence、dirty diff、system-spec summary が一致していることを先に確認する。no-op は「既存ルールで吸収済み」を意味し、「状態同期を省略してよい」を意味しない。

## L-ATTN-004: 500行超過は appendix へ責務分離する

Phase 仕様が 500 行を超えた場合、RCA tree / compliance detail / recovery procedure などの補助詳細を semantic appendix (`phase-2-appendix.md`, `phase-12-appendix.md`) に分離する。本文は実行入口と正本参照を残す。
