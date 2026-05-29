# Phase 3: タスク分割

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 03 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-01 / Phase 1
- phase-02 / Phase 2
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## 分割方針

SRP に従い「診断 / sync policy / backfill ops」の 3 関心ごとに分離。実装サイクルでは 3 タスクとも同一サイクル内完遂対象 (CONST_007)。並列実行可能だが Task C は Task B の policy 関数に依存するため部分直列。

## Tasks

### Task A: Runtime diagnosis 強化と ops script

- **Path**: `tasks/task-a-runtime-diagnosis.md`
- **Scope**: 
  - `apps/api/src/diagnostics/forms-pipeline.ts` に `publicConsentBreakdown` / `publishStateBreakdown` / `visiblePublicCount` / `lastSuccessfulSyncAt` を追記
  - `apps/api/src/diagnostics/schema.ts` の `FormsPipelineSnapshotSchema` を同時更新
  - `apps/api/src/routes/admin/sync-diagnostics.ts` 新規（`requireSyncAdmin` で CLI 用 endpoint を提供）
  - `scripts/diagnose-members-pipeline.sh` 新規（sync-token endpoint を叩いて整形 + H1-H4 判定対応表を出力）
- **依存**: なし（並列スタート可）

### Task B: Auto-publish on consent policy

- **Path**: `tasks/task-b-auto-publish-on-consent.md`
- **Scope**:
  - `apps/api/src/lib/policies/auto-publish.ts` 新規（純関数 `decidePublishState(currentState, consent, lastUpdatedBy)`）
  - `apps/api/src/jobs/sync-forms-responses.ts` の `setConsentSnapshot` 呼び出し直後で policy 評価して publish_state を更新
  - env `MEMBERS_AUTO_PUBLISH_ON_CONSENT` を `ResponseSyncEnv` / `apps/api/src/env.ts` / `wrangler.toml [env.staging.vars]` に追加（default `"false"`、staging のみ `"true"`）
  - 追加 UPDATE 分を `writeCount` / `estimateResponseWrites` に反映
  - unit test: policy truth table 全網羅、regression test (flag=false で従来動作)
- **依存**: Task A の environment 把握（並列着手可、API 連携テストは Task A 完了後）

### Task C: Backfill ops + endpoint

- **Path**: `tasks/task-c-backfill-existing-records.md`
- **Scope**:
  - `apps/api/src/routes/admin/sync-backfill-publish-state.ts` 新規（POST、`?dryRun=true|false`、`requireSyncAdmin` 保護、`updated_by` audit）
  - `apps/api/src/lib/policies/auto-publish.ts` の `decidePublishState` を再利用
  - `scripts/backfill-publish-state.sh` 新規（`cf.sh` ラッパー経由、`--env` `--dry-run` `--apply`）
  - integration test: D1 fake で 3 ケース (default member_only → public 化 / admin 明示 hidden → 維持 / 既に public → 再更新なし)
- **依存**: Task B の `auto-publish.ts` 完了後（policy 関数を共有する）

## 完遂順序

```
Task A (diagnostic endpoint + script)  ──┐
Task B (policy + sync integration)  ─────┼── 全完了後 → staging deploy → diagnose → backfill apply → /members 確認
Task C (backfill ops, Task B の policy 関数依存)─┘
```

## 先送り判断

なし。runtime ops（H1-secrets 投入 / H2-identity backfill / H4-schema alias）は既存 CLOSED workflow が runbook を保有しており、Task A の診断結果でどれが必要か判明した時点で **その既存 runbook を本サイクル内で実行する**。新規仕様書は不要。
