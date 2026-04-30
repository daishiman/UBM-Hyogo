# Lessons Learned: U-UT01-08 sync enum canonicalization（status / trigger_type 統一）

> 由来: `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/`
> 完了日: 2026-04-30（spec_created close-out）
> タスク種別: docs-only-contract / NON_VISUAL / spec_created
> 出典: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `unassigned-task-detection.md` / `index.md` Decision Log

## 概要

UT-01 論理設計（4 値 status）と既存 `sync_job_logs` 実装（`running` / `success` / `admin` 含む 5 値）の enum drift を、docs-only 契約として閉じた。canonical `status` を `pending` / `in_progress` / `completed` / `failed` / `skipped`、canonical `trigger_type` を `manual` / `cron` / `backfill` に固定し、`admin` は `triggered_by='admin'` へ actor 分離。実 migration / literal rewrite / shared Zod は UT-04 / UT-09 / U-UT01-10 に委譲。GitHub Issue #262 は **CLOSED のまま** で reopen せず、PR / 仕様書リンクを comment 追記する形で履歴のみ完結させた。

## 苦戦箇所 4 件（L-UUT01-08-001〜004）

### L-UUT01-08-001: CLOSED Issue を reopen せず spec_created で履歴を完結させる判断

Issue #262 は当初 close 済だったが、契約定義の workflow としては仕様書化が必要だった。reopen するか / docs-only spec_created で完結させるか / Issue を無視するかの 3 択で迷った。

- **教訓**: governance / 既存方針追認 / docs-only 再構築のように「Issue が要求する作業は完了済 or 不要で仕様書化自体が目的」のとき、reopen せず `spec_created` で完結させる。`index.md` Decision Log に reopen しない根拠を 1 段落明記し、Issue 側へは PR / 仕様書リンクを `gh issue comment` で残して双方向リンクを維持する。
- **再発防止**: `task-specification-creator` の Phase-12 仕様 `phase-12-pitfalls.md` に「CLOSED Issue + spec_created の組み合わせは reopen せず comment 追記で履歴完結」パターンを追記すべき（skill-feedback-report 観察 1 由来）。

### L-UUT01-08-002: docs-only / spec_created で workflow_state を `completed` に書き換える誤り

Phase 12 close-out 時に `phases[].status=completed` を root `metadata.workflow_state=completed` まで波及させると、実 migration が無いのに「適用済」を主張する状態に陥る。本タスクは `metadata.workflow_state` を **永続的に `spec_created`**、`metadata.docsOnly=true`、`metadata.github_issue_state=CLOSED` のまま据え置きとした。

- **教訓**: docs-only / spec_created タスクは、root の `workflow_state` を据え置き、`phases[].status` のみ Phase 完了に応じて更新する。実装フェーズ（UT-04 migration / UT-09 sync rewrite / U-UT01-10 shared 実コミット）が別 PR で merge された段階で初めて、各実装タスク側で `implementation_ready` → `implemented` への昇格を行う。
- **再発防止**: `outputs/artifacts.json` と root `artifacts.json` の二重 ledger を Phase-12 で必ず diff 確認（Task 12-8）。

### L-UUT01-08-003: spec-created DDL 候補と impl-applied DDL の混同

`references/database-schema.md` に enum canonical set を記述する際、UT-04 が migration で適用するまでは「契約候補」であり、適用済 DDL と区別する必要がある。区別が無いと、未 migration 段階で「DDL 適用済」と誤読される。

- **教訓**: `database-schema.md` 内に「U-UT01-08 / spec_created」見出しを切り、`spec_predicted` 段階の契約と `impl_applied` 段階の DDL を視覚的に分離。`status` / `trigger_type` / shared contract の各軸ごとに **canonical set / 既存値の扱い / 実装 owner** の 3 列で記述し、owner 列で UT-04 / UT-09 / U-UT01-10 を明示する。
- **再発防止**: `aiworkflow-requirements` skill に「spec_predicted vs impl_applied の表記ルール」を `architecture-overview-core.md` 末尾の運用 section へ追加することを後続検討（skill-feedback-report 観察 2 由来）。

### L-UUT01-08-004: consumer 側 silent drift 検出を本タスクへ抱え込みかけた

`packages/shared/src/types/viewmodel/index.ts` の `schemaSync` / `responseSync`、admin UI ラベル、monitoring aggregation、audit query が `running` / `success` / `admin` を前提にしていないかの監査が、本 docs-only 契約タスクの中で発火しかけた。範囲が API / Web / shared / observability にまたがるため、抱え込むと scope 逸脱と code 変更混入のリスクが生じる。

- **教訓**: SF-03「UI spec to component」パターンに該当する consumer 側影響は `U-UT01-08-FU-01-sync-enum-consumer-audit` として未タスク分離。docs-only 契約タスクは「契約決定」と「下流実装」を厳密に分け、consumer audit は別 owner に渡す。
- **再発防止**: Phase-12 `unassigned-task-detection.md` で SF-03 4 パターンを必ず照合し、cross-surface な audit は単独 follow-up タスク化する運用を継続。

## 後続タスク参照

| follow-up | 範囲 | owner |
| --- | --- | --- |
| `U-UT01-08-FU-01` | consumer audit (UI / monitoring / aggregation / shared view model) | unassigned |
| UT-04 | D1 migration（CHECK 制約 + 既存値変換 UPDATE） | UT-04 owner |
| UT-09 | sync writer literal rewrite（`running` → `in_progress` 等） | UT-09 owner |
| U-UT01-10 | shared `SyncStatus` / `SyncTriggerType` + Zod schema | U-UT01-10 owner |
