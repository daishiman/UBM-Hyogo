# ドキュメント更新履歴 — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

## 変更サマリ

本タスクは implementation / implemented-local / VISUAL_ON_EXECUTION。Phase 12 review で検出した AC 直結 drift は未タスク化せず、`apps/api` の実コードと focused tests に反映済み。本 changelog は workflow-local なログとして配置し、root LOGS と aiworkflow-requirements にも同一 wave 同期する。

## 追加（Added）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/main.md` | spec | Phase 12 ドキュメント更新方針 |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/implementation-guide.md` | spec | Part 1 中学生 / Part 2 技術者の 2 部構成実装ガイド |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/system-spec-update-summary.md` | spec | specs/4 ファイルへの追記方針（Step 1-A/B/C + Step 2） |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/documentation-changelog.md` | spec | 本ファイル |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/unassigned-task-detection.md` | spec | 未タスク検出（残作業 3 件 + coverage delta） |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/skill-feedback-report.md` | spec | task-specification-creator skill への 3 観点 feedback |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-12/phase12-task-spec-compliance-check.md` | spec | 6 タスク × 7 ファイル checklist + close-out 判定 |
| `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-13/main.md` | spec | PR 作成手順 / approval gate / PR 本文ドラフト |
| `apps/api/src/repository/_shared/sql.test.ts` | test | `placeholders` offset と LIKE escape helper の focused unit test |

## 変更（Changed）

| パス | 内容 | 状態 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | Query parameter contract / tag AND SQL 形 / sort=name fullName の追記方針確定 | synced |
| `docs/00-getting-started-manual/specs/05-pages.md` | `/members` filter UI / 空状態 文言の追記方針確定 | synced |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `GET /public/members` query/response schema / Cache-Control / admin-only 三段防御の追記方針確定 | synced |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | a11y `/members` 節の AC-A1/A2 / density 3 値の追記方針確定 | synced |
| `apps/api/src/_shared/search-query-parser.ts` | q trim + whitespace normalize + 200 truncate、tag empty drop + dedup + 5 limit | implemented |
| `apps/api/src/_shared/__tests__/search-query-parser.test.ts` | q 正規化 / tag 5 limit の focused test | implemented |
| `apps/api/src/repository/_shared/sql.ts` | `placeholders(n, start)` offset 対応、`escapeLikePattern` 追加 | implemented |
| `apps/api/src/repository/publicMembers.ts` | q LIKE wildcard literal escape、tag AND bind offset、`sort=name` / `sort=recent` fullName tie-break | implemented |
| `apps/api/src/repository/publicMembers.test.ts` | fullName sort / compound filter bind alignment / recent tie-break focused test | implemented |

## 削除（Removed）

なし。

## 影響を受ける既存仕様書

| 仕様書 | 影響 |
| --- | --- |
| `12-search-tags.md` | AC 形式化のセクション追加 |
| `05-pages.md` | `/members` filter UI 段の追記 |
| `01-api-schema.md` | public 系 API contract の strict 化記述 |
| `09-ui-ux.md` | a11y 章の追記 |
| `claude-design-prototype/pages-public.jsx` | 参照のみ（変更なし） |

## 影響を受ける下流タスク

| タスク | 関係 |
| --- | --- |
| 08b-A-playwright-e2e-full-execution | 検索シナリオ E2E の AC 参照源として本仕様書を引用 |
| 09a-A-staging-deploy-smoke-execution | staging smoke の検索ケース参照源として本仕様書を引用 |

## artifacts.json parity

- root `artifacts.json`: 正本
- `outputs/artifacts.json`: root と同期済み
- root の `metadata.workflow_state` は `implemented_local`
- 各 phase status は Phase 1-10・12 `completed`、Phase 11 `blocked_runtime_evidence`、Phase 13 `pending_user_approval`

> root / outputs artifacts parity は同期済み。Phase 11 runtime evidence 未取得は runtime PASS ではなく `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として扱う。
