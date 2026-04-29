# Phase 7 — AC マトリクス main

## 目的

Phase 1 で確定した AC-1〜AC-12 を、Phase 4 verify suite と Phase 5 runbook step、Phase 6 failure case (F-1〜F-22) に一対一対応させ、抜け漏れがないことを matrix で保証する。

## 結論

- AC-1〜AC-12 すべてに verify suite と runbook step を割り当て済み。
- failure case F-1〜F-22 を AC trace に紐付け。
- GO/NO-GO 判定の入力として `ac-matrix.md` を Phase 10 に引き継ぐ。

## サマリ

| AC | 概要 | 主検証 | 実装位置 |
| --- | --- | --- | --- |
| AC-1 | `/public/stats` KPI | unit + contract | `use-cases/public/get-public-stats.ts` |
| AC-2 | zoneBreakdown / membershipBreakdown | unit + contract | `repository/publicMembers.ts` aggregate |
| AC-3 | `/public/members/:id` profile leak ゼロ | unit (leak) + contract | `view-models/public/public-member-profile-view.ts` |
| AC-4 | 不適格 404 (not 403) | leak test | `existsPublicMember` + `UBM-1404` |
| AC-5 | tag AND / page / limit | unit + integration | `parsePublicMemberQuery` + repo HAVING |
| AC-6 | 不正 query は default fallback | unit ✓ | `parsePublicMemberQuery` `.catch()` |
| AC-7 | lastSync enum mapping | unit ✓ | `mapJobStatus` |
| AC-8 | `/public/form-preview` 動的構築 | unit + integration | `get-form-preview.ts` |
| AC-9 | 認証 cookie 非依存 200 | integration | `routes/public/index.ts` (no session middleware) |
| AC-10 | 検索対象列に `responseEmail` 含めない | unit + grep | `member_responses.search_text` のみ |
| AC-11 | `limit` 1〜100 clamp | unit ✓ | `clampLimit` |
| AC-12 | response Cache-Control ポリシー | manual smoke | `routes/public/*.ts` headers |

## 完了条件チェック

- [x] AC × verify × runbook の対応表を `ac-matrix.md` に整備。
- [x] failure case F-X を AC へ trace。
- [x] 未対応 AC が無い（全 12 件 covered）。
