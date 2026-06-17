# Phase 6 — テスト拡充方針（main.md）

> Phase 4 の正常系 Red を Phase 5 で Green 化した後の、異常系・境界値（fail path）テスト拡充方針と回帰 guard の位置づけ。

## 1. 正常系（Phase 4）/ 異常系（Phase 6）の責務分担

| 区分 | 担当 Phase | 内容 |
| --- | --- | --- |
| 正常系（happy path） | Phase 4 | 日本語ラベルの描画（フォーム / カード / チップ）、2 層フィルタ構造の存在、`<input name>` の英語維持、登録済コードの日本語変換 |
| 異常系・境界値（fail path） | Phase 6 | 未登録 action の raw fallback、targetType=null の「—」、details の開閉既定、appliedFilters 空のチップ非表示、英語キー名ゼロの境界 |

- 正常系は「期待通りの日本語が出る」を検証。異常系は「想定外入力でも壊れず情報欠落しない」を検証する。
- describe helper は throw しない純関数のため、異常系はすべて「fallback 値が返る / 表示される」形で検証する（例外送出ではない）。

## 2. fail path テストの配置 spec

| spec ファイル | 担当 TC-E |
| --- | --- |
| `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` | TC-E-01（未登録 action）/ TC-E-02（targetType=null）/ TC-E-06（describeAuditField 未登録） |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | TC-E-03（未登録 action の UI 表示）/ TC-E-04（targetType=null の UI 表示） |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | TC-E-07（詳細フィルタ全空 → details 閉）/ TC-E-08（値あり → details 開） |
| `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | TC-E-05（appliedFilters 空 → チップ 0 件）/ TC-E-09（英語キー名ゼロ） |

## 3. 回帰 guard の位置づけ

| guard | 種別 | 担保 AC | 連携 Phase |
| --- | --- | --- | --- |
| `verify-design-tokens`（`pnpm verify:tokens`） | CI gate / grep | AC-8（HEX 0 件） | Phase 9 |
| 既存挙動温存（検索 / リセット / cursor ページネーション / PII マスク / JSON 開示 / エラー親切メッセージ） | 構造アサート + 手動 | AC-12 | Phase 11 |
| `git diff --name-only -- apps/api packages/shared` 空 | grep | AC-9 | Phase 9 |
| testid 維持（`audit-log-card` / `audit-applied-filters`） | grep / 構造アサート | AC-12 | Phase 8 |

- `verify-design-tokens` は CSS 整列（C3）で HEX を増やしていないことを機械保証する。
- 既存挙動温存は「DOM contract（form action / Link href / Pagination / details 開示）が不変」をテスト構造で、視覚は Phase 11 screenshot で担保する。

## 4. 境界値網羅マトリクス

| 軸 | 値 | カバー TC-E |
| --- | --- | --- |
| action | 登録済 / 未登録 | TC-E-01, TC-E-03 |
| targetType | 登録済 / 未登録 / null | TC-E-02, TC-E-04 |
| 詳細フィルタ（targetType/targetId/batchId） | 全空 / 一部あり / 全あり | TC-E-07, TC-E-08 |
| appliedFilters | 空 / 1 件 / 複数 | TC-E-05 + 正常系 |
| describeAuditField key | 登録済 / 未登録 | TC-E-06 |

## 5. テスト書式

- 既存踏襲: jsdom + `@testing-library/react` + `*.spec.{ts,tsx}`（不変条件 #8）。
- helper の純関数テスト（`auditGlossary.spec.ts`）は DOM 不要で直接呼び出し検証。
- component テストは `render` + `screen.getByText` / `queryByText` + `data-testid` 起点のアサート。
- jsdom は CSS 非評価のため、details の `open` 判定は **属性の有無（`details.open` / `hasAttribute("open")`）**で検証する（視覚的開閉ではなく属性）。
