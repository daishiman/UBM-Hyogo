# Phase 6 成果物: 追加テスト観点レポート

- task_id: `admin-members-mobile-responsive-layout`
- phase: 6 / 13
- 前提仕様: [../../phase-6-test-additions.md](../../phase-6-test-additions.md)
- SSOT: [../shared-context.md](../shared-context.md)
- status（spec段階）: pending（実装サイクルで実行・確定）

## 1. 追加テスト観点表（TC-MT-21〜24）

| TC | 観点 | 対象（F1 属性 / id） | 検証方法 | 期待 | 対応 AC / I |
| -- | ---- | -------------------- | -------- | ---- | ----------- |
| TC-MT-21 | ラッパー `data-component` 存在 | `data-component="admin-members-table"` | `container.querySelector('[data-component="admin-members-table"]')` | truthy | AC-7 |
| TC-MT-22 | データ td の `data-label` 全項目網羅 | `メール` / `区画 / ステータス` / `タグ` / `最終更新` / `公開` | 各 `td[data-label="<値>"]` を querySelector | 5 項目すべて truthy（1 件欠落で fail） | AC-2 / AC-7 |
| TC-MT-23 | thead の `data-role` 存在 | `data-role="table-head"` | `querySelector('[data-role="table-head"]')` | truthy | AC-7 |
| TC-MT-24 | 機械可読id 回帰ガード | 行 testid / 編集 aria-label / 全選択 aria-label / `chip-dot` / `member-state-chip-row` | testid / aria-label を逐語照合 | 全て解決（属性追加後も不変） | AC-5 / I-2 |

## 2. fail path / 回帰ガード網羅

| 観点 | 内容 | 検出できる退行 |
| ---- | ---- | -------------- |
| (a) 機械可読id 回帰ガード | row testid `admin-members-row-*` / 編集 aria-label `{fullName} を編集` / 全選択 aria-label `全選択` が引き続き解決 | 属性追加に伴う id 改名・破壊 |
| (b) data-label 全項目網羅 | メール / 区画ステータス / タグ / 最終更新 / 公開 の 5 値を data-driven で照合 | data-label 付与漏れ（カードでラベルが欠ける） |
| (c) desktop DOM 不変 | `<table>` 1 個 / 行個数 = props 会員数 / 各行 td 8 個 | DOM 二重描画（testid 重複）・行 / セル順序個数の改変 |

## 3. Playwright F4 追加観点（中間幅・空状態）

| 観点 | viewport / 状態 | 期待 | status |
| ---- | --------------- | ---- | ------ |
| 中間幅カード表示 | 414px | カード縦積み・`scrollWidth <= clientWidth + 許容誤差` | pending |
| 境界値カード適用 | 640px | カード化適用（境界含む） | pending |
| 境界値テーブル維持 | 641px | カード非適用・`<thead>` 可視（I-6） | pending |
| 空状態 EmptyState | 会員 0 件 / 375px | EmptyState 表示・横はみ出しゼロ・レイアウト崩れなし | pending |

> Playwright 起動不可環境では Phase 11 で `CAPTURE_BLOCKED` を記録し、unit PASS + 手動 375/414/640/1280px スクリーンショットを代替証跡とする（ダミーPNG禁止）。

## 4. 既存テスト非破壊確認

| 項目 | 確認方法 | 期待 | status |
| ---- | -------- | ---- | ------ |
| TC-MT-01〜20 件数不変 | 追加前にベースライン件数を記録し、追加後に減少 / skip がないことを確認 | 既存件数維持 + 追加分のみ増加 | pending |
| axe a11y（TC-MT-18〜20）緑維持 | jsdom が `@media` 非適用のため computed display に影響されない | 緑維持（I-8） | pending |
| 追加 TC は append のみ | 既存 `it()` の記述・期待値・render 設定を変更しない | 既存テスト無改変 | pending |

## 5. 実行コマンド（SSOT §7・`mise exec --` 経由）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 6. 実行結果（実装サイクルで追記）

| コマンド | 結果 | passed / failed / skipped |
| -------- | ---- | ------------------------- |
| targeted vitest（TC-MT-01〜24） | pending | — |
| playwright（admin-members-mobile） | pending（または CAPTURE_BLOCKED） | — |
| typecheck | pending | — |
| lint | pending | — |
