# Post-Release Long-Term Observation - Manual Checks

## 前提

- `post-release-observation-reminder` workflow が D+7 / D+30 reminder Issue を起票している。
- production dashboard / GitHub Actions / Cloudflare D1 の read-only 確認権限がある。
- Secret 値、個人情報、URL query、IP、User-Agent、email、member ID、session token は evidence に残さない。

## 手順

1. Cloudflare dashboard の Workers Analytics で API total req/day と 5xx rate を確認する。
2. D1 reads/writes は `bash scripts/cf.sh d1 insights ubm-hyogo-db-prod --env production` 相当の read-only 手順で取得する。
3. Cron success は `gh run list --workflow=post-release-dashboard.yml --limit 14 --json conclusion,createdAt` で確認する。
4. Authz smoke は no-token `curl -i https://<api-host>/admin/me` が 401 または 403 を返すことを確認する。
5. Free plan headroom は Cloudflare dashboard の usage 値から D1 read/write と Worker request の残枠を計算する。
6. 取得値を reminder Issue の観測表へ転記し、PASS / WARN / CRIT を確定する。
7. CRITICAL または silent regression の場合は `docs/runbooks/post-release-long-term-observation.md` Section 4 へ進む。

## Evidence 保存境界

- 保存してよいもの: 集計値、判定、コマンド名、GitHub run id、redacted dashboard CSV。
- 保存しないもの: raw request/response body、URL query、IP、User-Agent、email、member ID、session token、Cloudflare/GitHub token。
