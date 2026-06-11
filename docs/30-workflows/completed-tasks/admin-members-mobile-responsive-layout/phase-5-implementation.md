# Phase 5: 実装手順

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 5 / 13
- 前提: [phase-4-test-plan.md](phase-4-test-plan.md) 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004）

## 目的

モバイルカード化（≤640px）を **属性追加（F1）＋ CSS 追加（F2）＋ テスト追加（F3/F4）** で実装する手順を、実装者がそのまま反映できる粒度で固定する。純表現層に閉じ、機械可読id・行/セル順序・props を不変に保つ（I-2/I-3）。

## 実行タスク

### 変更対象ファイル一覧（RT-03 対応 / SSOT §2）

| # | パス | 変更種別 |
| - | ---- | -------- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | **編集**（属性追加のみ） |
| F2 | `apps/web/src/styles/globals.css` | **編集**（`@media` カード化ブロック追加） |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | **編集**（TC-MT-21〜24 追加） |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | **新規** |

#### 新規作成ファイル

- F4: `apps/web/playwright/tests/admin-members-mobile.spec.ts`

#### 修正ファイル

- F1: `apps/web/src/features/admin/components/_members/MembersTable.tsx`
- F2: `apps/web/src/styles/globals.css`
- F3: `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`

### 入力・出力・副作用の定義（純表現層）

| 区分 | 内容 |
| ---- | ---- |
| 入力 | `MembersTableProps`（props・**不変**。props 追加なし） |
| 出力 | レンダリング DOM への属性付与（`data-component` / `data-role` / `data-label` / `data-cell`）＋ `globals.css` の `@media` カード化スタイル |
| 副作用 | **なし**。state / API / storage / D1 を一切触らない。breakpoint は CSS 正本（I-5） |

### 主要シグネチャ

- `MembersTableProps`: **不変**（props 追加・削除・型変更なし）。
- 新規関数: **なし**。新規 React コンポーネント・新規 primitive・新規 hook も**なし**（Phase 2 確定）。

### F1: `MembersTable.tsx` 差分方針（属性追加のみ）

SSOT §3.2 の td→data-label マップに従い、現状コード（行番号は git 確認済み 2026-06-10）に属性を 1 対 1 で付与する。**ロジック・props・条件分岐・行/セルの順序と個数・機械可読id は不変**（I-2/I-3）。

#### F1-a: ラッパー `<div>`（`MembersTable.tsx:80`）

`data-component="admin-members-table"` を追加し、`overflow-hidden` を `overflow-x-auto` に変更する（横スクロール fallback 兼用。≥641px は block 化しないため実質無影響、≤640px は td が block 化するため横スクロールは発生しない）。

Before:
```tsx
<div className="ui-card overflow-hidden rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]">
```
After:
```tsx
<div
  data-component="admin-members-table"
  className="ui-card overflow-x-auto rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)]"
>
```

#### F1-b: `<thead>`（`MembersTable.tsx:83`）

`data-role="table-head"` を追加（カード時に CSS で視覚的に隠す。DOM からは削除せず a11y role を保持）。

Before:
```tsx
<thead>
```
After:
```tsx
<thead data-role="table-head">
```

#### F1-c: 各データ `<td>`（行番号 1 対 1 マップ）

現状の 8 つの `<td>`（`MembersTable.tsx:109` / `:118` / `:137` / `:140` / `:158` / `:161` / `:164` / `:171`）へ、以下のとおり属性を付与する。`className` / 子要素 / イベントハンドラはすべて現状維持し、属性のみ追加する。

| td 行 | 内容 | 付与する属性 |
| ----- | ---- | ------------ |
| `:109`（td1） | チェックボックス | `data-cell="select"`（`data-label` なし） |
| `:118`（td2） | メンバー（アバター＋氏名） | `data-cell="member"`（`data-label` なし） |
| `:137`（td3） | メール | `data-label="メール"` |
| `:140`（td4） | 区画 / ステータス（Chip群） | `data-label="区画 / ステータス"` |
| `:158`（td5） | タグ | `data-label="タグ"` |
| `:161`（td6） | 最終更新 | `data-label="最終更新"` |
| `:164`（td7） | 公開（`MemberPublishSwitch`） | `data-label="公開"` |
| `:171`（td8） | 操作（編集ボタン） | `data-cell="actions"`（`data-label` なし） |

最小 Before/After 例（td1 / td3 / td7 を代表例示。残りも同様に属性のみ追加）:

td1（`:109`）Before → After:
```tsx
<td className="px-3 py-2">
<td data-cell="select" className="px-3 py-2">
```

td3（`:137`）Before → After:
```tsx
<td className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-secondary)]">
<td data-label="メール" className="px-3 py-2 font-mono text-xs text-[var(--ubm-color-text-secondary)]">
```

td7（`:164`）Before → After（既存 `onClick` は維持）:
```tsx
<td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
<td data-label="公開" className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
```

