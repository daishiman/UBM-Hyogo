# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 1 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflowState | spec_created |

## 実行タスク

- [ ] 本 Phase の本文に記載された要件・前提・成功条件を確定する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-w5-par-public-top-and-member-list.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-{1,2,3}/phase-N.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- `docs/00-getting-started-manual/specs/00-overview.md` / `01-api-schema.md` / `09-ui-ux.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-top-and-list.spec.ts` を本 task が新設し、`/`, `/(public)/members`, `?density=list`, `?density=invalid`, `?q=zzz_no_match_zzz` の 5 ケース + axe critical=0 を実装サイクルで接続する。

## 目的

task-11 の要件を確定し、以降の Phase で扱う対象範囲・前提・成功条件を固める。プロトタイプ要件（Hero / Stats / ZoneIntro / Timeline + Filters / density / card↔table）と既存 API（`/public/stats` / `/public/members`）の交差点を仕様化する。

## 入力

- 一次原典 `task-11-w5-par-public-top-and-member-list.md` §0〜§8
- ワークフロー上位 phase-1〜3（DAG / SCOPE / 不変条件）
- CLAUDE.md 不変条件（D1 直接アクセス禁止、token 正本化、`getEnv()` 強制）
- 既存 `apps/web/src/components/public/{Hero,MemberCard,StatCard,Timeline}.tsx`、`apps/web/src/lib/url/members-search.ts`、`apps/web/src/lib/fetch/public.ts`

## 機能要件

| ID | 要件 |
| --- | --- |
| FR-01 | `/`（トップ）を Hero / Stats / ZoneIntro / Timeline + 任意の MemberGrid（recent 6） の 4+1 セクションで再構成する |
| FR-02 | `/(public)/members` を MemberFilters + (MemberGrid \| MemberTable) + Pagination meta + EmptyState で再構成する |
| FR-03 | データ取得は `apps/web/src/lib/api/public.ts`（新設）または既存 `lib/fetch/public.ts` を介し、`@ubm-hyogo/shared` の Zod スキーマで `parse()（strict 定義済み schema）` する |
| FR-04 | URL query を search 状態の正本（`q` / `zone` / `status` / `tag[]` / `sort` / `density` / `page` / `limit`）とし、Server Component が `searchParams` を受けて API へ転送する |
| FR-05 | `density=comfy/dense/list` を URL 正本でサポートし、`list` 時は `<table>`、`comfy/dense` 時は `<ul>` グリッドを描画する。不正値は `comfy` fallback |
| FR-06 | tag pill は `<button role="switch" aria-checked>`、density toggle は `<div role="radiogroup">` + `<button role="radio">` で a11y 化する |
| FR-07 | 状態（loading / empty / error）を `loading.tsx` / `EmptyState` / `error.tsx`（task-05）で表示する |
| FR-08 | revalidate を stats=60s、members=30s で固定し、Server Component の export に明記する |
| FR-09 | テスト anchor: `data-page="home"` / `data-page="members"` / `data-stat="total\|public\|zones\|sync"` / `data-component="hero"` / `data-role="pagination-meta"` |
| FR-10 | vitest（filter / API wrapper / Hero / Stats / MemberCard）と Playwright smoke（`apps/web/playwright/tests/public-top-and-list.spec.ts`）を追加する |

## 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-01 | `apps/web` から D1 / `@cloudflare/workers-types` の D1 binding を **import しない**（不変条件 #5） |
| NFR-02 | 色は `var(--ubm-color-*)` または `var(--ubm-color-zone-*)` 経由のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件（task-18 整合） |
| NFR-03 | env 参照は `getEnv()` / `getPublicEnv()` 経由。`process.env.*` 直参照禁止（test runner / playwright config を除く） |
| NFR-04 | 新 API endpoint 追加禁止。既存 `/public/stats` / `/public/members` のみ消費 |
| NFR-05 | revalidate: stats=60s / members=30s（無料枠運用） |
| NFR-06 | a11y: `<h1>` 一意性、label htmlFor 紐付け、focus ring `var(--ubm-color-focus)`、axe critical=0 |
| NFR-07 | i18n は対象外。日本語固定 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| implementationStatus | spec_created |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflowState | spec_created |

## スコープ判定

- taskType: **implementation**（既存ファイルの書き換え + 新コンポーネント / API wrapper / test 追加）
- visualEvidence: **VISUAL_ON_EXECUTION**（`/` と `/members` を Playwright で確認、axe critical=0 / screenshot 取得）
- 境界判定: 本ディレクトリは implementation specification。コード実装、Playwright 実行、staging deploy はユーザー承認後の実装サイクルで完遂する。未実行 evidence を PASS と扱わない。

## 完了条件

- [ ] FR-01〜10 / NFR-01〜07 が AC（index.md）と整合
- [ ] `taskType` / `visualEvidence` / `implementation_status` を `artifacts.json.metadata` に記録済み
- [ ] 一次原典 / phase-1..3 / プロトタイプ / 既存 API contract への参照行が記録されている
