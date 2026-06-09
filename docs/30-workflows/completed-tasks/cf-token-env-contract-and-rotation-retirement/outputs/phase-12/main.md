# Phase 12 本体: タスク要約 — cf-token-env-contract-and-rotation-retirement

## タスク要約

CI `runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` ジョブが毎回 `missing secrets ... CLOUDFLARE_API_TOKEN` で失敗していた。真因は **週次トークン失効ではなく構造ギャップ**で、provisioning 正本 `scripts/smoke/provision-staging-secrets.sh` の `SECRETS` 配列に `CLOUDFLARE_API_TOKEN` が欠落し、`staging-runtime-smoke` 環境へ未登録だったこと（env dump で `CLOUDFLARE_ACCOUNT_ID` は値あり / `CLOUDFLARE_API_TOKEN` のみ空）。

本タスクはこの真因を恒久解消する実装仕様書を Phase 1-13 で作成する。対策は次の 3 軸:

1. **投入正本への追加（A1）**: provisioning script に欠落 secret を追加。
2. **graceful degrade（A2）**: `CLOUDFLARE_API_TOKEN` 欠落時だけ hard-fail せず `::notice::` で skip。`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_ACCOUNT_ID` 欠落は従来どおり hard-fail。
3. **drift gate（A3-A5）**: workflow consumed secrets ⊆ provisioned secrets ∪ documented legacy exemptions を PR 静的検査し、未 provision を fail-fast。
4. **rotation 撤廃 + runbook（B1-B4）**: 90 日ローテーション reminder を撤廃し、非失効・最小権限・環境分離・漏洩時即時失効の provisioning/revocation runbook へ一本化。

## 成果物テーブル

| ID | パス | 種別 | 内容 |
| -- | ---- | ---- | ---- |
| A1 | `scripts/smoke/provision-staging-secrets.sh` | 編集 | `SECRETS` に `"CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"` 追加。ACCOUNT_ID は repo var で対象外 |
| A2 | `.github/workflows/runtime-smoke-staging.yml` | 編集 | `bulk-tag-runtime-smoke` を graceful degrade 化（`verify-bulk-inputs.outputs.cf_degraded=1`）。`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_ACCOUNT_ID` は hard-fail 維持・`CLOUDFLARE_API_TOKEN` 欠落のみ skip |
| A3 | `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | 新規 | pure functions（`extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations` / `DEFAULT_EXEMPT_SECRET_RATIONALES`）。workflow consumed secrets ⊆ provisioned secrets ∪ documented legacy exemptions 検査 |
| A4 | `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | 新規 | Vitest（追加前 fail / 追加後 PASS・hard-fail matrix・空 YAML / 0 件エッジ） |
| A5 | `.github/workflows/verify-runtime-smoke-secret-contract.yml` | 新規 | CI gate（`verify-mint-env-contract.yml` 雛形・PR/push トリガ） |
| B1 | `.github/workflows/cf-token-rotation-reminder.yml` | 削除 | 90 日ローテーション reminder を撤廃 |
| B2 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 新規 | 非失効・最小権限・環境分離・即時失効の発行 / 失効 runbook |
| B3 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | tombstone | 冒頭に RETIRED 注記・本文は監査履歴として保持 |
| B4 | `docs/30-workflows/operations/cf-token-rotation-log.md` | 追記 | rotation policy 撤廃・event-based revocation 移行を 1 行追記 |

## 実装対象（本実行サイクル）

- 上記 A1-A5 / B1-B4 はすべて **実装反映済**。Cloudflare token 発行・GitHub Secret 投入・実 staging smoke・commit / push / PR は user-gated。
- 実装サイクルの順序: Lane A（A1→A2→A3→A4→A5・contract 共有のため直列）→ Lane B（B1-B4・独立ファイルのため Lane A と並列可）→ Validation（actionlint / Vitest / typecheck / lint / mirror parity）。
- Cloudflare トークン再発行・1Password 保管・`provision-staging-secrets.sh` 実行・staging smoke green 実走・commit・push・PR・drift gate の required check 登録は **すべて user-gated**。

## 状態

| 項目 | 値 |
| ---- | --- |
| status | implemented_local_evidence_captured |
| workflow_state | implemented_local_evidence_captured |
| visualEvidence | NON_VISUAL |
| implementationCategory | ci-gate |
| related_issue | null（CI 失敗ログ起点: backend-ci #706 runtime-smoke-staging / bulk-tag-runtime-smoke） |
| phases 1-12 | completed |
| phase 13 | pending_user_approval |
| Gate-A | passed（spec authoring） |
| Gate-B | passed（実装 + local test） |
| Gate-C | pending（トークン再発行 + provisioning + delivery・user-gated） |