> **機械可読id 逐語不変**（Phase 5 明記）: 以下は属性追加後も逐語で変更しない。
> ・`data-testid="admin-members-row-{memberId}"`（行）
> ・各 `aria-label`: `{fullName} を選択` / `{fullName} を編集` / `全選択` / `ページネーション` / `前へ` / `次へ`
> ・`data-testid="chip-dot"` / `data-testid="member-state-chip-row"`（子コンポーネント由来。F1 では触らない）

### F2: `globals.css` 差分方針（`@media` カード化ブロック追加）

SSOT §3.3 の雛型 CSS を基に、`globals.css:2576`（issue-276 mobile filterbar `@media` ブロック直後・**同一 `@layer` ネスト内**）へ挿入する。`@layer` のネスト深さは既存 issue-276 ブロックと厳密に揃える。

#### F2-a: 挿入位置

- `globals.css:2559-2576` が既存 issue-276 `@media (max-width:640px)` + `data-component="member-filters"` ブロック。
- その**直後**（行 2576 の閉じ括弧の次）に、同じ `@layer` ネスト内で F2 ブロックを追加する。`globals.css` 総行数 2608。

#### F2-b: 実トークン名の実在確認（MINOR TECH-M-01・必須）

雛型で使用するトークンは、挿入前に `apps/web/src/styles/tokens.css`（および `globals.css`）で実在を grep 確認してから使用する。HEX 直書き・`bg-[#xxx]`・任意値カラーは禁止（I-4）。

```bash
# 雛型で使う各トークンの実在確認（実装時に実行）
grep -nE -- "--ubm-space-1|--ubm-space-2|--ubm-space-3|--ubm-text-xs|--ubm-radius-md|--ubm-color-border-default|--ubm-color-surface-panel|--ubm-color-text-muted" apps/web/src/styles/tokens.css
```

> 確認の結果、雛型のトークン名が `tokens.css` に存在しない場合は、最も近い実在トークン（同カテゴリの space / text / radius / color）に置換する。**新規トークンの追加・HEX 直書きはしない**。

#### F2-c: 挿入する CSS（SSOT §3.3 雛型・トークンは F2-b 確認後に確定）

```css
/* === admin-members-mobile-responsive-layout: テーブル→カード化 (<=640px) === */
@media (max-width: 640px) {
  [data-component="admin-members-table"] [data-role="table-head"] {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  [data-component="admin-members-table"] table,
  [data-component="admin-members-table"] tbody,
  [data-component="admin-members-table"] tr,
  [data-component="admin-members-table"] td {
    display: block;
    width: 100%;
  }
  [data-component="admin-members-table"] tr {
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-md);
    margin: var(--ubm-space-2) var(--ubm-space-2) 0;
    padding: var(--ubm-space-2);
    background: var(--ubm-color-surface-panel);
  }
  [data-component="admin-members-table"] td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ubm-space-3);
    padding: var(--ubm-space-1) 0;
    border: 0;
  }
  [data-component="admin-members-table"] td[data-label]::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: var(--ubm-text-xs);
    color: var(--ubm-color-text-muted);
    flex: 0 0 auto;
  }
}
```

- token のみ・HEX 禁止（I-4）。
- `@media (max-width:640px)` の内側のみ追加。≥641px は 1 byte も影響しない（I-6 / desktop 不変）。

### F3: `MembersTable.spec.tsx` テスト追加

Phase 4 の TC-MT-21〜24 を、既存 `describe("MembersTable", ...)` ブロック内に `it(...)` で追加する（既存 TC-MT-01〜20 は不改変）。Phase 4 §Step 3 の各 TC の観点・操作・期待値に従う。実装後に緑化を確認する。

### F4: `admin-members-mobile.spec.ts` 新規作成

Phase 4 §Step 5 の PW-MM-01〜04（375px カード表示・横はみ出しゼロ `scrollWidth <= clientWidth + 1`・公開トグル可視・1280px テーブル維持）を実装する。認証 fixture は既存 admin Playwright spec と同方式を流用（新規認証フロー不可）。

### 実装順序（Lane A → B → C・C は validation lane として直列締め）

| 順序 | Lane | 作業 | 依存 |
| ---- | ---- | ---- | ---- |
| 1 | Lane A | F1 `MembersTable.tsx` 属性追加（F1-a/b/c） | SSOT §3.2 |
| 2 | Lane B | F2 `globals.css` カード化 CSS 追加（F2-a/b/c） | Lane A の属性名（`admin-members-table` / `table-head` / `data-label`）に整合 |
| 3 | Lane C | F3 unit test 追加 + F4 Playwright 新規 → 全コマンド緑化 | Lane A/B 完了後（直列締め） |

### テスト方針

- Lane C で Phase 4 の TC-MT-21〜24 を実装し、`vitest run MembersTable.spec.tsx` で **既存20 + 追加4 = 24 件全緑** を確認。
- Playwright F4 は環境が許せば実行。不可なら Phase 11 で CAPTURE_BLOCKED 記録 + 手動 screenshot 代替。

