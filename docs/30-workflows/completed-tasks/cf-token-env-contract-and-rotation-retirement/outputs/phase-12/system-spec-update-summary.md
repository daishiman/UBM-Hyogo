# システム仕様更新サマリ — cf-token-env-contract-and-rotation-retirement

## Step 1-A: タスク完了記録

- 本タスクは CI 失敗ログ起点（backend-ci #706 `runtime-smoke-staging / bulk-tag-runtime-smoke`）の恒久対策実装。`related_issue=null`（GitHub issue ではなく失敗ログ alias）。
- `status=implemented_local_evidence_captured / staging_runtime_pending_user_gate`。scripts / workflows / operations runbook への実変更と local verification は完了。Cloudflare token 発行・GitHub Secret 投入・実 staging smoke は user-gated。
- **同一 wave 同期済み**:
  - `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / quick-reference / resource-map / topic-map / keywords / deployment refs に、本 workflow と runtime smoke CF token contract / rotation retirement を同期済み。
  - `.claude/skills/task-specification-creator/SKILL-changelog.md` / `references/phase-template-phase1.md` / `references/patterns-testing-and-implementation.md` / `references/technical-documentation-guide.md` に、CI secret provisioning gap gate・contract gate responsibility split・runbook retirement rule を同期済み。

## Step 1-B: 実装状況テーブル

| ID | パス | 種別 | 実装状況 |
| -- | ---- | ---- | -------- |
| A1 | `scripts/smoke/provision-staging-secrets.sh` | 編集 | implemented_local_evidence_captured |
| A2 | `.github/workflows/runtime-smoke-staging.yml` | 編集 | implemented_local_evidence_captured |
| A3 | `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | 新規 | implemented_local_evidence_captured |
| A4 | `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | 新規 | implemented_local_evidence_captured |
| A5 | `.github/workflows/verify-runtime-smoke-secret-contract.yml` | 新規 | implemented_local_evidence_captured |
| B1 | `.github/workflows/cf-token-rotation-reminder.yml` | 削除 | implemented_local_evidence_captured |
| B2 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 新規 | implemented_local_evidence_captured |
| B3 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | tombstone | implemented_local_evidence_captured |
| B4 | `docs/30-workflows/operations/cf-token-rotation-log.md` | 追記 | implemented_local_evidence_captured |

- Gate-A passed（spec authoring）/ Gate-B passed（実装 + local test）/ Gate-C pending（トークン再発行 + provisioning + delivery・user-gated）。

## Step 1-C: 関連タスクテーブル

| 関連タスク | 関係 | 状態 |
| ---------- | ---- | ---- |
| `docs/30-workflows/completed-tasks/issue-1081-bulk-tag-real-d1-runtime-smoke` | 親タスク（本 smoke の導入元） | completed |
| `staging-mint-bearer-env-contract-guard`（`verify-mint-env-contract.mts` / `.yml`） | drift gate 雛形・別責務（mint env 契約 vs 全 secret 契約） | completed・本タスクで不変（AC-7） |
| `backend-ci #706 runtime-smoke-staging / bulk-tag-runtime-smoke` | 失敗ログ起点（related_issue alias） | 本タスクで真因解消（implemented_local_evidence_captured） |

## Step 2: 新規 interface 追加判定

| 判定項目 | 結論 |
| -------- | ---- |
| 新規 public API surface の追加 | **なし → Step 2 は N/A** |
| 根拠 | `verify-runtime-smoke-secret-contract.mts` の export（`SecretContractViolation` / `extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations` / `DEFAULT_EXEMPT_SECRET_RATIONALES` / `main`）は **CI 内部ツールの pure function** であり、`apps/api` / `apps/web` のランタイム公開 API surface（HTTP endpoint / IPC / preload）に該当しない。既存 `verify-mint-env-contract.mts` と同じ CI 補助スクリプト分類 |
| CI gate 一覧への追記 | **完了**: `verify-runtime-smoke-secret-contract` を CI gate 群（`verify-mint-env-contract` と並ぶ secret 契約 gate）として `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / quick-reference へ追記済み。drift gate の責務（消費 secret ⊆ provisioned ∪ documented legacy exemptions を PR 静的検査）を併記した |

## 同期判定（workflow-local sync と global skill sync を分離 — Feedback BEFORE-QUIT-003）

### workflow-local sync（本 workflow root 内）

| 対象 | 内容 |
| ---- | ---- |
| `outputs/artifacts.json` / root `artifacts.json` | implemented_local_evidence_captured・Gate-A passed を記録済（parity IDENTICAL） |
| `outputs/phase-12/*` | strict 7 を本サイクルで整備 |
| docs/30-workflows index | 本 workflow root は root / outputs artifacts と aiworkflow resource-map に `implemented_local_evidence_captured` で同期済み |

### global skill sync（`.claude/skills/task-specification-creator` 配下）

| 対象 | 内容 |
| ---- | ---- |
| LOGS / SKILL-changelog | 本 spec 作成 usage を `SKILL-changelog.md` に記録済み（CI 失敗ログ起点 spec の secret 契約要件化観点）。SKILL.md 本体昇格は curation 運用に委ね本 wave では非昇格 |
| indexes（topic-map / keywords） | `pnpm indexes:rebuild` により再生成済み。quick-reference / resource-map には runtime smoke CF token contract と rotation retirement を追記済み |
| mirror parity | `.claude/skills` ⇔ `.agents/skills` は symlink mirror のため diff 自明（IDENTICAL） |

> workflow-local sync（成果物の正本化）と global skill sync（skill 資産への学習反映）は所有が異なるため、上記のとおりブロックを分離して記録する。
