# Phase 11 Manual Test Result

[実装区分: 実装仕様書]

> local deterministic evidence と local Playwright screenshot 2 点は取得済み。authenticated staging screenshot は user-gated。

---

## 0. メタ

| 項目 | 値 |
|------|-----|
| slug | `admin-schema-history-purpose-clarity-and-filter-fix` |
| workflow_state | `implemented_local_evidence_captured` |
| visual_category | `VISUAL` |
| Phase 11 evidence status | local command evidence = `present` / local screenshot = `present` / staging screenshot = `pending_user_gate` |

---

## 1. Local command evidence

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | PASS（4 files / 60 tests） |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11 pnpm --dir apps/web exec playwright test playwright/tests/admin-schema-history-purpose-clarity.spec.ts --project=desktop-chromium` | PASS（2 tests / local screenshots 2 PNG） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm verify:tokens` | PASS（design tokens in sync / 91 tracked） |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | PASS（空） |

補足: `pnpm --filter @ubm-hyogo/web test -- ...` は apps/web 全体を巻き込み、既存無関係の `MemberDrawer.tagInlineCreate.spec.tsx` failure 1 件で exit 1。今回変更対象 spec はその全体実行中でも PASS 済みで、focused 実行で 58/58 PASS を確認した。

---

## 2. Evidence mapping

| ソース | 内容 | AC | Status |
|--------|------|----|--------|
| Vitest（`api.spec.ts`） | `SchemaAliasHistoryResponseZ.parse` の `appliedFilters.batchId`（string/null）受理回帰 | AC-2 | present |
| Vitest（`schemaHistoryError.spec.ts`） | `formatSchemaHistoryError` 純関数 unit（ZodError / HTTP / generic Error / JSON-like Error） | AC-3 | present |
| Vitest（`SchemaHistoryPurposeExplainer.component.spec.tsx`） | 目的説明パネル（流れ 3 ステップ + 用語集）描画 | AC-5 | present |
| Vitest（`SchemaDiffHistoryPanel.component.spec.tsx`） | human-readable error / card 描画 / explainer 表示回帰 | AC-3 / AC-7 | present |
| `verify:tokens` | HEX 直書き 0 件 | AC-8 | present |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | 空（apps/api 非接触） | AC-9 | present |
| local Playwright screenshot | purpose+card / error message | AC-5/6/7 / AC-3/4 | present |
| staging screenshot（認証越し） | purpose+card / error message | AC-5/6/7 / AC-3/4 | pending_user_gate |

---

## 3. local screenshot（canonical 名）

| canonical 名 | 内容 | Status |
|------|------|--------|
| `outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` | 目的説明パネル + 履歴カード一覧 | present |
| `outputs/phase-11/screenshots/admin-schema-history-error-message.png` | 日本語エラーメッセージ（raw JSON 非表示） | present |

---

## 4. 結論

- 本サイクルの Phase 11 は local deterministic evidence と local screenshot 2 点まで完了。
- authenticated staging screenshot 2 点は user-gated のため `pending_user_gate`。
