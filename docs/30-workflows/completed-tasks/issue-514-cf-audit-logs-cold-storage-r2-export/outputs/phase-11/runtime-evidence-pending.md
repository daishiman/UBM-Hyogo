# Phase 11 Runtime Evidence Pending

判定: `RUNTIME_PENDING_USER_APPROVAL`

| ID | 操作 | 取得ゲート | 取得先 evidence path | 昇格先 |
| --- | --- | --- | --- | --- |
| RP-1 | R2 binding `UBM_AUDIT_COLD_STORAGE` 登録 + deploy | G1 | `outputs/phase-13/g1-deploy-production.log` | `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` |
| RP-2 | `CF_AUDIT_R2_TOKEN_PROD` 1Password / GitHub environment secret key 名確認 | G1 | `outputs/phase-13/g1-deploy-production.log` | `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` |
| RP-3 | D1 migration `0015_add_audit_export_manifest.sql` production apply | G2 | `outputs/phase-13/g2-d1-applied-fresh-production.log` | `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` |
| RP-4 | 初回日次 export workflow_dispatch | G3-prod | `outputs/phase-13/g3-export-first-run.log` | `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` |
| RP-5 | 初回 restore drill | G3-prod after export | `outputs/phase-13/g3-export-first-run.log` | `PASS_RUNTIME_SYNCED` |
| RP-6 | secret hygiene grep | G4 before PR | `outputs/phase-11/secret-hygiene-grep.log` | `PASS_RUNTIME_SYNCED` |

実値、token preview、value hash、Bearer header、full IP、full User-Agent は evidence に保存しない。
