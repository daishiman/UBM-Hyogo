bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
git log --all --since=2026-04-29 --until=2026-05-03 --pretty=fuller > outputs/phase-11/git-log-window.txt
git log --all --since=2026-04-29 --until=2026-05-03 --grep='schema_alias|0008|production|apply' --pretty=fuller > outputs/phase-11/git-log-filtered.txt
rg -n "0008_schema_alias_hardening|0008_create_schema_aliases|2026-05-01 08:21:04|2026-05-01 10:59:35" docs .claude/skills/aiworkflow-requirements > outputs/phase-11/docs-grep.txt
gh pr list --search "merged:2026-04-29..2026-05-03" --state merged --limit 50 --json number,title,mergedAt,mergeCommit,author,reviews > outputs/phase-11/pr-list.json
gh run list --limit 1000 --json databaseId,name,conclusion,createdAt,event,headBranch | jq '[.[] | select(.createdAt >= "2026-04-29" and .createdAt <= "2026-05-03")]' > outputs/phase-11/run-list.json
gh run view 25207878876 --json jobs
gh run view 25211958572 --json jobs
git log main --since='2026-05-01 16:00 +0900' --until='2026-05-01 21:00 +0900' --pretty='%h %ci %s'
git show 9841e06a --stat
git show 2ced613d --stat
rg -n -i "(token=|secret=|Bearer\s+[A-Za-z0-9]|cf_api|api_token=|oauth_token)" --glob '!redaction-checklist.md' outputs/
