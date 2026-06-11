# Phase 11: 手動テスト

[実装区分: 実装仕様書]

> local deterministic evidence は取得済み。実機 screenshot 取得・staging 反映は **user-gated**。

---

## 0. 前提

| 項目 | 値 |
|------|-----|
| slug | `admin-schema-history-purpose-clarity-and-filter-fix` |
| visual_category | `VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| 対象画面 | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema/history` |

---

## 1. Local evidence（取得済み）

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | PASS（4 files / 60 tests） |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11 pnpm --dir apps/web exec playwright test playwright/tests/admin-schema-history-purpose-clarity.spec.ts --project=desktop-chromium` | PASS（2 tests / local screenshots 2 PNG） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm verify:tokens` | PASS（design tokens in sync / 91 tracked） |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | PASS（空） |

補足: 誤って `pnpm --filter @ubm-hyogo/web test -- ...` を実行した結果、apps/web 全体が走り `MemberDrawer.tagInlineCreate.spec.tsx` の既存無関係 failure 1 件を確認した。今回変更対象の schema history 関連 spec はその全体実行中でも PASS 済み。

---

## 2. 3層評価

### 2-1. Semantic 評価（機能・データ整合）

- AC-1: `/admin/schema/history` の「絞り込み」操作で `unrecognized_keys` / `batchId` の ZodError が発生しないよう、`AppliedFiltersZ.batchId` と `EMPTY_RESPONSE.appliedFilters.batchId` を実装済み。
- AC-2: `api.spec.ts` で `appliedFilters.batchId` string / null 双方の受理を確認済み。
- AC-3: `schemaHistoryError.spec.ts` と panel spec で raw JSON ではなく日本語メッセージ表示を確認済み。

### 2-2. Visual 評価（レイアウト・トークン）

- AC-4: error 表示要素に `.schema-history-error` クラス付与済み。
- AC-7: 履歴は `.schema-history-card` カード形式で stableKey / 旧→新 / question / 日時・操作者を描画。
- AC-8: `pnpm verify:tokens` PASS。

### 2-3. AI UX 評価（情報設計・用途明確化）

- AC-5: `data-testid="schema-history-purpose-explainer"`、流れ 3 ステップ、用語集を spec で確認済み。
- AC-6: page title「設問の紐付け履歴」/ description 平易化を実装済み。

---

## 3. screenshot（canonical 名）

| canonical 名 | 内容 | 対応 AC | status |
|------|------|---------|--------|
| `outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` | 目的説明パネル + 履歴カード一覧 | AC-5 / AC-6 / AC-7 | local_present / staging_pending_user_gate |
| `outputs/phase-11/screenshots/admin-schema-history-error-message.png` | 日本語エラーメッセージ表示（`.schema-history-error`・raw JSON が出ないこと） | AC-3 / AC-4 | local_present / staging_pending_user_gate |

---

## 4. 実機テスト手順（user-gated）

1. staging へ deploy（`scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）= user-gated。
2. `/admin/schema/history` を認証越しで開き、上記 2 screenshot を取得 = user-gated。
3. 「絞り込み」を押し、`unrecognized_keys` ZodError が消えていること（DevTools console / 画面下部に raw JSON が出ないこと）を確認。

---

## 5. 結論

- 本サイクルの Phase 11 は local deterministic evidence と local screenshot 2 点まで完了。
- authenticated staging screenshot 2 点のみ `pending_user_gate`。
