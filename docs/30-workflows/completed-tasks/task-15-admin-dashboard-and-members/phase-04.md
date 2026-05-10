# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書]

> 目的: vitest コンポーネントテスト 5 ファイルと expected result を **実装より先に** 作成する。Phase 1 §6 命名規則と Phase 2 §3 state ownership を入力とする。

---

## 1. 事前チェック（FB-MSO-002）

```bash
# worktree 直後の依存整合
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build  # shared が build 済みであること
# happy-dom / @testing-library/react が apps/web に入っていること
mise exec -- pnpm -F @ubm-hyogo/web list happy-dom @testing-library/react @testing-library/user-event jest-axe
```

---

## 2. テスト対象ファイル一覧

| # | テストファイル | 対象 | テストケース数（目安） |
|---|---------------|------|---------------------|
| T-01 | `apps/web/src/features/admin/components/__tests__/KpiGrid.test.tsx` | `KpiGrid` | 4 |
| T-02 | `apps/web/src/features/admin/components/__tests__/MembersFilters.test.tsx` | `MembersFilters` | 5 |
| T-03 | `apps/web/src/features/admin/components/__tests__/MembersTable.test.tsx` | `MembersTable` | 5 |
| T-04 | `apps/web/src/features/admin/components/__tests__/RecentActionsTable.test.tsx` | `RecentActionsTable` | 3 |
| T-05 | `apps/web/src/features/admin/components/__tests__/BulkActionBar.test.tsx` | `BulkActionBar` | 4 |

---

## 3. テストケース仕様

### 3.1 KpiGrid.test.tsx

| ID | ケース | input | 期待 |
|----|--------|-------|------|
| TC-KG-01 | 4 セルが描画される | `totals = { totalMembers: 100, publicMembers: 50, untaggedMembers: 0, unresolvedSchema: 0 }` | `Total members` `Public on site` `Untagged` `Schema issues` の 4 label が DOM に存在 |
| TC-KG-02 | `unresolvedSchema=0` で success tone | 同上 | `Schema issues` の数値要素が `text-[var(--ubm-color-success)]` クラスを持つ |
| TC-KG-03 | `unresolvedSchema>0` で danger tone | `unresolvedSchema: 5` | 同要素が `text-[var(--ubm-color-danger)]` |
| TC-KG-04 | `untaggedMembers>0` で warning tone | `untaggedMembers: 3` | `Untagged` の数値要素が warning class |

### 3.2 MembersFilters.test.tsx

| ID | ケース | 操作 | 期待 |
|----|--------|------|------|
| TC-MF-01 | zone select 変更で onChange 発火 | `userEvent.selectOptions(zoneSelect, "zone_0_1")` | `onChange` が `{ zone: "zone_0_1" }` で 1 回呼ばれる |
| TC-MF-02 | filter select 変更 | `selectOptions(filterSelect, "published")` | `onChange({ filter: "published" })` |
| TC-MF-03 | sort select 変更 | `selectOptions(sortSelect, "name")` | `onChange({ sort: "name" })` |
| TC-MF-04 | 自由検索は onBlur で確定 | `type "yamada" into search input` → blur | `onChange({ q: "yamada" })` が **blur 時に 1 回** |
| TC-MF-05 | loading=true で「更新中…」表示 | `<MembersFilters loading />` | `text=更新中…` が `role="status"` 要素として可視 |

### 3.3 MembersTable.test.tsx

| ID | ケース | 操作 | 期待 |
|----|--------|------|------|
| TC-MT-01 | items=[] で empty 表示 | `items: []` | `text=該当する会員はいません` が表示 |
| TC-MT-02 | row 描画 | `items: 3 件` | `<tr>` が 3 行 + thead 1 行 |
| TC-MT-03 | checkbox toggle | `userEvent.click(rowCheckbox)` | `onToggleSelect("<memberId>")` が 1 回 |
| TC-MT-04 | 氏名 button click | `userEvent.click(nameButton)` | `onOpenRow(memberId)` が 1 回 |
| TC-MT-05 | pagination 「次へ」 | `page=1, pageSize=50, total=120` で次へ click | `onPageChange(2)` |

