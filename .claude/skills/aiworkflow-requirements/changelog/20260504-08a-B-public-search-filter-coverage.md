# 2026-05-04 08a-B Public Search Filter Coverage

## Summary

`docs/30-workflows/08a-B-public-search-filter-coverage/` を `implemented-local / implementation-spec / VISUAL_ON_EXECUTION` として正本同期。`/members` 公開検索/フィルタ 6 query parameter（`q / zone / status / tag / sort / density` + `page / limit`）の動作仕様を、正本 specs と実コードの両方で固定。

実装側は AC 直結 drift 4 件（q LIKE escape / tag AND bind offset / sort=name fullName tie-break / sort=recent tie-break）を未タスク化せず本サイクルで修正。focused test も同期追加。Phase 11 runtime evidence（screenshot / curl / axe）は VISUAL_ON_EXECUTION として 08b / 09a runtime cycle に委譲。

Close-out 判定: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。Phase 13 commit / push / PR は user-gated。

## Updated Canonical References

- `SKILL.md` §changelog: 先頭行へ v2026.05.04-08a-B を追加。
- `indexes/quick-reference.md` §08a-B Public Members Search Filter: 目的別最初ファイル 7 行を新規セクション化。
- `indexes/resource-map.md` §current canonical set: 08a-B 行を追加（workflow root / Phase 12 implementation-guide / specs/12-search-tags.md / 関連 4 specs / API parser-repository / Web URL parser-filter UI）。
- `references/task-workflow-active.md`: 08a-B row を追加（implemented-local / Phase 12 strict 7 files / Phase 11 runtime pending / Phase 13 pending_user_approval）。
- `references/lessons-learned-08a-B-public-search-filter-coverage-2026-05.md`: 新規追加。教訓 L-08AB-001 〜 L-08AB-008（status semantic / LIKE escape / tag AND offset / sort tie-break / parser normalize / close-out 判定 / 編集中心 runbook / path 移動 register 追跡）。
- `references/legacy-ordinal-family-register.md` §Current Alias Overrides: `08a-B-public-search-filter-coverage` task root の path 移動行を追加。

## Spec Sync（正本 4 ファイル）

- `docs/00-getting-started-manual/specs/12-search-tags.md`: query parameter contract / tag AND SQL 形 / sort=name fullName tie-break。
- `docs/00-getting-started-manual/specs/05-pages.md`: `/members` filter UI / 空状態 文言。
- `docs/00-getting-started-manual/specs/01-api-schema.md`: `GET /public/members` query/response strict schema / Cache-Control / admin-only 三段防御。
- `docs/00-getting-started-manual/specs/09-ui-ux.md`: `/members` a11y AC-A1/A2 / density 3 値。

## Code Sync

- `apps/api/src/_shared/search-query-parser.ts`: q trim + whitespace normalize + 200 truncate / tag dedup + empty drop + 5 件上限。
- `apps/api/src/_shared/__tests__/search-query-parser.test.ts`: q 正規化 / tag 5 件上限 focused test。
- `apps/api/src/repository/_shared/sql.ts`: `placeholders(n, start)` offset 対応 / `escapeLikePattern` 追加。
- `apps/api/src/repository/_shared/sql.test.ts`: 新規 focused test（offset / LIKE escape）。
- `apps/api/src/repository/publicMembers.ts`: q LIKE wildcard literal escape / tag AND bind offset / sort=name fullName ASC / sort=recent fullName tie-break。
- `apps/api/src/repository/publicMembers.test.ts`: fullName sort / compound filter bind alignment / recent tie-break focused test。
- `apps/api/src/routes/public/index.test.ts`: route-level 検索 contract test。
- `apps/web/src/lib/url/members-search.ts` + tests: query <-> URL 相互変換の正規化を sync。

## Downstream Routing（Phase 11 runtime evidence pending）

- 08b-parallel-playwright-e2e-and-ui-acceptance-smoke: `/members` 検索シナリオ 9 screenshot + axe report。`docs/30-workflows/02-application-implementation/08b-A-playwright-e2e-full-execution/index.md` の Depends On / AC に 08a-B contract 行を追加済み。
- 09a-parallel-staging-deploy-smoke-and-forms-sync-validation: `/public/members` curl smoke + staging visual。`docs/30-workflows/02-application-implementation/09a-A-staging-deploy-smoke-execution/index.md` の Depends On / AC に同行を追加済み。

## Evidence Boundary

- Current evidence: focused unit / repository / route-level Vitest PASS（apps/api / apps/web 配下）。
- Pending evidence: Playwright screenshot 9 種、`/public/members` curl logs、axe a11y report（VISUAL_ON_EXECUTION で 08b / 09a 実行時取得）。

## Skill Feedback Surfaced

- `task-specification-creator`: Phase 5 「編集中心型」分岐 / Phase 12 close-out 判定 5 段階正規化 / unassigned-task 0 件フォーマット雛形化を提案（reference candidate）。
- `aiworkflow-requirements`: dual canonical（specs/ vs SKILL family）の更新責務分担を `references/` に明記する提案（promoted を本 wave で適用）。

## artifacts.json parity

- root `docs/30-workflows/08a-B-public-search-filter-coverage/artifacts.json`: 正本。
- `outputs/artifacts.json`: root と同期済み。
- `metadata.workflow_state = implemented_local`、`visualEvidence = VISUAL_ON_EXECUTION`、Phase 1-10 / 12 = `completed`、Phase 11 = `blocked_runtime_evidence`、Phase 13 = `pending_user_approval`。

## docs/30-workflows/LOGS.md

- Wave 行を追加（2026-05-04 / implemented-local / `/members` search filter coverage synced）。
