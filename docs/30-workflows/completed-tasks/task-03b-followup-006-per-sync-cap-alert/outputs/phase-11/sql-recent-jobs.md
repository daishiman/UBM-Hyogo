# sql-recent-jobs

Status: NOT RUN.

Requires staging / production D1 after user-approved deploy:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT job_id, started_at, finished_at, metrics_json FROM sync_jobs WHERE job_type='response_sync' ORDER BY started_at DESC, job_id DESC LIMIT 5"
```