### 3.4 RecentActionsTable.test.tsx

| ID | ケース | input | 期待 |
|----|--------|-------|------|
| TC-RAT-01 | items=[] で empty メッセージ | `items: []` | `text=直近 7 日のアクションはありません` |
| TC-RAT-02 | items 非空で table 行数一致 | `items: 5 件` | tbody `<tr>` が 5 行 |
| TC-RAT-03 | 監査ログリンク | items 任意 | `<a href="/admin/audit">` が `text=監査ログを開く →` で存在 |

### 3.5 BulkActionBar.test.tsx

| ID | ケース | 操作 | 期待 |
|----|--------|------|------|
| TC-BAB-01 | selectedIds=[] で render しない | `selectedIds: []` | `role="region"` 要素が DOM に無い（`queryByRole` で null） |
| TC-BAB-02 | publish click でシリアル呼出 | `selectedIds: ["a","b","c"]`、`patchMemberStatus` mock | mock が 3 回呼ばれ、引数が `(<id>, { publishState: "public" })` |
| TC-BAB-03 | hide click | 同上 | `patchMemberStatus(<id>, { publishState: "hidden" })` 3 回 |
| TC-BAB-04 | soft-delete click | 同上 | `deleteMember(<id>, <reason>)` 3 回 |

---

## 4. テスト実装パターン（FB-VSCPKR-02 / FB-W1-02b-3）

### 4.1 mock 戦略

```ts
// admin mutation helper mock — vi.mock で path 全体を差し替える（vi.spyOn(window) は禁止 / FB-VSCPKR-02）
vi.mock("@/lib/admin/api", () => ({
  patchMemberStatus: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  deleteMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  restoreMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
}));
```

### 4.2 props vs internal state（FB-VSCPKR-03）

| コンポーネント | テスト操作対象 | external prop / internal state |
|---------------|---------------|--------------------------------|
| KpiGrid | `totals` | external prop |
| MembersFilters | `value`, `onChange` | external prop（controlled） |
| MembersTable | `items`, `selected`, callbacks | external prop |
| BulkActionBar | `busy: Action \| null` | **internal state** — テストでは click → assert mock call 経由で間接確認 |

### 4.3 共通 setup

```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
```

`Object.defineProperty(window, "api", ...)` パターンは本タスクでは不要（Electron preload 無し）。`vi.stubGlobal("window", ...)` は **使用禁止**（FB-VSCPKR-02）。

### 4.4 a11y テスト（Phase 6 で追加 / Phase 4 では雛形のみ）

```ts
// import { axe } from "jest-axe";
// it("a11y violations 0", async () => { const { container } = render(...); expect(await axe(container)).toHaveNoViolations(); });
```

Phase 4 では各テストファイル末尾に `it.todo("a11y violations 0")` を残し、Phase 6 で実装。

---

## 5. ローカル実行コマンド（TDD Red 確認）

```bash
# 5 ファイルすべて FAIL（実装が無いので import error or assertion fail）になることを確認
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/KpiGrid.test.tsx \
  src/features/admin/components/__tests__/MembersFilters.test.tsx \
  src/features/admin/components/__tests__/MembersTable.test.tsx \
  src/features/admin/components/__tests__/RecentActionsTable.test.tsx \
  src/features/admin/components/__tests__/BulkActionBar.test.tsx
```

期待: 全テスト FAIL（コンポーネント未実装のため）。これが TDD Red 状態。

---

## 6. 完了条件（DoD）

- [ ] 5 テストファイルが上記 21 ケース（KG4 + MF5 + MT5 + RAT3 + BAB4）を網羅
- [ ] `pnpm test` 実行で 5 ファイルすべて FAIL（Red 状態を確認）
- [ ] mock 戦略 §4.1 を全テストファイルに適用
- [ ] a11y todo 5 件を残す（Phase 6 で実装）
- [ ] `outputs/phase-04/test-spec.md` に test case マトリクス出力

## 成果物

- 5 つの `*.test.tsx` ファイル（TDD Red 状態）
- `outputs/phase-04/test-spec.md`
- 実行後に `artifacts.json` の `phase04.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
