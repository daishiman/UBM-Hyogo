---
task_id: admin-ui-task-c-pageheader-token-conformance
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-05-26
task_type: ui_alignment
visual_category: VISUAL
implementation_mode: implemented_local_evidence_captured (+ verify_existing for AdminPageHeader)
parent_workflow: docs/30-workflows/admin-ui-prototype-alignment/
source_task: docs/30-workflows/admin-ui-prototype-alignment/tasks/task-C-pages-pageheader-and-token-conformance.md
branch: feat/admin-ui-prototype-alignment
---

# admin-ui Task C — AdminPageHeader 統一 + identity-conflicts token 整流化

親 workflow `admin-ui-prototype-alignment` の Task C を Phase 1-13 の単一責務仕様書群へ分解し、同一サイクルで実コードへ反映した実装仕様書ディレクトリ。

## ゴール（要旨）

admin segment 11 page のうち `AdminPageHeader` 未採用の 9 page を統一し、`page-head` + `eyebrow` + `h-page` レイアウトに揃える。同時に `identity-conflicts/page.tsx` の Tailwind palette 直書きと独自 `<main>` を解消する。

## 現在状態

- 状態: `implemented_local_evidence_captured / implementation / VISUAL`
- 実装: 9 page の `AdminPageHeader` 採用、`AdminPageHeader` の `eyebrow` / `headingId` 拡張、`identity-conflicts/page.tsx` の独自 `<main>` と page 層 palette 撤去、`tokens.css` の link / eyebrow token 追加。
- local evidence: `outputs/phase-11/evidence/local-focused-test.log`, `outputs/phase-11/01-admin-tags.png` ... `09-admin-dashboard-attendance.png`, `outputs/phase-11/manual-test-result.md`
- Phase 12 strict 7: `outputs/phase-12/` に集約。
- user-gated: staging authenticated screenshot、visual baseline更新、commit、push、PR。

## スコープ（11 file）

- `apps/web/app/(admin)/admin/{tags,meetings,meetings/[id],schema,schema/history,requests,identity-conflicts,audit,dashboard/attendance}/page.tsx`
- `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` (props 拡張: `eyebrow?: string`)
- `apps/web/src/styles/tokens.css` (最小 token 追加: `--ubm-color-link-default`)

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA / CI gate | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / Evidence | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](phase-13-pr.md) |

## 関連 task

- 親: `docs/30-workflows/admin-ui-prototype-alignment/`
- sibling: Task A (layout shell) / Task B (dashboard 404) / Task D (attendance KpiGrid) / Task E (visual baseline)

## 不変条件（要旨）

- I-C1: AdminPageHeader は 1 系のみ。新規 PageHeader component 禁止。
- I-C2: 既存 panel の API / business behavior は不可侵。Task C pages では h1 重複防止のため、後方互換 props で legacy panel chrome の表示だけを抑止できる。
- I-C3: API / D1 / Google Form schema 不変。
- I-C4: 色は `var(--ubm-color-*)` トークン経由のみ。
- I-C5: KPI / table / status 表現は Task D / E の責務。
