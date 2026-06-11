# Phase 8 成果物: リファクタリングログ

- task_id: `admin-members-mobile-responsive-layout`
- phase: 8 / 13
- 前提仕様: [../../phase-8-refactor.md](../../phase-8-refactor.md)
- SSOT: [../shared-context.md](../shared-context.md)
- status（spec段階）: pending（実 diff で確定）

## 1. リファクタ要否判定

- 本タスクの変更は JSX 属性追加（F1）+ `@media` CSS 追加（F2）に限定。
- 新規関数 / コンポーネント / state / hook の追加なし（phase-2 Step 1）。抽出 / 分割 / 命名変更などの構造リファクタは発生しない。
- 結論: **大規模リファクタなし**。

## 2. RT-03 変更記録テーブル（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| F1 ラッパー `<div>` | `data-component` なし・`overflow-hidden` | `data-component="admin-members-table"`・`overflow-x-auto` 系 | カード化 CSS のセレクタ起点 + 横はみ出し fallback（I-5） |
| F1 `<thead>` | 属性なし | `data-role="table-head"` | カード時に CSS で視覚的に隠す（DOM 残置で a11y role / jsdom テスト保持） |
| F1 データ `<td>`（メール/区画ステータス/タグ/最終更新/公開） | `data-label` なし | `data-label="<項目名>"` | `::before { content: attr(data-label) }` でカード内ラベル表示（AC-2） |
| F1 ラベルなし `<td>`（チェック/メンバー/操作） | 属性なし | `data-cell="select/member/actions"` | カード時の flex 配置専用マーカー |
| F2 `globals.css` | カード化 `@media` なし | issue-276 直後・同一 `@layer` 内に `@media (max-width: 640px)` カード化ブロック | レスポンシブ CSS 欠如の根治（AC-1） |
| 構造リファクタ | — | **なし** | 属性追加 + CSS のため抽出 / 分割不要（大規模リファクタなしの記録） |

> After でも機械可読id（`data-testid` / aria-label / `chip-dot` / `member-state-chip-row`）・行 / セルの DOM 順序と個数は不変（I-2 / I-3）。

## 3. 重複・navigation drift 確認

### 3-1: data-label 重複定義チェック

```bash
grep -oE 'data-label="[^"]*"' apps/web/src/features/admin/components/_members/MembersTable.tsx | sort | uniq -c
```

| data-label 値 | 出現回数 期待 | 実測 |
| ------------- | ------------- | ---- |
| `メール` | 1 | pending |
| `区画 / ステータス` | 1 | pending |
| `タグ` | 1 | pending |
| `最終更新` | 1 | pending |
| `公開` | 1 | pending |

### 3-2: ヘッダー / data-label 整合（drift 防止）

| 列 | `<thead>` 見出し | `data-label` 値 | 整合 |
| -- | ---------------- | --------------- | ---- |
| メール | メール | `メール` | 一致 |
| 区画 / ステータス | 区画 / ステータス | `区画 / ステータス` | 一致 |
| タグ | タグ | `タグ` | 一致 |
| 最終更新 | 最終更新 | `最終更新` | 一致 |
| 公開 | 公開 | `公開` | 一致 |

> 実装時に `<thead>` の実テキストを確認し、表記揺れがあれば data-label を揃える（SSOT §3.2 正本）。

## 4. FB-UI-02-1: ファイル削除の非該当明記

- F1〜F3 は編集、F4 は新規。**ファイル削除は一切なし**。
- 「削除に伴う import 孤児 / dead code 整理 / 削除 PASS 基準」は本タスクでは**非該当**。空振り PASS にせず明示記録する。

## 5. token 直書き（HEX / 任意値）最終 grep（Phase 9 引き継ぎ）

```bash
# HEX / 任意値カラー混入チェック（空であること）
git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -E '^\+' | grep -Ei '#[0-9a-f]{3,8}\b|\b(bg|text|border)-\[#'

# 追加 CSS が参照する var(--ubm-*) 一覧（Phase 9 で実在確認）
git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -oE 'var\(--ubm-[a-z0-9-]+\)' | sort -u
```

| 確認 | 期待 | 実測 | 引き継ぎ先 |
| ---- | ---- | ---- | ---------- |
| HEX / 任意値カラー混入 | 空（混入ゼロ） | pending | Phase 9 Step 1（AC-6） |
| `var(--ubm-*)` 実在 | tokens.css / globals.css :root で定義済み | pending | Phase 9 Step 6（TECH-M-01） |

## 6. まとめ

- 構造リファクタなし。変更は属性追加（F1）+ CSS 追加（F2）のみ。
- 機械可読id / DOM 順序は不変（I-2 / I-3）。
- ファイル削除なし（FB-UI-02-1 非該当）。
- HEX / token 検査結果は Phase 9 の design token gate（AC-6）/ TECH-M-01 解決確認へ引き継ぐ。
