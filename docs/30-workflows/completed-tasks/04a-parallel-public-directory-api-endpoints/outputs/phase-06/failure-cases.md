# Phase 6 — Failure cases (F-1〜F-22)

| # | シナリオ | 期待挙動 | 関連不変条件 / AC | 検出手段 | 実装上の根拠 |
| --- | --- | --- | --- | --- | --- |
| F-1 | `/public/members/:memberId` で `publicConsent != 'consented'` の memberId | 404 + `{ code: 'UBM-1404' }`、本文に member 情報を含めない | #2 / #11 / AC-4 | leak test | `existsPublicMember` が false → throw `ApiError UBM-1404` |
| F-2 | `publishState in ('member_only','hidden','private')` の memberId | 404 | #11 / AC-4 | leak test | 同上 (where に publish_state='public') |
| F-3 | `is_deleted = 1` の memberId | 404 | #11 / AC-4 | leak test | 同上 (where に is_deleted=0) |
| F-4 | 存在しない memberId | 404 | #11 / AC-4 | contract test | 同上 |
| F-5 | `?zone=invalid` 等の不正 enum | 200 + zone fallback | AC-6 | unit test | `parsePublicMemberQuery` zone は string default `"all"`、後段 use-case で post-filter |
| F-6 | `?sort=__proto__` | 200 + sort fallback `recent` | AC-6 | unit test ✓ | `SortZ.catch("recent")` |
| F-7 | `?limit=10000` | 200 + limit clamp 100 | AC-11 | unit test ✓ | `clampLimit` |
| F-8 | `?tag=ai&tag=dx&tag=ai` | 200 + 内部 distinct + tag AND | AC-5 | integration / unit ✓ | `dedup(data.tags)` + repo `HAVING COUNT(DISTINCT code) = N` |
| F-9 | `?q=' OR 1=1 --` SQL injection | 200 + prepared statement | - | injection test | `db.prepare(sql).bind(q)` のみ |
| F-10 | `?q=` に 1000 文字超 | 200 + 200 文字 truncate | - | unit test ✓ | `truncateQ` |
| F-11 | `current_response_id` が null の適格 member | 404 | #1 / #11 | integration test | `members` view が response join を要求 |
| F-12 | `schema_versions` が未投入 | `/public/form-preview` 503 (`UBM-5500`) — schema sync 未完了の明示エラー | #1 / #14 | integration test | `getLatestVersion` null → throw |
| F-13 | `sync_jobs` が 0 行 | `lastSync = 'never'` | AC-7 | unit test ✓ | `mapJobStatus(null)` |
| F-14 | `sync_jobs` の最新が `failed` | `lastSync = 'failed'` | AC-7 | unit test ✓ | `mapJobStatus` |
| F-15 | `sync_jobs` の最新が `running` | `lastSync = 'running'` | AC-7 | unit test ✓ | `mapJobStatus` |
| F-16 | converter で leak key 混入 | zod parse fail → 500 | #11 | leak test ✓ | `.strict()` + runtime delete |
| F-17 | D1 が一時障害 | ApiError → 500 (`UBM-9999`) | - | integration test | error-handler middleware |
| F-18 | members 0 件 page | 200 + `items: []`, `total: 0` | - | contract test | repo は LIMIT/OFFSET で 0 件返却 |
| F-19 | profile の field 0 件 | 200 + `publicSections: []` | #1 | integration test | converter は空 sectionMap で `[]` |
| F-20 | `responderUrl` env 不在 | 固定 URL fallback | #14 | unit test | `FALLBACK_RESPONDER_URL` |
| F-21 | response 1MB 超 | Workers gzip 自動 | AC-12 | manual smoke | 実装は何もしない |
| F-22 | OPTIONS preflight | Hono 既定応答 | AC-9 | integration test | public router に CORS middleware 不挿入 |

## 7 カテゴリ網羅確認

- 404: F-1 / F-2 / F-3 / F-4 / F-11
- 422 fallback: F-5 / F-6 / F-7 / F-10
- 5xx: F-12 / F-16 / F-17
- 不正 query: F-5 / F-6 / F-8 / F-9
- 同期遅延: F-11 / F-13 / F-14 / F-15 / F-19 / F-20
- leak: F-1 / F-2 / F-3 / F-16
- injection: F-9
