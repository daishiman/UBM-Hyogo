# Skill Feedback Report

## Template Improvement

- Phase 12 docs should explicitly distinguish `implemented-local-runtime-pending` from runtime PASS. If real `apps/` code changes exist, leaving root state at `spec_created` is a close-out contradiction.

## Workflow Improvement

- KV / external resource workflows need an early user-gated operations boundary so code/spec work is not confused with Cloudflare mutation.
- Alert dedup workflows must persist dedup state only after downstream delivery succeeds, or retries after delivery failure can be suppressed.

## Documentation Improvement

- Test paths must be measured from the current worktree before being written into specs. For this task the canonical path is `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`.

## 本サイクル実装からの追加学び

- **必須 binding 追加時の型 contravariance 影響**: `Env` interface に必須プロパティを追加すると、`(env: Env) => X` を `(env: NarrowerEnv) => X` slot に渡せなくなる。spec Phase 2 で「KV 必須化」を判断した時点で、`buildFormsClient` のような既存 cross-route helper の env 型 narrowing も検討対象に含めるべき。次回 spec では「必須 binding 追加 → 関連 helper の env 型監査」を Phase 2 設計レビュー観点に含める。
- **KV stub の test-only API**: `puts` 配列観測などの test-only API は helper 側に閉じ、実装コードに漏らさない設計が再現性ある。`createKvStub` の return shape `{ kv, puts, store }` をパターン化して別タスクでも再利用可。
