# admin-dashboard-recovery-and-byZone

> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> Branch: `feat/admin-ui-prototype-alignment`
> 作成日: 2026-05-26
> 状態: `implemented_local_runtime_pending / implementation / VISUAL`
> 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
> ソース task: `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-B-dashboard-recovery-and-byZone.md`
> task type: `bug fix + API response extension + UI alignment`
> implementation_mode: `verify_existing` (dashboard.ts / safe-server-fetch.ts / ZoneDistribution.tsx) + `new` (`_shared/byZone.ts` / 新規 spec ファイル群)

## 単一責務

`/admin` の ADMIN_FETCH_404 を **wrangler tail による根本原因切り分け** (H1/H2/H3) を経て復旧し、プロトタイプ `pages-admin.jsx` L70-107 に整合した `byZone` (区画 0→1 / 1→10 / 10→100) 分布を、**既存 `GET /admin/dashboard` endpoint の response 拡張**として供給する。

## スコープ

### スコープ内

- `/admin` ADMIN_FETCH_404 の wrangler-tail 切り分け (H1 環境変数 / H2 cookie / H3 prefix 解釈) と該当 1 系統の修正
- `apps/api/src/routes/admin/dashboard.ts` の `byZone` response 拡張 (既存 `aggregatePublicZones` 流用・新 endpoint 追加なし)
- `packages/shared/src/zod/viewmodel.ts` の `AdminDashboardViewZ` に `byZone` optional 追加 (後方互換)
- `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` のプロトタイプ準拠 DOM 書き換え
- `apps/web/src/lib/admin/admin-dashboard-ui.ts` の `ZoneSlice` 型・`parseZoneSlices` を新 shape に更新
- 関連 vitest spec の新規追加 (T-B-01..T-B-08 / Phase 6 参照)

### スコープ外

| 項目 | 理由 |
|------|------|
| Task A (AdminAppShell / Sidebar / Topbar 整流化) | 親 workflow tasks/ 別 task の責務 |
| Task C (9 page header 統一・identity-conflicts token 移行) | 同上 |
| Task D (出席分析 primitive 化) | 同上 |
| Task E (visual baseline 40-48 PNG 取得) | 同上 |
| 新 API endpoint / D1 schema 変更 | CLAUDE.md 不変条件 #5 / 親 workflow 不変条件 #1 |
| Google Form schema 変更 | CLAUDE.md 不変条件 #1 |
| Task E の visual baseline 40-48 PNG 取得 | 本 task は `/admin` dashboard 復旧 + byZone supply の実装と局所 screenshot のみを扱う。広域 baseline 更新は user-gated |

## 不変条件再確認

1. D1 直接アクセスは `apps/api` に閉じる (CLAUDE.md #5)
2. 新 endpoint 追加禁止 (既存 endpoint の response field 拡張は scope 内)
3. OKLch token 正本 (`apps/web/src/styles/tokens.css` の `--ubm-color-*` のみ。HEX / `bg-[#xxx]` 禁止)
4. プロトタイプ正本順位 (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L70-107 を 1:1 で実装)
5. test file は `*.spec.{ts,tsx}` のみ (CLAUDE.md #8)
6. `apps/web` env アクセスは `apps/web/src/lib/env.ts` 経由のみ (`process.env.*` 直参照禁止)

## CONST_007 スコープ単一サイクル完了宣言

本仕様 (Phase 1-13) は **後続実装プロンプト (03.実装.md) の 1 サイクル内で全完了** を前提とする。先送り・別 PR・将来タスク化はしない。`var(--ubm-color-info|accent|ok|bg)` が tokens.css に未定義だった場合も、`ZoneDistribution` が直接依存する最小 alias 追加は本 task 内で完了する。広域 visual baseline 更新だけを Task E の user-gated 範囲として分離する。

## Phase 一覧

| Phase | File | 内容 |
|-------|------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | ゴール・AC-B1..B7・非機能 |
| 2 | [phase-2-design.md](phase-2-design.md) | 404 切り分け H1/H2/H3・byZone 拡張方針 A/B・ZoneDistribution DOM 仕様 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 不変条件・後方互換・OKLch token / 404 マスク確認 gate |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | T-B-01..T-B-08 テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 変更対象ファイル一覧・関数シグネチャ・実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | 新規 spec ファイル一覧 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | 既存 threshold 維持・追加カバレッジ範囲 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | `_shared/byZone.ts` 配置・`zone-keys.ts` 切り出し検討 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | typecheck / lint / build / verify-pr-ready / staging curl |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | AC 全 green / root-cause.md 追記 |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | screenshot / curl-jq evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | canonical 9 headings + 中学生レベル説明 |
| 13 | [phase-13-pr.md](phase-13-pr.md) | base=dev・PR 本文 / DoD checklist |

## 完了条件 (DoD overview)

1. staging `/admin` が 200 + KPI 4 + Zone 3 bar + Status 3 + Activity + SchemaAlertCard を表示
2. `GET /admin/dashboard` の response に `byZone` 配列 length=3 (key=`0to1`/`1to10`/`10to100`) が含まれる
3. `AdminDashboardViewZ` の byZone 拡張が optional・既存 consumer 後方互換
4. H1/H2/H3 のいずれかに 404 原因が特定され、該当 1 系統のみが commit に含まれる
5. `pnpm typecheck` / `pnpm lint` / `pnpm test` (shared/api/web) / `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift 0
6. プロトタイプ `pages-admin.jsx` L70-107 と DOM 比較で差分なし
7. OKLch token のみ使用 (`verify-design-tokens` green)

## Phase 12 strict 7 / 正本同期

- root artifacts: `artifacts.json`
- output artifacts mirror: `outputs/artifacts.json`
- strict 7: `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}`
- Phase 11 local visual evidence: `outputs/phase-11/admin-dashboard-200-overview.png`, `outputs/phase-11/admin-dashboard-byZone-detail.png`, `outputs/phase-11/manual-test-result.md`
- Phase 13 placeholder: `outputs/phase-13/pr-creation-result.md`
- aiworkflow 正本: `.claude/skills/aiworkflow-requirements/references/workflow-admin-dashboard-recovery-and-byZone-artifact-inventory.md`

## 関連参照

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L70-107
- システム仕様: `docs/00-getting-started-manual/specs/00-overview.md`
- tokens 正本: `apps/web/src/styles/tokens.css`
- aiworkflow inventory: `.claude/skills/aiworkflow-requirements/references/workflow-admin-dashboard-recovery-and-byZone-artifact-inventory.md`
