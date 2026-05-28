---
spec_classification: implementation_spec
state: spec_created
phase: 12
phase_name: ドキュメント同期
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 12: ドキュメント同期

中学生レベル概念説明セクションを含む canonical 9 headings に従う。

## 12.1 ゴール

中学生レベルで説明: admin の画面 9 枚で、ページ上部の「題名・パンくず・ちょっと小さい青字 (eyebrow)」の見た目を 1 つの部品 `AdminPageHeader` で統一する。あちこちに散らばっていた色の指定を、共通の色名 (`var(--ubm-color-*)`) でまとめる。

## 12.2 アーキテクチャ整合

- AdminPageHeader を canonical な page-head component とする
- `apps/web/src/components/admin/Breadcrumb` の直 import は admin segment page.tsx から消える (panel 内部からの import は touched しない)
- tokens.css に `--ubm-color-link-default` / `--ubm-eyebrow-tracking` の 2 token を追加

## 12.3 不変条件への反映

- 親 `admin-ui-prototype-alignment` の不変条件と整合 (I-C1..C5)
- `verify-design-tokens` の grep scope を admin segment 全 page に広げる

## 12.4 関連 task との接続

- Task A (layout shell): main 所有・max-w / padding の前提
- Task B (dashboard 404): 別 PR
- Task D (attendance KpiGrid): `dashboard/attendance/page.tsx` の本体改修。本タスクは header のみ
- Task E (visual baseline): Phase 11 で配置した reference screenshot を baseline 化

## 12.5 公式ドキュメント更新

- 親 workflow `outputs/phase-12/implementation-guide.md` に Task C セクションを追記:
  - 9 page の page-head 設計表 (Phase 2.1)
  - AdminPageHeader 拡張 API (Phase 2.2)
  - identity-conflicts 整流化 (Phase 2.3 / 5.4)
- `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` の JSDoc に `eyebrow` / `headingId` prop の使い分けを追記

## 12.6 lessons-learned 反映候補

- **L-ADMIN-PH-001**: admin segment は AdminPageHeader 1 系で統一し、Breadcrumb 直貼りを禁止する (grep gate 化)
  - **Why**: 9 page で UI 表現が分岐していたため、PageHeader を 1 系に絞る整流化が必要だった
  - **How to apply**: 新 admin route 追加時は必ず AdminPageHeader 経由とし、structure gate `admin-page-header-adoption.spec.ts` で機械的に enforced
- **L-ADMIN-PH-002**: Tailwind palette 直書きは page.tsx 層で混入しやすい → CI gate `verify-design-tokens` の scope を admin segment に拡げる
  - **Why**: identity-conflicts/page.tsx に `text-zinc-*` 等が残存していた
  - **How to apply**: palette regex を admin segment 全 page.tsx に対し常時 fail-on-match

## 12.7 evidence

- spec compliance check: `docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/outputs/phase-12/phase12-task-spec-compliance-check.md` (実装時に生成)

## 12.8 未タスク検出 (unassigned-task)

本 spec 作成段階では unassigned-task = 0。Phase 5 / 8 で panel 内部の palette 違反が検出された場合の方針:

- panel 内部に palette が広範に残存していた場合 → 別 task として切り出し (例: `admin-ui-task-c-followup-001-panel-palette`)
- ただし `verify-design-tokens` を green にする最小修正は本サイクル内で完結させる (CONST_007)

## 12.9 完了条件

- 親 workflow `implementation-guide.md` に Task C 追記済
- AdminPageHeader JSDoc 更新済
- lessons-learned L-ADMIN-PH-001 / L-ADMIN-PH-002 を `aiworkflow-requirements` / `task-specification-creator` skill の lessons へ反映済 (Phase 13 直前)
- Phase 12 strict 7 outputs を `outputs/phase-12/` に作成済
- `outputs/artifacts.json` と root `artifacts.json` の parity 作成済
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory 同期済
