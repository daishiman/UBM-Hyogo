# Phase 5 成果物: 実装サマリ

- task_id: `admin-members-mobile-responsive-layout`
- SSOT: [../shared-context.md](../shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004）

---

## 1. 変更ファイル一覧（RT-03）

| # | パス | 変更種別 | 変更概要 |
| - | ---- | -------- | -------- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | **編集** | ラッパー/thead/8td へ属性追加（属性のみ・ロジック不変） |
| F2 | `apps/web/src/styles/globals.css` | **編集** | `:2576` 直後・同一 `@layer` に `@media (max-width:640px)` カード化ブロック追加 |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | **編集** | TC-MT-21〜24 追加（既存20件不改変） |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | **新規** | PW-MM-01〜04 mobile visual smoke |

### 新規作成

- F4: `apps/web/playwright/tests/admin-members-mobile.spec.ts`

### 修正

- F1: `apps/web/src/features/admin/components/_members/MembersTable.tsx`
- F2: `apps/web/src/styles/globals.css`
- F3: `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`

---

## 2. 入力・出力・副作用 / シグネチャ

| 区分 | 内容 |
| ---- | ---- |
| 入力 | `MembersTableProps`（**不変**・props 追加なし） |
| 出力 | DOM 属性（`data-component` / `data-role` / `data-label` / `data-cell`）+ `globals.css` カード化 CSS |
| 副作用 | **なし**（state / API / storage / D1 非接触。breakpoint は CSS 正本 I-5） |
| 主要シグネチャ | `MembersTableProps` 不変。新規関数・新規コンポーネント・新規 primitive・新規 hook なし |

---

## 3. 各ファイル変更概要（Before/After 要点）

### F1 `MembersTable.tsx`（属性追加のみ・行番号は git 確認済 2026-06-10）

| 行 | 対象 | Before → After 要点 |
| -- | ---- | ------------------- |
| :80 | ラッパー div | `data-component="admin-members-table"` 追加 + `overflow-hidden`→`overflow-x-auto` |
| :83 | thead | `data-role="table-head"` 追加 |
| :109 | td1 チェックボックス | `data-cell="select"` |
| :118 | td2 メンバー | `data-cell="member"` |
| :137 | td3 メール | `data-label="メール"` |
| :140 | td4 区画/ステータス | `data-label="区画 / ステータス"` |
| :158 | td5 タグ | `data-label="タグ"` |
| :161 | td6 最終更新 | `data-label="最終更新"` |
| :164 | td7 公開 | `data-label="公開"`（既存 `onClick` 維持） |
| :171 | td8 操作 | `data-cell="actions"` |

> 機械可読id 逐語不変: `data-testid="admin-members-row-{memberId}"` / `aria-label`（`{fullName} を選択` / `{fullName} を編集` / `全選択` / `ページネーション` / `前へ` / `次へ`）/ `chip-dot` / `member-state-chip-row`。

### F2 `globals.css`（`@media` カード化追加）

- 挿入位置: `:2576`（issue-276 `member-filters` ブロック直後・同一 `@layer` ネスト）。
- 内容: thead を clip 隠し → table/tbody/tr/td を `display:block` → tr をカード枠（border/radius/margin/padding/background）→ td を flex 行 → `td[data-label]::before { content: attr(data-label) }` でラベル表示。
- トークン: `--ubm-space-1/2/3` / `--ubm-text-xs` / `--ubm-radius-md` / `--ubm-color-border-default` / `--ubm-color-surface-panel` / `--ubm-color-text-muted`（実装時 `tokens.css` で grep 実在確認・HEX/任意値禁止）。
- desktop（≥641px）は 1 byte も影響なし（I-6）。

### F3 `MembersTable.spec.tsx`

- 既存 `describe("MembersTable", ...)` 内に TC-MT-21〜24 を `it(...)` 追加。既存 TC-MT-01〜20 不改変。

### F4 `admin-members-mobile.spec.ts`（新規）

- PW-MM-01〜04（375px カード/横はみ出し `scrollWidth<=clientWidth+1`/公開トグル可視 / 1280px テーブル維持）。認証 fixture は既存 admin spec 流用。

---

## 4. 実装順序

Lane A（F1 属性）→ Lane B（F2 CSS）→ Lane C（F3/F4 テスト・validation lane 直列締め）。

---

## 5. DoD チェックリスト（SSOT §8）

- [ ] F1〜F3 landed・F4（環境が許せば）追加。
- [ ] AC-1〜AC-9 全充足。
- [ ] `pnpm typecheck` / `pnpm lint` / targeted vitest（24件）緑。
- [ ] `verify-design-tokens` 相当緑（HEX/任意値カラー混入ゼロ）。
- [ ] 375/640/1280px の手動（または Playwright）でカード/テーブル切替が意図通り。
- [ ] `apps/api` / migration / Form 差分ゼロ（`git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'` が空）。

---

## 6. 検証コマンド（`mise exec --` 経由・SSOT §7）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx
mise exec -- pnpm verify:design-tokens
git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
```
