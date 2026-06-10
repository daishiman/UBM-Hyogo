# Phase 11 — 手動テスト・視覚証跡（VISUAL）

Task ID: `TASK-ADMIN-SCHEMA-PAGE-PURPOSE-CLARITY-UX-001`

## 0. ワークフロー状態

本 Phase は実装後の local runtime evidence を取得済み。詳細結果は [manual-test-result.md](manual-test-result.md)、撮影台帳は [screenshot-plan.json](screenshot-plan.json) / [phase11-capture-metadata.json](phase11-capture-metadata.json) を正本とする。

| 項目 | 値 |
| --- | --- |
| visualEvidence | VISUAL |
| capture 状態 | `captured_local_runtime` |
| 実装状態 | `implemented_local_evidence_captured` |
| runtime 境界 | staging deploy / PR / commit / push は user-gated のまま。local fixture runtime は取得済み |

## 1. 視覚的に変わった点

1. **目的説明カード**: AdminPageHeader 直下に `SchemaPurposeExplainer`（できること見出し＋リード文＋3ステップ流れ図＋結果プレビュー＋用語集）が常時表示で新出。
2. **統計ラベル/hint**: `SchemaDiffStatsGrid` の各 `AdminStat` が「未対応」「新規設問」「変更候補」「削除候補」等の平易日本語＋次アクション示唆へ変更。
3. **割当アウトカム**: `SchemaDiffPanel` の割当フォーム展開時に「対応づけると起きること」を表示。
4. **0件 empty state**: 「差分はありません。フォームとデータベースが一致した良い状態です」を component test で固定。

## 2. 3層評価結果

| 層 | 評価観点 | 結果 |
| --- | --- | --- |
| Semantic | 用語 SSOT / 目的説明 / 統計・履歴ラベル / カテゴリ説明 / empty copy / 既存 mutation 回帰 | PASS（focused Vitest 4 files / 34 tests） |
| Visual | desktop/mobile の目的説明カード・統計・カテゴリ説明・割当アウトカム | PASS（local runtime screenshots present） |
| AI UX | 初見管理者が目的・流れ・得られる結果を読める導線連続性 | PASS（manual visual review） |

## 3. Screenshot 台帳

| canonical 名 | 状態 | 結果 | viewport |
| --- | --- | --- | --- |
| `schema-purpose-explainer-default.png` | 目的説明カード常時表示（差分あり） | present | desktop 1280x900 |
| `admin-schema-purpose-clarity-mobile-runtime.png` | mobile 全体確認 | present | mobile 390x844 |
| `schema-stats-plain-labels.png` | 統計4枚 平易ラベル | present | desktop 1280x900 |
| `schema-diff-assign-outcome.png` | 割当フォーム展開・アウトカム表示 | present | desktop 1280x900 |
| `schema-empty-state.png` | 差分0件 empty state | semantic PASS / runtime fixture N/A | component test |

## 4. 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
git diff --stat -- apps/api packages/shared
```

追加 runtime smoke:

```bash
AUTH_SECRET=playwright-e2e-auth-secret-32-bytes \
PLAYWRIGHT_TEST=1 \
PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 \
PORT=3000 \
pnpm --filter @ubm-hyogo/web dev:webpack

pnpm exec tsx -e '<Playwright Chromium smoke for /admin/schema desktop/mobile>'
```

## 5. 境界

- `apps/api/**` / `packages/shared/**` は diff 0。API/D1/Form 変更なし。
- staging screenshot / commit / push / PR は user-gated。
- Empty state は fixture 不在のため runtime PNG を作らず semantic test を正本にする。
