[実装区分: 実装仕様書]

# Unassigned Task Detection

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |

> 新規 GitHub Issue 化は本 Phase で実施しない。既存 `docs/30-workflows/unassigned-task/` の formalized task へ紐付け、build 緑化後に user 承認のうえ実行する。

## 検出件数: 3 件 + LL-1 lessons-learned 候補

Issue #385 本文に明記された follow-up は既存 unassigned-task として formalize 済みであるため、本 Phase では重複作成せず canonical path を明示する。

| # | タスク候補 | 種別 | canonical path | scope | blocker 解消後の発火条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | P11-PRD-003 fetchPublic 経路の再開 | implementation | `docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md` | apps/web fetchPublic 実装 / E2E smoke | Issue #385 本仕様書の AC-1〜AC-9 が緑になり deploy 経路が回復した時点 |
| 2 | P11-PRD-004 `/privacy` `/terms` ページ実装 | implementation | `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md` | apps/web 静的ページ追加 / SSG 確認 | 同上 |
| 3 | `apps/web/wrangler.toml` service-binding (API_BASE_URL) deploy 反映 | infrastructure | `docs/30-workflows/unassigned-task/task-ref-api-wrangler-env-production-explicit-001.md` | wrangler.toml service-binding 適用 / staging smoke | 同上（既追加済 binding が build 緑化により deploy 反映可能になる） |

## 各候補タスクの 4 必須セクション

### 1. P11-PRD-003 fetchPublic

- **苦戦箇所【記入必須】**: build 緑化前に着手すると同じ `useContext` null で deploy 不可
- **リスクと対策**: lazy factory 適用後も特定 route で漏れがあれば再発 → Phase 11 段 9 lazy-import-check で構造検査
- **検証方法**: `pnpm --filter @ubm-hyogo/web build` exit 0 + fetchPublic E2E smoke
- **スコープ**: 含む = fetchPublic 実装と smoke / 含まない = auth.ts 挙動変更・deploy 実行・PR 作成

### 2. P11-PRD-004 `/privacy` `/terms`

- **苦戦箇所【記入必須】**: build 緑化前に着手すると同じく deploy 不可
- **リスクと対策**: 静的 SSG ページが Next 16 で正常 prerender されることを smoke 確認
- **検証方法**: `pnpm build` 後 `.next/server/app/privacy.html` / `terms.html` 生成確認
- **スコープ**: 含む = 静的ページ実装 / 含まない = i18n / 意匠改善・PR 作成自体

### 3. wrangler.toml service-binding 反映

- **苦戦箇所【記入必須】**: build 失敗中は deploy 不可なので binding 追加効果が確認できない
- **リスクと対策**: service-binding 名衝突 / 環境差異 → staging で先行 smoke
- **検証方法**: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 後 endpoint 疎通
- **スコープ**: 含む = binding deploy / 含まない = API 側変更・production deploy

## lessons-learned 候補（同 wave 反映）

| 候補 ID | 内容 | 想定追加先 |
| --- | --- | --- |
| LL-1 | 「Next.js App Router + React 19 + next-auth 5.x 環境では、auth 系モジュールを top-level import すると prerender worker で `useContext` null を引く可能性があり、`getAuth()` lazy factory パターンが再発防止策として有効」 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-authjs-admin-gate-2026-04.md` の stale Issue #385 記述を Plan A / Phase 11 PASS へ更新 |

## 判定

3 件すべて Issue #385 本文で参照済の **下流 follow-up** であり、既存 unassigned-task として formalize 済み。本ワークフローでは重複作成しない。実 issue 化 / 実行は build 緑化（本仕様書の implementation 完了）後に user 承認を経て実施。LL-1 は `skill-feedback-report.md` と既存 lessons に同 wave 反映済み。
