# Artifact Inventory: CI Runtime Smoke Staging Secrets Recovery

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` |
| state | `runtime_pending` / `implemented_local_evidence_captured` / verdict `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| task classification | `NON_VISUAL` / `implementation` / `existing-hardening` |
| predecessor | `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/`（task-02 runtime smoke secret provisioning） |
| parent workflow | none（前タスク完了後の follow-up patch） |
| target scope | `.github/workflows/*.yml` 内 stale runbook 参照修正 + `scripts/ci/verify-workflow-doc-refs.sh` 新設 + actionlint scope 同期 |
| local gate | `bash scripts/ci/verify-workflow-doc-refs.sh`, `bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`, `bash -n` syntax check |
| CI gate | `.github/workflows/verify-workflow-doc-refs.yml`（push / PR で全 workflow doc-ref を gate） |
| user-gated mutation | `gh secret set ... --env staging-runtime-smoke`（5 命令）+ `gh workflow run runtime-smoke-staging.yml --ref dev` |
| Phase 11 evidence | `outputs/phase-11/evidence/{verify-workflow-doc-refs,verify-workflow-doc-refs-test,actionlint,phase12-compliance,bash-syntax}.txt` + `runtime-pending.md` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |

## Workflow YAML 変更

| Path | Change |
| --- | --- |
| `.github/workflows/runtime-smoke-staging.yml` | missing-secret エラーメッセージ内 runbook path を `completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` へ更新 |
| `.github/workflows/verify-workflow-doc-refs.yml` | **新規追加**。`scripts/ci/verify-workflow-doc-refs.sh` を CI gate 化 |
| `.github/workflows/ci.yml` | actionlint target list に `verify-workflow-doc-refs.yml` を追加 |
| `.github/workflows/incident-runbook-slack-delivery.yml` | stale doc reference を guardable 状態へ |
| `.github/workflows/pr-build-test.yml` | placeholder doc reference を guardable 状態へ |
| `.github/workflows/pr-target-safety-gate.yml` | 同上 |
| `.github/workflows/verify-indexes.yml` | 同上 |
| `.github/workflows/verify-test-suffix.yml` | 同上 |

## Scripts

| Path | Role |
| --- | --- |
| `scripts/ci/verify-workflow-doc-refs.sh` | `.github/workflows/*.yml` 内 repository-local `docs/...md` 参照を走査し存在検証。URL / anchor-only / placeholder / `outputs/phase-N/evidence/...`（runtime artefact）は skip。exit 0=all exist / 1=missing / 2=usage error。 |
| `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | 6 TC shell test: OK / missing / URL / anchor / missing dir / real repo |

## Indexes / References 同期マッピング

| 同期先 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secret inventory 5 vs early-fail 4 boundary（L-CRSSSR-004）と runtime-smoke-staging path 更新 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | actionlint scope 同期ルール（L-CRSSSR-005）と verify-workflow-doc-refs gate 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow の runtime_pending 状態と新 workflow YAML 追加時のチェックリスト |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 新 reference 2 件と workflow root 登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | runtime-smoke staging secret recovery 経路の最新化 |
| `.claude/skills/aiworkflow-requirements/changelog/20260515-ci-runtime-smoke-staging-secrets-recovery.md` | 本タスクの changelog エントリ |

## Invariants

- workflow YAML 内の repository-local `docs/...md` 参照は `verify-workflow-doc-refs` gate を通過すること。
- `outputs/phase-N/evidence/...` を YAML 内で参照する場合は runtime-generated artefact として doc-ref guard の skip 対象になる範囲のみ。
- secret inventory（provisioning 5）と smoke pre-flight early-fail（4）と Slack post guard（1）の三層 boundary を `implementation-guide.md#secret-boundary` に明記し続ける。
- secret 値そのものは doc / log / commit / artefact に絶対に残さない（user-gate mutation のみで GitHub Environment に直接投入）。
- `ci.yml` actionlint target list は新 workflow 追加時に同一 PR で更新する。

## Scope Out

- backend-ci / web-cd 経路の secret name 変更（`CLOUDFLARE_API_TOKEN` 系は L-CIPR-007 / L-CIPR-007A の確立済み境界を踏襲）。
- D1 schema / Google Form 仕様への影響なし。
- 既存 smoke business logic（HTTP call 部）の変更なし。

## Lessons / Genealogy

- 系譜: task-02 runtime smoke secret provisioning (`completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/`) → 本タスク（path drift patch + doc-ref guard 新設 / 2026-05-15）。
- lessons-learned: `lessons-learned-ci-runtime-smoke-staging-secrets-recovery-2026-05.md`（L-CRSSSR-001..005）
- 上位 lessons: `lessons-learned-ci-pipeline-recovery-2026-05.md` L-CIPR-006 / L-CIPR-008 / L-CIPR-009 が secret pre-flight / Environment naming / smoke gate の正本。
- legacy register: `legacy-ordinal-family-register.md`（`completed-tasks/` 移動運用との接続点）。