### ローカル実行・検証コマンド（SSOT §7）

```bash
# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 対象 unit test
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx

# design token gate（HEX/任意値カラー混入チェック）
mise exec -- pnpm verify:design-tokens

# API 非接触確認（AC-8）— 空であること
git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'

# Playwright mobile（環境が許せば）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
```

> filter 名 `@ubm-hyogo/web` / `verify:design-tokens` script 名は実装時に `apps/web/package.json` / ルート `package.json` で実値確認する。

### DoD（SSOT §8 引用）

- [ ] F1〜F3 の変更が landed し、F4（環境が許せば）も追加。
- [ ] AC-1〜AC-9 を全て満たす。
- [ ] `pnpm typecheck` / `pnpm lint` / targeted vitest（24件）が緑。
- [ ] `verify-design-tokens` 相当が緑（HEX/任意値カラー混入ゼロ）。
- [ ] 375 / 640 / 1280px の手動確認（またはPlaywright）でカード/テーブル切替が意図通り。
- [ ] `apps/api` / migration / Form への差分ゼロ。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | §2 inventory / §3.2 td→label マップ / §3.3 CSS雛型 / §7 コマンド / §8 DoD |
| テスト計画 | `phase-4-test-plan.md` | TC-MT-21〜24 / Playwright F4 |
| 設計 | `phase-2-design.md` | 純表現層・新規コンポーネントなし |
| 現状コード | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 行 80/83/109/118/137/140/158/161/164/171 |
| トークン正本 | `apps/web/src/styles/tokens.css` | `--ubm-*` 実トークン |

## 実行手順

1. Lane A: F1 のラッパー（:80）・thead（:83）・8 td（:109〜:171）へ属性を 1 対 1 で付与（F1-a/b/c）。機械可読id 逐語不変を確認。
2. Lane B: F2-b でトークン実在を grep 確認 → `globals.css:2576` 直後・同一 `@layer` 内に F2-c の CSS を挿入。
3. Lane C: F3 へ TC-MT-21〜24 追加・F4 新規作成 → 全検証コマンド緑化。
4. AC-1〜AC-9 / DoD を確認。

## 統合テスト連携

- Phase 6: F1/F2/F3/F4 実装と緑化。
- Phase 9: 24 件 vitest + typecheck + lint + design-token gate + API 非接触 diff。
- Phase 11: 375/640/1280px screenshot（または Playwright）でカード/テーブル切替確認。

## 多角的チェック観点（AIが判断）

- 責務境界: 表現層に完結。入力（props）不変・副作用なし。state / API / D1 を触らないため回帰面が DOM 属性 + CSS のみに限定される。
- 整合性: Lane B の CSS セレクタは Lane A の属性名（SSOT で固定）に依存 → 名前 drift を SSOT 参照で防止。
- 運用性: 実トークン名は実装時 grep 確認（TECH-M-01）。HEX/任意値混入は design-token gate で機械検知。

## サブタスク管理

| ID | 内容 | lane | status |
| -- | ---- | ---- | ------ |
| ST-A | F1 属性追加（:80/:83/8td） | A | pending |
| ST-B | F2 `@media` カード化 CSS | B | pending |
| ST-C | F3 TC追加 + F4 新規 + 緑化 | C | pending |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 実装サマリ | `outputs/phase-5/implementation-summary.md` |

## 完了条件

- [ ] 変更対象ファイル一覧（F1編集/F2編集/F3編集/F4新規・新規/修正区分）が記載されている。
- [ ] F1 の td→data-label/data-cell マップが現状行番号（:109/:118/:137/:140/:158/:161/:164/:171）と 1 対 1 で明示され、Before/After 断片がある。
- [ ] F2 の挿入位置（`:2576` 直後・同一 `@layer`）・トークン実在確認手順・雛型 CSS が記載されている。
- [ ] 入力（props 不変）/ 出力（DOM属性+CSS）/ 副作用（なし）が定義されている。
- [ ] 主要シグネチャ（`MembersTableProps` 不変・新規関数なし）が記載されている。
- [ ] 機械可読id 逐語不変が Phase 5 に明記されている。
- [ ] 実装順序（Lane A→B→C 直列締め）が記載されている。
- [ ] ローカル実行・検証コマンド（SSOT §7）と DoD（SSOT §8）が引用されている。

## タスク100%実行確認【必須】

- [x] 変更ファイル一覧（新規/修正区分）
- [x] F1 行番号 1 対 1 マップ + Before/After
- [x] F2 挿入位置 + トークン確認 + 雛型
- [x] 入出力・副作用・シグネチャ
- [x] 機械可読id 不変明記
- [x] 実装順序 + コマンド + DoD

## 次Phase

[phase-6-implementation-test.md](phase-6-implementation-test.md) — 実装とテストの緑化。
