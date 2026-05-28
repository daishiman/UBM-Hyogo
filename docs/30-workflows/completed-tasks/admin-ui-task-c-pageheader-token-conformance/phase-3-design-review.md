---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 3: 設計レビュー

## 3.1 不変条件レビュー

| 不変条件 | 確認観点 | 結果 |
|---------|---------|------|
| I-C1 (PageHeader 1 系) | AdminPageHeader 拡張のみで満たす | OK (eyebrow / headingId 追加のみ。新規 component なし) |
| I-C2 (panel 不可侵) | 9 page で panel 呼び出しシグネチャ維持 | OK (header 部のみ touched。panel props 変更なし) |
| I-C3 (API/D1 不変) | server-side fetch 経路に影響なし | OK |
| I-C4 (token only) | tokens.css 追加と palette 撤去で network closed | OK |
| I-C5 (KPI/table は Task D) | dashboard/attendance は header のみ置換 | OK |

## 3.2 後方互換性

- 既存採用 2 page (dashboard / members) で AdminPageHeader 呼び出しは `eyebrow` 未指定。 → `eyebrow == null` branch で従来通り render (Phase 2.2 で保証)
- breadcrumb の表示順・semantic は変更なし

## 3.3 既知リスク

| ID | リスク | 対策 |
|----|--------|------|
| R-C1 | `schema/page.tsx` の "resolve 履歴を見る" Link を actions slot に昇格する際、Link スタイルが既存と異なる | AdminPageHeader 内で actions slot 装飾は適用しない。Link 装飾は呼び出し側責務 |
| R-C2 | `meetings/[id]` の breadcrumbs に動的 `${title}` を入れるため、SSR fetch 失敗時の fallback ラベル必要 | `result.ok=false` branch では Breadcrumb 自体は出さず `AdminSectionError` のみ |
| R-C3 | `dashboard/attendance/page.tsx` の `<h1 id="admin-attendance-dashboard-h">` を AdminPageHeader に置換すると、既存 section の `aria-labelledby` が断線する | Phase 2.2 で `headingId?: string` prop を追加し、既存 id を維持する |
| R-C4 | `identity-conflicts/page.tsx` の独自 `<main>` 削除で layout main との視覚差分が生じる | layout が既に `max-w-5xl` / padding を所有することを Task A の実装で確認済（spec 上の前提） |

## 3.4 進行判定

→ Phase 4 (テスト計画) に進む。
