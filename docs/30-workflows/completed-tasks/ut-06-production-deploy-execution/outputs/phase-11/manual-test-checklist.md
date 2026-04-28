# Phase 11 Manual Test Checklist

| 項目 | 期待結果 | 状態 |
| --- | --- | --- |
| Web URL 200 OK | `curl -sI https://<web-url>/` が 200 を返す | pending |
| API health | `curl -s https://<api-host>/health` が healthy を返す | pending |
| D1 health | `curl -s https://<api-host>/health/db` が SELECT 成功を返す | pending |
| Workers logs | smoke test 中に ERROR / FATAL がない | pending |

