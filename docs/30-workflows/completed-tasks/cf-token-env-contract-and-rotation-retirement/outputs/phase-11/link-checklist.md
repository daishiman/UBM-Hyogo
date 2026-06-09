# Phase 11 link checklist — cf-token-env-contract-and-rotation-retirement

仕様書内の参照リンク・パスの実在確認チェックリスト（implemented_local_evidence_captured 段階で確認可能なものを対象）。

| # | 参照 | 種別 | 実在 |
| --- | --- | --- | --- |
| 1 | `scripts/smoke/provision-staging-secrets.sh` | 実装対象（編集） | あり（既存） |
| 2 | `.github/workflows/runtime-smoke-staging.yml` | 実装対象（編集） | あり（既存） |
| 3 | `.github/workflows/verify-mint-env-contract.yml` | 再利用雛形 | あり（既存） |
| 4 | `scripts/smoke/verify-mint-env-contract.mts` | 再利用参照 | あり（既存） |
| 5 | `scripts/smoke/runtime-tag-bulk.sh` | 依存 runner | あり（既存） |
| 6 | `.github/workflows/cf-token-rotation-reminder.yml` | 削除対象（B1） | 削除済 |
| 7 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | tombstone 対象（B3） | あり |
| 8 | `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | 新規（A3） | あり |
| 9 | `.github/workflows/verify-runtime-smoke-secret-contract.yml` | 新規（A5） | あり |
| 10 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 新規（B2） | あり |

> #8〜#10 は本タスクで新規作成済み。
