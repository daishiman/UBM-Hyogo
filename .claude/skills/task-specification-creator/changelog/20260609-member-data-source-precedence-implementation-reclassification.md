# 2026-06-09 member data source precedence implementation reclassification

`member-data-source-precedence-and-profile-session-fix` の automation-30 close-out を反映。

- Phase 5/metadata が具体的な `apps/` / `packages/` / migration 実装対象を列挙し、同一サイクルで安全に編集・検証できる場合、`spec_created` で閉じない。
- VISUAL screenshot が staging/auth/D1 apply を必要として user-gated でも、ローカル実装・typecheck・focused tests は `implemented_local_runtime_pending` へ昇格する。
- system specs と aiworkflow ledgers は実装と同一 wave で同期する。
