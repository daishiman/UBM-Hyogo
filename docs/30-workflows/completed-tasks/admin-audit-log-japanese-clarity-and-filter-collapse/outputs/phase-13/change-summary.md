# Phase 13 — 変更概要

> ステータス: `implemented_local_evidence_captured`。commit / push / PR は user 承認後のみ。staging screenshot は user-gated。

---

## 1. 変更ファイル想定（_shared-context §6 / component-map 由来）

| 区分 | パス | 変更 | 証跡 |
| --- | --- | --- | --- |
| 編集 | `apps/web/src/components/admin/auditGlossary.ts` | 3 ラベルマップ + 3 describe helper（raw fallback）追加 | `auditGlossary.spec.ts` PASS |
| 編集 | `apps/web/src/components/admin/AuditLogPanel.tsx` | フォームラベル日本語化 + 2 層段階開示（`<details>`）+ datalist 日本語化 | `AuditLogPanel.component.spec.tsx` PASS |
| 編集 | `apps/web/src/components/admin/AuditLogCard.tsx` | action / targetType 日本語表示 + auditId ラベル日本語化 | `AuditLogCard.spec.tsx` PASS |
| 編集 | `apps/web/src/components/admin/auditAppliedFilters.ts` | チップ label / value を describe helper 経由で日本語化 | `auditAppliedFilters.spec.ts` PASS |
| 変更なし | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | CSS で吸収 | diff 0 件 |
| 編集 | `apps/web/src/styles/globals.css` | `.admin-audit-glossary` / `.admin-audit-card__meta` / `.admin-audit-filter-advanced` | verify:tokens |
| **変更なし** | `apps/api/**` / `packages/shared/**` | AC-9 | diff 0 件 |

## 2. AC 充足記録（実装後に埋める）

| AC | 充足（実装後） | 証跡 |
| --- | --- | --- |
| AC-1 フォームラベル日本語化・name 英語維持 | [x] | `AuditLogPanel.component.spec.tsx` |
| AC-2 フィルタ 2 層段階開示・値ありで open | [x] | `AuditLogPanel.component.spec.tsx` |
| AC-3 カード action/targetType 日本語 | [x] | `AuditLogCard.spec.tsx` |
| AC-4 適用チップ日本語化・英語キー名 0 | [x] | `auditAppliedFilters.spec.ts` |
| AC-5 datalist/auditId 英語キー名解消 | [x] | `AuditLogPanel.component.spec.tsx` / `AuditLogCard.spec.tsx` |
| AC-6 glossary SSOT + raw fallback | [x] | `auditGlossary.spec.ts` |
| AC-7 カードブロック整列 | [x] | globals.css |
| AC-8 OKLch token（HEX 0） | [ ] | verify:tokens PASS |
| AC-9 API/D1/shared 不変・query param キー不変 | [x] | `apps/api`/`packages/shared` diff 0 |
| AC-10 新規 primitive 0 | [x] | `components/ui/` diff 0 |
| AC-11 a11y 維持 | [x] | label 関連付け / `<details>` / `aria-label` |
| AC-12 既存機能温存 | [x] | 既存 component spec PASS |

## 3. テスト結果（実装後に埋める）

| スイート | 件数 | 結果 |
| --- | --- | --- |
| auditGlossary / auditAppliedFilters / AuditLogPanel / AuditLogCard spec | 4 files / 57 tests | PASS |
| token gate（verify:tokens） | — | — |
| typecheck / lint | — | — |

## 4. screenshot 取得記録（実装後に埋める）

| canonical 名 | 取得 |
| --- | --- |
| audit-page-full | [ ] |
| audit-filter-collapsed | [ ] |
| audit-filter-expanded | [ ] |
| audit-timeline-cards-ja | [ ] |
| audit-applied-filters-chips | [ ] |
| audit-page-mobile | [ ] |
