# Phase 4 成果物: テスト仕様

- task_id: `admin-members-mobile-responsive-layout`
- SSOT: [../shared-context.md](../shared-context.md)
- 対象: F3 `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`（編集）/ F4 `apps/web/playwright/tests/admin-members-mobile.spec.ts`（新規）

---

## 0. TDD 役割分担

- カード化は CSS media query のため jsdom では computed display を検証できない → **unit test = 属性存在検証**、**Playwright = 実ブラウザ視覚検証** に責務分割する。
- `MembersTable` は props 駆動・internal state なし（VSCPKR-03）。テスト操作対象は「レンダリング DOM 属性」であり internal state ではない。

---

## 1. 追加 unit test ケース表（TC-MT-21〜24・jsdom）

| ID | 観点 | 入力（操作） | 期待 | jsdom 検証可否 | 種別 |
| -- | ---- | ------------ | ---- | -------------- | ---- |
| TC-MT-21 | ラッパーに `data-component="admin-members-table"` | `render` 後 `container.querySelector('[data-component="admin-members-table"]')` | truthy かつ `tagName==="DIV"` | 可 | 属性存在（unit） |
| TC-MT-22 | データ td に `data-label` 付与（5値） | 1行以上描画し各 `td[data-label="..."]` を取得 | `メール` / `区画 / ステータス` / `タグ` / `最終更新` / `公開` の 5 `data-label` が存在。逆ガード: `td[data-cell="select"]` / `td[data-cell="member"]` / `td[data-cell="actions"]` が truthy（これらは `data-label` を持たない） | 可 | 属性存在（unit） |
| TC-MT-23 | `<thead>` に `data-role="table-head"`（DOM残存） | `container.querySelector('[data-role="table-head"]')` / `container.querySelector("thead")` | `[data-role="table-head"]` truthy かつ `tagName==="THEAD"`、`thead` が DOM 残存 | 可（視覚非表示は Playwright 側） | 属性存在（unit） |
| TC-MT-24 | 機械可読id 不変リグレッションガード | `getByTestId('admin-members-row-{id}')` / `getByRole("button",{name:'{fullName} を編集'})` / `getByRole("checkbox",{name:"全選択"})` / `getByRole("checkbox",{name:'{fullName} を選択'})` / `querySelector('[data-testid="member-state-chip-row"]')` | 全 selector が解決し `toBeInTheDocument()` / chip-row truthy | 可 | 回帰ガード（unit） |

### 既存回帰（不改変・再掲）

| 範囲 | 方針 |
| ---- | ---- |
| TC-MT-01〜20（axe a11y TC-MT-13/18〜20 含む） | 1件も改変しない。属性追加は DOM 順序・testid を変えないため既存 selector 全解決。axe は jsdom が `@media` 非適用のため緑維持。`<thead>` DOM 残置で table role 保持 |
| 合否判定 | `vitest run MembersTable.spec.tsx` で 既存20 + 追加4 = **24 件全緑**（AC-7） |

---

## 2. Playwright ケース表（F4 `admin-members-mobile.spec.ts`・実ブラウザ）

| ID | viewport | 観点 | 入力（操作） | 期待 | 種別 |
| -- | -------- | ---- | ------------ | ---- | ---- |
| PW-MM-01 | 375×667 | カード表示（縦積み） | `/admin/members` 遷移、最初の `[data-testid^="admin-members-row-"]` 取得 | 行が縦積み（td が block 化し行幅≒コンテナ幅）。`[data-role="table-head"]` が視覚非表示（`isVisible()` false / clip 相当で boundingBox 極小） | visual（実ブラウザ） |
| PW-MM-02 | 375×667 | 横はみ出しゼロ | `[data-component="admin-members-table"]` の `scrollWidth` / `clientWidth` を `evaluate` 取得 | `scrollWidth <= clientWidth + 1`（許容誤差1px）かつ `documentElement.scrollWidth <= innerWidth + 1` | visual（実ブラウザ） |
| PW-MM-03 | 375×667 | 公開トグル・編集 可視操作可 | 最初の行内の `MemberPublishSwitch` / `aria-label$="を編集"` 取得 | 各 `boundingBox().x + width <= 375` かつ `isVisible()` true | visual（実ブラウザ） |
| PW-MM-04 | 1280×800 | desktop テーブル維持 | `[data-role="table-head"]` 取得、メール td とメンバー td の `boundingBox().y` 比較 | `[data-role="table-head"]` `isVisible()` true（カードCSS非適用）。2 td の `y` がほぼ同一（同一行レイアウト） | visual（実ブラウザ） |

- 横はみ出し判定の正本式: **`scrollWidth <= clientWidth + 許容誤差(1px)`**。
- 認証 fixture: 既存 admin Playwright spec と同方式を流用（新規認証フロー不可）。
- **CAPTURE_BLOCKED（TECH-M-02）**: Playwright 起動不可時は実行スキップ → Phase 11 で `CAPTURE_BLOCKED` 記録、unit PASS + 手動 375/640/1280 screenshot を代替証跡（ダミーPNG禁止）。

---

## 3. 実行コマンド（`mise exec --` 経由）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
```

---

## 4. AC マッピング

| AC | 検証手段 |
| -- | -------- |
| AC-1（カード表示・横はみ出しゼロ） | PW-MM-01 / PW-MM-02 |
| AC-2（各項目ラベル付き可視） | TC-MT-22（属性）+ PW-MM-01（視覚） |
| AC-3（公開トグル・編集 操作可） | PW-MM-03 |
| AC-4（desktop 維持） | PW-MM-04 |
| AC-5（機械可読id・順序不変） | TC-MT-24 + 既存 TC-MT-01〜20 |
| AC-7（既存緑 + 追加緑） | TC-MT-01〜24 全緑 |
