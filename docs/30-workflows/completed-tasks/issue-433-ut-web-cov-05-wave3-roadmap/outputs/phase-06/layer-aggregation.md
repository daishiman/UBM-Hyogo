# Layer Aggregation

Status: `COMPLETED`

Phase 5 の `coverage-summary-{web,api,packages}.json` を file path で layer 分類し集計。`other` は `apps/api/src/{repository,jobs,middleware,sync,services,workflows,_shared,types,view-models,utils}` 等 layer 判定外の API 内部モジュール群。

| layer | files | line% | branch% | function% | uncovered files | wave-2 touched? |
| --- | --- | --- | --- | --- | --- | --- |
| admin component | 8 | 80.07 | 87.38 | 76.14 | 4 | yes (ut-web-cov-01 / 04) |
| public component | 6 | 100.00 | 100.00 | 100.00 | 0 | yes (ut-web-cov-02) |
| hook | 0 | n/a | n/a | n/a | 0 | no |
| lib | 20 | 89.54 | 89.89 | 95.29 | 3 | yes (ut-web-cov-03 / 04) |
| use-case | 10 | 95.86 | 81.86 | 90.48 | 4 | yes (ut-08a-01) |
| route handler | 29 | 87.94 | 89.63 | 88.89 | 7 | partial (ut-08a-01: public のみ) |
| shared module | (packages 集計) | shared 95.51 / integrations 100.00 | shared 86.00 / integrations 100.00 | shared 95.45 / integrations 100.00 | 0 (packages total) | no |
| other (api 内部: repository / sync / jobs / middleware / services / workflows / view-models / utils など) | 120 | 88.92 | 81.86 | 89.42 | 35 | partial |

## 分類ルール（再掲）

- `apps/web/src/components/admin/**` → admin component
- `apps/web/src/components/public/**` または `apps/web/src/app/(public)/**` → public component
- `apps/web/src/hooks/**` → hook
- `apps/web/src/lib/**` または `apps/api/src/lib/**` → lib
- `apps/api/src/use-cases/**` または `apps/web/src/use-cases/**` → use-case
- `apps/api/src/routes/**` または `apps/api/src/handlers/**` → route handler
- `packages/**/src/**` → shared module
- 上記いずれにも当たらない apps/api 内部実装 → `other`

## 観察

- public component は完全カバー（wave-2 で完走）。
- admin component は function% 76.14 が最も低く、`IdentityConflictRow.tsx` / `MembersClient.tsx` / `RequestQueuePanel.tsx` が引き下げ要因。
- `other` (API 内部) は files / uncovered が最大で wave-3 で最大の改善余地。
- use-case は line% 高いが branch% 81.86 で fallback 経路の取りこぼしあり。
- shared module は wave-2 では touch せずとも 95% 超を維持。
