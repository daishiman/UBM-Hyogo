# Phase 12 Main — staging-mint-bearer-env-contract-guard

## タスク要約

TASK-STAGING-MINT-BEARER-ENV-CONTRACT-GUARD-001「staging runtime smoke の mint env 契約 drift 再発防止」の実装仕様書。`bulk-tag-runtime-smoke` job が admin-only にもかかわらず `mint-staging-bearers.mts` が常に admin+me 両方の env を必須化するため、ME 系 env 欠落で `exit 2` し CI 全体が止まる drift（RC-1/RC-2）と、`provision-staging-secrets.sh` が旧 static-bearer 集合のみ provision し JWT-mint 集合と乖離する drift（RC-3）を解消する。

4 対策を確定した: **A** mint script の role-scoping（`--roles admin|me|admin,me`・既定 `admin,me` で後方互換）で要求 env を role 単位に分離、**B** 新規 `verify-mint-env-contract` 静的 gate で workflow step env / `--roles` / script 要求 env / provision カバー集合の drift を PR 時点で fail-fast 検出、**C** `provision-staging-secrets.sh` を JWT-mint secret 集合へ整合（旧 static-bearer は fallback 明示分離）、**D** 必須 env 不足時の degrade（warn + job skip / static fallback）を staging 限定で追加（production は hard-fail 維持）。

本サイクルは **implemented_local_evidence_captured**（仕様書作成 + 実コード実装 + focused test / actionlint 完了）。staging 実走・実 secret 投入・commit/push/PR・required status check 登録は user-gated。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`・index.md）
- strict 7 outputs（本 dir）
  1. `main.md`
  2. `implementation-guide.md`
  3. `system-spec-update-summary.md`
  4. `documentation-changelog.md`
  5. `unassigned-task-detection.md`
  6. `skill-feedback-report.md`
  7. `phase12-task-spec-compliance-check.md`
- `artifacts.json`（gates: Gate-A passed / Gate-B passed / Gate-C pending）
- Phase 11 NON_VISUAL 証跡（`outputs/phase-11/phase-11.md` + `manual-test-result.md` + `evidence/*.log`）

## 実装対象（本サイクルで実装済み）

| # | 区分 | パス | 概要 |
| - | ---- | ---- | ---- |
| 1 | EDIT | `scripts/smoke/mint-staging-bearers.mts` | `MintRole` / `ROLE_REQUIRED_ENV`(export) / `COMMON_REQUIRED_ENV`(export) / `parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `MintRoleResult` / `mintStagingBearersForRoles` 追加 + `main()` を role-scoping + degrade 対応へ改修（対策 A / D）。既存 `mintStagingBearers` は無改変 |
| 2 | NEW | `scripts/smoke/verify-mint-env-contract.mts` | `MintStepDescriptor` / `ContractViolation` / `detectContractViolations` による静的 drift gate（対策 B） |
| 3 | EDIT | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` mint step に `--roles admin` + `MINT_ROLES: 'admin'` + `RUNTIME_SMOKE_MINT_DEGRADE: '1'` 配線・ME 系 secret 参照削除・degrade marker 伝播（対策 A / D） |
| 4 | NEW | `.github/workflows/verify-mint-env-contract.yml` | gate を PR / push で実行する CI（`verify-hook-integrity.yml` 構造踏襲・対策 B） |
| 5 | EDIT | `scripts/smoke/provision-staging-secrets.sh` | `SECRETS` を JWT-mint 集合へ整合・旧 static-bearer は fallback 明示分離（対策 C） |
| 6 | EDIT | `scripts/smoke/README.md` | A/B/C/D の使い方 doc |
| 7 | EDIT | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | role-scoping + degrade ケース追加 |
| 8 | NEW | `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | drift gate ケース（新規） |

> 1〜8 はすべて本サイクルで実コード化済み。本タスクは CI/script のみで `apps/*` のランタイムコードは変更しない（CLAUDE.md 不変条件 #5）。

## 状態

- workflow_state: `implemented_local_evidence_captured`（Phase 1-12 仕様作成 + 実装 + local evidence 完了 / Phase 13 = PR は user-gated）
- Gate-A: passed（spec compliance・evidence_path = `phase12-task-spec-compliance-check.md`）
- Gate-B: passed（仕様書に従ったコード実装 + focused test + actionlint 完了）
- Gate-C: pending（commit / push / PR = user-gated・Phase 13）
- related issue: なし（CI 失敗ログ起点・backend-ci の bulk-tag-runtime-smoke job failure）
- 本タスク root: active（`completed-tasks/` へ未移動・close-out 移動は実装完了後に判断）
- visualEvidence: NON_VISUAL（CI workflow / Node script / shell のみ。UI 表示物の変更なし）
