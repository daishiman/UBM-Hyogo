# lessons-learned: 03b-followup-005 Sync Jobs Design Spec 苦戦箇所（2026-05-03）

> 対象タスク: `docs/30-workflows/03b-followup-005-sync-jobs-design-spec/`（完了後 `completed-tasks/` 配下）
> 状態: `spec_completed` / implementation / `NON_VISUAL` / verified / Issue #198 CLOSED
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection,documentation-changelog,main}.md`

03b-followup-005 sync jobs design spec は `sync_jobs` テーブルと cron job 群（RESPONSE_SYNC / SCHEMA_SYNC）の論理仕様と TS ランタイム正本を二重正本で確立した spec である。次回 dual-canonical 系（markdown spec ↔ TS schema）タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-03B-FU005-001: 二重正本 drift 防止は cross-reference 検索 + vitest schema test の二段で担保

**苦戦箇所**: `docs/30-workflows/_design/sync-jobs-spec.md`（論理正本 / 人間可読）と `apps/api/src/jobs/_shared/sync-jobs-schema.ts`（TS SSOT / runtime）を分けると、片方だけ更新されて drift が発生する古典問題に直面する。markdown だけの正本にすると runtime 側で文字列リテラルが拡散し、TS だけの正本にすると非エンジニアが読めない。

**5分解決カード**: 二重正本を許容する代わりに、`rg "_design/sync-jobs-spec"` の cross-reference 検索を CI で軽く回し、`apps/api/src/jobs/_shared/__tests__/sync-jobs-schema.test.ts` で `SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `parseMetricsJson` の値・shape を assert する。markdown 側に「TS SSOT 同期義務」セクションを必ず置き、TS 側 file header に「論理正本: `_design/sync-jobs-spec.md`」を必ず書く。これで drift は片側更新時に必ず気づく構造になる。

**promoted-to**: `task-specification-creator/references/dual-canonical-spec-pattern.md`, `aiworkflow-requirements/references/database-schema.md` (sync_jobs section の論理/TS リンク)

## L-03B-FU005-002: PII guard は metrics_json の write 側と read 側の両方で実装する

**苦戦箇所**: `sync_jobs.metrics_json` は自由形式 JSON のため、`responseEmail` や `email` 等の PII が誤って混入し得る。write 側だけで guard すると、過去データや別経路で混入したものを read 時に検知できず、API response や log に PII が leak するリスクが残る。

**5分解決カード**: `assertNoPii(metrics)` を `apps/api/src/repository/syncJobs.ts` の `succeed()` / `fail()` 書き込み前に必ず通す。同時に `parseMetricsJson()` を schema parse の中に置き、read 経路（`run()` / repository test fixture / d1-fake）でも同じ guard を通す。両側で同関数を共有することで、定義変更（PII 検知キーリストの追加）が片側だけになる事故を防ぐ。Zod の `.transform()` を schema 側に置く方式と比べ、guard を関数として独立させる方が test しやすく、key list の単一正本化に向く。

**promoted-to**: `aiworkflow-requirements/references/database-schema.md` (sync_jobs.metrics_json PII guard 二段適用), `task-specification-creator/references/pii-leak-defense-pattern.md`

## L-03B-FU005-003: lock TTL 10 分の根拠は cron 周期と実行時間の数学的余裕で固定する

**苦戦箇所**: `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`（10 分）の値が「何となく」決まっていると、cron 周期変更時や long-running job 検出時に「TTL を伸ばせばよい」と短絡し、stuck job の自動 release が機能しなくなる。

**5分解決カード**: 不等式「`実行時間 (typically < 1min)` < `TTL (10min)` < `cron 周期 (15min)`」を spec に明記する。cron が `*/15 * * * *` である限り TTL を 15 分以上にしてはならない（次回起動が同 lock を踏む）。逆に typical 実行時間より短くしてはならない（正常 job が誤って release される）。stuck job は TTL 超過 + `running` 状態で自動 release し、新規 cron 起動時に拾われる設計を堅持する。cron 周期を変更する場合は TTL も同 wave で見直す。

**promoted-to**: `aiworkflow-requirements/references/database-schema.md` (sync_jobs lock TTL 設計根拠), `task-specification-creator/references/cron-lock-ttl-design-pattern.md`

## L-03B-FU005-004: D1 DDL は本タスクに含めず物理 schema 変更は別タスクへ委譲する

**苦戦箇所**: 論理仕様（`_design/sync-jobs-spec.md`）と TS SSOT（`sync-jobs-schema.ts`）を確立する spec タスクの中で、`apps/api/migrations/` への DDL 反映まで含めようとすると、migration test / production apply / rollback 計画が一気に必要になり、spec タスクが production mutation タスクに変質する。

**5分解決カード**: 物理 schema 変更（migration SQL / D1 apply）は別タスクに委譲する。本タスクは「論理仕様 + TS SSOT + consumer 切替」までで止める。`unassigned-task-detection.md` に「sync_jobs 物理 schema follow-up」を明示記録し、Phase 12 で Issue 化候補として残す。これにより spec タスクの責務単一性が保たれ、production mutation の approval gate を spec の中で誤って引かない。

**promoted-to**: `task-specification-creator/references/spec-vs-mutation-task-separation.md`

## L-03B-FU005-005: consumer の `job_type` 文字列リテラル拡散は lint enforcement を follow-up にする

**苦戦箇所**: `cursor-store.ts` / `sync-forms-responses.ts` / `repository/syncJobs.ts` などの consumer を TS SSOT (`SYNC_JOB_TYPES.RESPONSE_SYNC` 等) 参照に切り替えても、新規ファイルや test fixture で `'response_sync'` のような string literal が再混入する余地が残る。本タスク内で lint rule を書こうとすると、03a-stablekey-literal-lint-enforcement と同じ lint 基盤導入論議に巻き込まれる。

**5分解決カード**: 本タスクでは consumer の SSOT 参照差し替えのみを完了させ、lint enforcement は明示的に follow-up として記録する。03a-stablekey-literal-lint-enforcement の standalone Node script 方式を再利用すれば、lint 基盤導入なしに enforcement が可能と spec に明記する。lint follow-up が走るまでの間、code review で `'response_sync' | 'schema_sync'` 文字列の出現を grep する運用回避策を `system-spec-update-summary.md` に書く。

**promoted-to**: `task-specification-creator/references/literal-lint-enforcement-pattern.md`, `aiworkflow-requirements/references/task-workflow-active.md` (sync_jobs literal lint follow-up)
