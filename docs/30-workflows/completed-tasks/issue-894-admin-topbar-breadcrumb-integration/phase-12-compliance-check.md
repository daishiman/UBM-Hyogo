# Phase 12: Compliance Check

## 1. Overview

本ファイルは task-specification-creator skill 適合 / CLAUDE.md 不変条件 / プロトタイプ正本順位の遵守を機械検証可能な形で確認する。canonical 9 headings を満たす。

## 2. Scope

- 対象 issue: #894（CLOSED / 2026-05-25 `gh issue view 894` で確認、PR 文脈は `Refs #894` のみ）
- 対象ファイル: `apps/web/app/(admin)/layout.tsx` / `apps/web/src/components/admin/Breadcrumb.tsx` / `apps/web/app/(admin)/admin/**/page.tsx` / `apps/web/app/(admin)/layout.spec.tsx` / `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx`
- 案: 案 B（役割分担: topbar=ルートトップ静的 / AdminPageHeader=ページ内現在地）
- 影響範囲: admin AppShell topbar / page-local breadcrumb consumer 8 page

## 3. Implementation Plan

Phase 3 / Phase 5 を参照。T1（layout 配線）→ T2（dashboard page 縮小）→ T3（members page 縮小）→ T4（layout spec assertion 追記）の順。1 PR に集約。

## 4. Acceptance Criteria

Phase 8 の AC-1 〜 AC-10 をすべて満たす。

## 5. Risks

Phase 9 の R1 (RSC 境界 client 化) / R2 (data-* 契約破壊) / R3 (「管理」重複検出漏れ) / R4 (後続規約逸脱) / R5 (duplicate landmark warning) を参照。

## 6. Dependencies

- 親 workflow: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction/`（completed）
- 既存 primitive: `apps/web/src/components/admin/Breadcrumb.tsx`
- 既存 primitive: `apps/web/src/components/layout/AdminTopbar.tsx`
- 既存 component: `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`
- 既存 spec: `apps/web/app/(admin)/layout.spec.tsx`

## 7. References

- Issue: <https://github.com/daishiman/UBM-Hyogo/issues/894>
- 原指示書: `docs/30-workflows/unassigned-task/parallel-03-followup-003-admin-topbar-breadcrumb-integration.md`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md: 不変条件 1-4 / UI prototype alignment / MVP recovery

## 8. Compliance

### 8.1 task-specification-creator skill 適合

- [x] Phase 1-13 ファイル完備
- [x] artifacts.json metadata 完備（visualEvidence / taskType / source_issue / commit_push_pr / gates）
- [x] SRP 単位のタスク分解（Phase 3）
- [x] canonical 9 headings 充足（本ファイル）
- [x] Phase 11 VISUAL 宣言 + screenshot evidence + 代替 evidence
- [x] Gate-A / Gate-B の合格基準明文化（Phase 7）
- [x] Phase 12 strict 7 outputs を `outputs/phase-12/` に物理配置
- [x] Phase 11 evidence inventory を `outputs/phase-11/` に物理配置

### 8.2 CLAUDE.md 不変条件

| ID | 遵守内容 |
|----|----------|
| 不変条件1 (既存 API のみ) | API endpoint / D1 schema 変更 0 |
| 不変条件2 (OKLch トークン正本化) | HEX 直書き / arbitrary class 追加 0 |
| 不変条件3 (プロトタイプ正本順位) | 既存 `Breadcrumb` primitive のみ使用 / 新規 primitive 0 |
| 不変条件4 (D1 直接アクセス禁止) | `apps/web` から D1 binding 触らない |
| RSC 維持 | `(admin)/layout.tsx` server component のまま |
| 不変条件8 (test suffix) | 既存 `*.spec.tsx` のみ、新規 `*.test.tsx` 作らない |
| 不変条件9 (admin FormField) | 本タスクは form input 改変なし、無関係 |
| 不変条件10 (admin mutation) | 本タスクは mutation 改変なし、無関係 |

### 8.3 プロトタイプ正本順位

1. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`: 抵触なし
2. `outputs/phase-{1,2,3}/phase-N.md`: 抵触なし
3. `docs/00-getting-started-manual/specs/*.md`: 抵触なし
4. プロトタイプ: 既存 primitive のみ使用 / 抵触なし

### 8.4 verify:phase12-compliance / gate-metadata:validate

- [x] canonical 9 headings (`## 1` 〜 `## 9`) 本ファイルで充足
- [x] artifacts.json zod schema 互換構造（`type` / `status` / `metadata.gates` / `phases`）
- [x] Phase 11 evidence 表（必須項目: VISUAL 宣言 + rationale + screenshot + 代替 evidence 一覧）

## 9. Sign-off

| Gate | Status | Approver | Note |
|------|--------|----------|------|
| Gate-A spec_review | completed | daishiman | Phase 1-13 + strict 7 + canonical 9 headings 確認 |
| Gate-B implementation_review | completed | daishiman | 実装 + focused vitest + typecheck/lint + grep gate 確認 |

ユーザー明示承認後にのみ commit / push / PR を行う（`commit_push_pr: user_gated`）。
