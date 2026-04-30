# UT-06-FU-A-PROD-ROUTE-SECRET-001 Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| タスク種別 | docs-only / infrastructure-verification（Cloudflare Workers production migration verification runbook） |
| ワークフロー | completed（Phase 1-12 完了 / Phase 13 はユーザー承認待ち） |
| canonical task root | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| 同期日 | 2026-04-30 |
| visual classification | NON_VISUAL |
| owner | apps/web OpenNext Workers production cutover preflight |
| domain | route / custom domain / secret key parity / observability target / legacy worker disposition |
| depends_on | `ut-06-followup-A-opennext-workers-migration` / `apps/web/wrangler.toml`（OpenNext Workers 形式） |
| 原典 unassigned | `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` |
| 派生 follow-up | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md`, `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` |

## Acceptance Criteria

詳細は `outputs/phase-07/ac-matrix.md` を正本とする。要点:

- production worker 名が `ubm-hyogo-web-production` に固定されている
- production route / custom domain がすべて `ubm-hyogo-web-production` を指す（route mismatch は deploy block）
- secret key 名のセット（rotation 済み key 名のみ）が新 Worker に揃っている
- Logpush / tail / observability target が新 Worker を指す
- legacy Pages / 旧 Worker の取り扱いが `retain` または `separate-approval-required` に分類されている
- runbook の手順がすべて `bash scripts/cf.sh` 経由で実行できる（`wrangler` 直叩き禁止）
- secret 値・OAuth token は記録されない（key 名と existence のみ記録）

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `outputs/phase-01/` | 要件定義 / 不変条件 / NON_VISUAL 宣言 |
| 2 | `outputs/phase-02/` | scope（route / secret / observability / legacy disposition） |
| 3 | `outputs/phase-03/` | preflight contract（VerificationResult 型 / Evidence 構造） |
| 4 | `outputs/phase-04/` | observability target design（tail / Logpush / metrics） |
| 5 | `outputs/phase-05/runbook.md` | workflow-local runbook（Cloudflare 操作・確認フロー・error handling table） |
| 6 | `outputs/phase-06/` | route / custom domain mapping 設計 |
| 7 | `outputs/phase-07/ac-matrix.md` | AC matrix |
| 8 | `outputs/phase-08/` | _shared 評価（rerunnable script 候補 → follow-up へ分離） |
| 9 | `outputs/phase-09/main.md` | 不変条件 trace / observability design 統合 |
| 10 | `outputs/phase-10/` | E2E / smoke 委譲判断（実測は別承認 operation） |
| 11 | `outputs/phase-11/` | NON_VISUAL evidence 7 ファイル（下記） |
| 12 | `outputs/phase-12/` | implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / skill-feedback-report.md / unassigned-task-detection.md / phase12-task-spec-compliance-check.md |
| 13 | `outputs/phase-13/` | user approval gate（pending） |

## Phase 11 Evidence Files（NON_VISUAL）

| Evidence | File | 目的 |
|---|---|---|
| Manual verification log | `outputs/phase-11/manual-verification-log.md` | 実測 PASS/FAIL を承認付きで記録（実測は別承認 operation） |
| Route / custom domain snapshot | `outputs/phase-11/route-snapshot.md` | route mapping snapshot |
| Secret key snapshot | `outputs/phase-11/secret-keys-snapshot.md` | key 名のみ（値は記録しない） |
| Tail sample | `outputs/phase-11/tail-sample.md` | observability target が新 Worker を指している証跡 |
| Legacy Worker disposition | `outputs/phase-11/legacy-worker-disposition.md` | `retain` / `separate-approval-required` のみ |
| Runbook walkthrough | `outputs/phase-11/runbook-walkthrough.md` | runbook 構造 PASS（実測 PASS とは独立） |
| Grep integrity check | `outputs/phase-11/grep-integrity.md` | runbook 用語 / key 名の grep 整合 |

## Runbook（正本）

- `outputs/phase-05/runbook.md`
  - production worker 名固定（`EXPECTED_WORKER = "ubm-hyogo-web-production"`）
  - 操作はすべて `bash scripts/cf.sh` 経由
  - error handling: route mismatch → deploy block / missing secret key → deploy block / secret value visible → redact, do not commit / old Worker deletion → require separate approval

## Implementation Constants

```ts
type VerificationResult = "PASS" | "FAIL" | "TBD_APPROVED_VERIFICATION";

interface WorkerPreflightEvidence {
  workerName: "ubm-hyogo-web-production";
  routeTarget: VerificationResult;
  secretKeyParity: VerificationResult;
  observabilityTarget: VerificationResult;
  legacyWorkerDisposition: "retain" | "separate-approval-required";
}
```

| Name | Value |
|---|---|
| `EXPECTED_WORKER` | `ubm-hyogo-web-production` |
| `VISUAL_EVIDENCE` | `NON_VISUAL` |
| `TASK_TYPE` | `docs-only` |

## 自走禁止項目（本タスクで実行しないこと）

| 行為 | 理由 / 分離先 |
|---|---|
| Cloudflare 状態の mutation（route 追加 / 削除、secret 追加 / rotation、Logpush 設定変更等） | 別承認 operation |
| production deploy / DNS 切替 / custom domain 切替 | UT-16 など別タスクの承認境界 |
| 旧 Worker / 旧 Pages project の削除 | `legacy-worker-disposition.md` で `separate-approval-required` 分類のみ。削除は別タスク |
| secret 値（API token / OAuth client secret / cookie secret 等）の記録・転記 | 値は記録しない。key 名のみ |
| `wrangler` 直叩き | 禁止。`bash scripts/cf.sh` ラッパー経由 |
| `wrangler login` の persistent OAuth | 禁止。1Password 経由 op run 注入を一本化 |

## Skill Feedback（Phase 12 反映）

| skill | 反映先 |
|---|---|
| task-specification-creator | `references/phase-12-documentation-guide.md`, `references/phase-12-pitfalls.md`（filename drift / NON_VISUAL infra evidence template） |
| aiworkflow-requirements | `references/deployment-cloudflare-opennext-workers.md`（workflow-local runbook ownership / preflight pointer / follow-up automation 行）+ 本 inventory + `lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` |
| automation-30 | `references/elegant-review-prompt.md`（compact evidence table 許容） |

## 関連リソース

- `references/deployment-cloudflare-opennext-workers.md`
- `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md`
- `references/task-workflow-active.md`
- `indexes/quick-reference.md`（§UT-06-FU-A Production Worker Preflight）
- `indexes/resource-map.md`（OpenNext Workers production cutover preflight 行）
- `LOGS/20260430-ut06-fu-a-prod-route-secret-close-out.md`
