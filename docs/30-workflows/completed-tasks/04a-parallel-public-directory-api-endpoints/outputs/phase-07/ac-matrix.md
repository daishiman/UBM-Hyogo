# Phase 7 — AC × Verify × Runbook × Failure-case マトリクス

| AC | 概要 | verify suite | runbook step | failure case 連携 | 実装ファイル | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `/public/members` の結果に不適格 member が 0 件 | unit + repository | runbook §4 | F-1〜F-3 | `repository/publicMembers.ts` public where | done |
| AC-2 | `/public/members/:memberId` が forbidden keys を持たない `PublicMemberProfile` として parse できる | unit (leak) ✓ | runbook §5 | F-16 | `view-models/public/public-member-profile-view.ts` | done |
| AC-3 | profile の fields は `visibility='public'` のみ | unit ✓ | runbook §5 | F-19 | `visibility-filter.ts` | done |
| AC-4 | 不適格 / 不存在は 404 (not 403) で本文に存在示唆ゼロ | unit / runbook | runbook §6 | F-1〜F-4 / F-11 | `use-cases/public/get-public-member-profile.ts#existsPublicMember` → `UBM-1404` | done |
| AC-5 | `q/zone/status/tag/sort/density` と `tag` repeated AND、`page` / `limit` 動作 | unit ✓ | runbook §4 | F-7 / F-8 | `parsePublicMemberQuery` + repo `HAVING COUNT(DISTINCT) = N` | done |
| AC-6 | 不正 query (`zone / sort / density / status`) は default fallback で 200 | unit ✓ | runbook §4 | F-5 / F-6 | `parsePublicMemberQuery` `.catch()` | done |
| AC-7 | `lastSync` が `ok / running / failed / never` の enum | unit ✓ | runbook §1 | F-13 / F-14 / F-15 | `get-public-stats.ts#mapJobStatus` | done |
| AC-8 | `/public/form-preview` が `schema_questions` から動的に fields を構築し responderUrl を返す | unit ✓ | runbook §7〜§8 | F-12 / F-20 | `use-cases/public/get-form-preview.ts`, `view-models/public/form-preview-view.ts` | done |
| AC-9 | 認証 cookie の有無に関わらず response が同一 (未認証 200) | integration | runbook §0 | F-22 | `routes/public/index.ts` (session middleware 非適用) | done |
| AC-10 | 検索対象に `responseEmail` を含めない | unit + grep | runbook §4 | F-9 | `repository/publicMembers.ts` (`search_text` LIKE のみ) | done |
| AC-11 | `limit` 上限 100 / 下限 1 で clamp | unit ✓ | runbook §4 | F-7 | `parsePublicMemberQuery#clampLimit` | done |
| AC-12 | Cloudflare Workers 標準圧縮対象になり、Cache-Control は stats / form-preview = `public, max-age=60`、members / profile = `no-store` | manual smoke | runbook §9 | F-21 | `routes/public/{stats,members,member-profile,form-preview}.ts` | done |

## 不変条件 trace

| 不変条件 | 関連 AC | 失敗時の影響 |
| --- | --- | --- |
| #1 schema 固定禁止 | AC-1, AC-2, AC-3, AC-8 | F-11 / F-12 / F-19 / F-20 |
| #2 consent キー統一 | AC-3, AC-4 | F-1 |
| #3 responseEmail system field | AC-3, AC-10 | F-9 / F-16 |
| #4 admin-managed 分離 | AC-3 | F-16 |
| #5 D1 アクセス apps/api 限定 | AC-9 | 構造的保証 |
| #10 無料枠最適化 | AC-11, AC-12 | F-7 |
| #11 admin-managed leak 禁止 | AC-3, AC-4 | F-1〜F-4 / F-16 |
| #14 schema 集約 | AC-8 | F-12 / F-20 |
