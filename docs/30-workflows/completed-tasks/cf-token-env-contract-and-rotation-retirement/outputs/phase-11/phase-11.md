# Phase 11: 手動テスト（NON_VISUAL・CI/インフラ smoke evidence ledger） — cf-token-env-contract-and-rotation-retirement

## 目的

本タスクは CI / インフラ（GitHub Actions / shell / TS verifier / runbook）の変更であり、UI 表示物の変更を一切伴わない。したがって **NON_VISUAL** と判定し、screenshot は不要・生成しない。証跡は drift gate の Vitest 実行ログ・`tsx` 実走ログ・`actionlint` / `bash -n` 出力・`provision-staging-secrets.sh` の inventory 検証出力で代替する。

## NON_VISUAL 宣言（WEEKGRD-03）

| 項目 | 値 |
| ---- | --- |
| タスク種別 | CI/インフラ（GitHub Actions / shell / TS verifier / runbook）。ui_routes 空 |
| visualEvidence | NON_VISUAL（UI 表示物の変更なし。screenshot 不要・生成禁止） |
| 非視覚的理由 | 変更対象は workflow YAML・shell script・TS pure function・docs。ブラウザ描画物が存在しない |
| 代替証跡 | drift gate Vitest / `tsx` 実走 / actionlint / `bash -n` / provisioning inventory 出力 |
| 状態語彙 | implemented_local_evidence_captured / staging_runtime_pending_user_gate |

## Phase 11 evidence file inventory

> 本タスクは implemented_local_evidence_captured。local evidence は本サイクルで生成済み。Cloudflare token 発行・GitHub environment secret mutation・実 staging smoke は user-gated のため pending のまま分離する。

| # | Classification | Path | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | drift gate unit test log | outputs/phase-11/evidence/verify-secret-contract-vitest.log | present | A4 Vitest。runtime smoke secret contract + existing mint env contract 14 tests PASS |
| 2 | drift gate 実走 log | outputs/phase-11/evidence/verify-secret-contract-run.log | present | A3 `tsx` 実走。workflow consumed secrets ⊆ provisioned secrets ∪ documented legacy exemptions を確認 |
| 3 | actionlint log | outputs/phase-11/evidence/actionlint.log | present | runtime-smoke-staging.yml / 新 CI yml の lint |
| 4 | shell syntax log | outputs/phase-11/evidence/provision-bash-n.log | present | `bash -n provision-staging-secrets.sh` |
| 5 | staging provisioning inventory | outputs/phase-11/evidence/provision-inventory.log | pending | user-gated。`provision-staging-secrets.sh` 実行後の secret inventory に CLOUDFLARE_API_TOKEN 出現 |
| 6 | staging smoke run log | outputs/phase-11/evidence/bulk-tag-smoke-staging.log | pending | user-gated。トークン投入後の `bulk-tag-runtime-smoke` green 実走証跡 |

## AC ごとの検証設計

| AC | 内容 | 検証 evidence | 現状 status |
| -- | ---- | ------------- | ----------- |
| AC-1 | provision script に CF トークン追加 + 環境登録 | #4 bash -n / #5 inventory | local PASS / staging user-gated |
| AC-2 | CF 欠落時 degrade-skip / 存在時 smoke 実走 | #1 unit / #3 actionlint / #6 smoke | local PASS / staging user-gated |
| AC-3 | STAGING_* 欠落は hard-fail 維持 | #1 unit（hard-fail matrix） | local PASS |
| AC-4 | drift gate が未 provision secret を fail-fast | #1 unit / #2 実走 | local PASS |
| AC-5 | rotation reminder 削除 + runbook 置換 | #3 actionlint（削除後 lint 対象外確認）/ docs review | local PASS |
| AC-6 | staging/production 別トークン・狭スコープ・no-expiry の runbook 記載 | docs review（B2 runbook） | local PASS |
| AC-7 | verify-mint-env-contract 不変 | focused Vitest / verifier PASS | local PASS |
| AC-8 | redaction / mask 不変・verifier は name のみ | #2 実走（値非出力）/ code review | local PASS |

## runtime evidence 取得手順（runbook 概要 / Gate ladder）

| Gate | 内容 | 取得 evidence | 承認境界 |
| ---- | ---- | ------------- | -------- |
| G0 | spec 作成（本 cycle 完了） | 本 phase-11.md / phase-12 strict 7 | 完了 |
| G1 | コード実装 + local test PASS | #1〜#4 | 完了 |
| G2 | Cloudflare 狭スコープ・no-expiry トークン発行 + 1Password 保管 | （runbook 手順） | **user-gated** |
| G3 | `provision-staging-secrets.sh` 実行で環境投入 | #5 inventory | **user-gated** |
| G4 | `bulk-tag-runtime-smoke` green 実走 | #6 smoke log | **user-gated** |
| G5 | rotation reminder 削除 + 旧トークン失効 | workflow deletion local done / CF dashboard revocation | deletion 完了・旧トークン失効は **user-gated** |

## 完了判定

- [x] CI/インフラ（ui_routes 空）と判定し NON_VISUAL 宣言・screenshot 不要を明記した。
- [x] Phase 11 evidence file inventory を Path / Status 列で固定した（local 4 件 present / runtime 2 件 pending）。
- [x] AC-1〜AC-8 ごとに検証 evidence と pending 理由（local / user-gated）を記録した。
- [x] Gate ladder G0〜G5 で user-gated 境界を明示した。
- [x] 状態語彙 implemented_local_evidence_captured / staging_runtime_pending_user_gate を採用した。
