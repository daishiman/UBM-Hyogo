# Operation candidate inventory

audit window: 2026-04-29 〜 2026-05-03 (UTC)
data sources: git log (`git-log-window.txt` / `git-log-filtered.txt`) / docs grep (`docs-grep.txt`) / PR list (`pr-list.json`) / Actions run list (`run-list.json`) / parent workflow Phase 13 evidence。

## ledger 上の対象 operation

| op | migration | applied_at (UTC) |
| --- | --- | --- |
| OP-A | `0008_schema_alias_hardening.sql` | `2026-05-01 08:21:04` |
| OP-B | `0008_create_schema_aliases.sql` | `2026-05-01 10:59:35` |

## 候補 inventory

| candidate | source | command_evidence | approval_evidence | target_evidence | classification |
| --- | --- | --- | --- | --- | --- |
| C1: PR #364 merge → backend-ci `deploy-production` (run `25207878876`) | GitHub Actions run list (push main 2026-05-01T08:20:38Z) / `pr-list.json` PR #364 merged 2026-05-01 17:20:35 JST | `.github/workflows/backend-ci.yml` L82-91 `command: d1 migrations apply ubm-hyogo-db-prod --env production --remote` ／ run job `deploy-production` step 6 `Apply D1 migrations` conclusion=success | PR #364 GitHub PR review approval（merge 済）／ workflow `environment: production` 名義での deploy ／ git merge commit `9841e06a` | run config L90 `ubm-hyogo-db-prod --env production` ／ apply 後 ledger に `0008_schema_alias_hardening.sql` `2026-05-01 08:21:04` 記録（親 Phase 13 evidence と一致） | confirmed |
| C2: PR #365 merge → backend-ci `deploy-production` (run `25211958572`) | GitHub Actions run list (push main 2026-05-01T10:59:07Z) / `pr-list.json` PR #365 merged 2026-05-01 19:59:04 JST | 同上 workflow ／ run job `deploy-production` step 6 `Apply D1 migrations` conclusion=success | PR #365 GitHub PR review approval（merge 済）／ workflow `environment: production` 名義での deploy ／ git merge commit `2ced613d` | run config L90 ／ apply 後 ledger に `0008_create_schema_aliases.sql` `2026-05-01 10:59:35` 記録（親 Phase 13 evidence と一致） | confirmed |
| C3: 手動 `bash scripts/cf.sh d1 migrations apply` 実行 | git log 全件 / docs grep / `commands-executed.md` どこにも該当 transcript なし | none | none | none | excluded (no evidence) |
| C4: parent workflow `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 による apply | `outputs/phase-13/main.md` 本文に「per spec NO-GO clause, the workflow did not invoke `wrangler d1 migrations apply`」と明記 | none (spec NO-GO で skip) | Phase 13 user approval は 2026-05-02、ledger applied_at 2026-05-01 より後 | none | excluded (timeline 矛盾 + 本人申告 NO-GO) |

## 結論への貢献

C1 / C2 がそれぞれ OP-A / OP-B の出所として一意に特定された。コマンド・承認・対象 DB の 3 evidence すべてが揃っており、判定は `confirmed` に確定する。
