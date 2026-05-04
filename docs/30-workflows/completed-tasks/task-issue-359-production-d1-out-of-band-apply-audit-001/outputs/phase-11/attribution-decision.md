# Attribution decision

Status: FINALIZED (2026-05-04)

両 migration の apply は GitHub Actions `backend-ci` workflow `deploy-production` job の `Apply D1 migrations` step が main push を契機に自動実行したことが、command / approval / target DB の 3 evidence すべてで一致した。手動実行・親 workflow による apply の可能性は排除済み（`operation-candidate-inventory.md` C3/C4）。

decision: confirmed (workflow=backend-ci/deploy-production/Apply D1 migrations, approval=PR #364 merge run id 25207878876 / PR #365 merge run id 25211958572)
