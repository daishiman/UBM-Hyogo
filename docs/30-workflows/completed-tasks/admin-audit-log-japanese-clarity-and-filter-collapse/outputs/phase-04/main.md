# Phase 4 テスト作成 — main（テスト戦略概要）

> 上流: `../phase-02/component-map.md` / `../phase-03/main.md`。本ファイルはテスト戦略の実体。詳細ケースは `./test-plan.md`。

## 1. テスト戦略概要

- **TDD Red 設計**: Phase 5 実装前は新規 TC が fail することが正常。Green 化は Phase 5。
- **書式**: `import { cleanup, render, screen } from "@testing-library/react"` + `afterEach(() => cleanup())` + happy-dom（既存 admin spec 書式を踏襲）。
- **stubGlobal 不使用**（[FB-VSCPKR-02]）: `vi.stubGlobal` を使わない。本タスクは server fetch を直接呼ばない component（フォーム / カード / 純関数）を対象にするため window モック不要。
- **vitest 実行**: repo ルートが root のため対象限定指定が必要（`_shared-context.md` §9 の 4 spec フルパス指定）。

## 2. テスト分類と internal/external 区分（[VSCPKR-03]）

| 分類 | 対象 | 検証手段 | internal / external 区分 |
| --- | --- | --- | --- |
| (A) 純関数 unit | `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` | 直接 import して戻り値 assert | — （純関数・state なし） |
| (B) 純関数 unit | `buildAuditAppliedFilters`（チップ生成） | 直接 import して chips 配列 assert | — （derived・純関数） |
| (C) component spec | `AuditLogPanel`（ラベル / details / name 属性） | `render` + `getByLabelText` / `[open]` 属性 | **details open = DOM 属性**（`element.open` で検証・internal state でも external prop でもなく `defaultOpen` 算出の DOM 反映）。ラベル = render 出力（`getByLabelText`） |
| (D) component spec | `AuditLogCard`（action/targetType 日本語表示） | `render` + `getByText` | ラベル = render 出力（describe helper 経由） |

> **区分の要点**: details の開閉は「テストでクリックして state 変化を見る」のではなく、**初期描画時の DOM 属性 `open` の有無**を検証する。`render(<AuditLogPanel filters={{targetType:"meeting"}} />)` のとき `container.querySelector(".admin-audit-filter-advanced")?.open === true`、値なしのとき `false` を assert する。

## 3. 4 spec の対象範囲

| spec ファイル | 区分 | 対象 | カバー AC |
| --- | --- | --- | --- |
| `__tests__/auditGlossary.spec.ts` | 新規 | describe helper 正常系 + 未登録 raw fallback + null targetType | AC-3 / AC-6 |
| `__tests__/auditAppliedFilters.spec.ts` | 新規/追従 | チップ label/value 日本語化・英語キー名ゼロ | AC-4 |
| `__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 | 日本語ラベル表示・details 段階開示（値ありで open）・`<input name>` 英語維持・placeholder 日本語・aria | AC-1 / AC-2 / AC-5 / AC-11 |
| `__tests__/AuditLogCard.spec.tsx` | 新規/追従 | action/targetType 日本語表示・未登録 raw fallback・`auditId` → 「ログID」 | AC-3 / AC-5 |

## 4. name 属性英語維持の検証方針（AC-1 / AC-9）

```ts
// ラベルは日本語、name 属性（= query param キー）は英語のまま
const input = screen.getByLabelText("操作の種類");
expect(input).toHaveAttribute("name", "action"); // 英語キー維持
```

> ラベル日本語化（render 出力）と name 属性英語維持（DOM 属性）を 1 ケースで両立確認する。これが AC-1（日本語化）と AC-9（query param キー不変）の同時担保。

## 5. 英語キー名ゼロの検証方針（AC-4）

```ts
// チップに英語キー名が描画されないこと
expect(screen.queryByText("action")).toBeNull();
expect(screen.queryByText("actor")).toBeNull();
expect(screen.queryByText("target type")).toBeNull();
// 代わりに日本語が出ること
expect(screen.getByText(/操作の種類/)).toBeInTheDocument();
```

## 6. screenshot 命名（VISUAL・[FB-VISUAL-CAP-001]）

- 本タスクは VISUAL。Phase 11 screenshot 命名は **canonical 名**（`audit-page-full` / `audit-filter-collapsed` / `audit-filter-expanded` / `audit-applied-chips` / `audit-mobile` 等、`screenshot-plan.json` と一致）を参照する。
- ファイル名は screenshot-plan.json の canonical 名で固定し、本文中で別名を使わない。

## 7. Red 状態の確認

- 新規 4 spec（describe helper / チップ日本語化 / panel 段階開示 / card 日本語表示）は Phase 5 実装前は **全 fail**（map/helper 未追加・details ラッパ未実装・describe helper 未適用のため）。
- 既存挙動温存（AC-12）の回帰確認は、既存 `AuditLogPanel` / `AuditLogCard` の現行 spec があれば pass を維持し、本タスクの追加 assert で日本語化を上乗せする。

## 8. handoff（Phase 5 へ）

1. 4 spec パス（`auditGlossary` / `auditAppliedFilters` / `AuditLogPanel` / `AuditLogCard`）を runbook に反映。
2. details open は DOM 属性検証（`element.open`）。クリック state 変化は検証しない。
3. name 属性英語維持（AC-1/AC-9）を `getByLabelText` + `toHaveAttribute("name", ...)` で同時担保。
4. Phase 6 で fail path（TC-E-XX：未登録コード / null targetType / 空文字フィルタ / 全項目空）を拡充。
