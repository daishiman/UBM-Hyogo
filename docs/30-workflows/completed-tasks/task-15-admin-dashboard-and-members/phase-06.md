# Phase 6: テスト拡充（fail path / a11y / edge case）

[実装区分: 実装仕様書]

> 目的: Phase 4 の todo を埋め、fail path・a11y violations・edge case を追加して回帰 guard を厚くする。

---

## 1. 追加テストケース

### 1.1 fail path

| ID | ファイル | ケース |
|----|---------|------|
| TC-FAIL-01 | `BulkActionBar.test.tsx` | `patchMemberStatus` が reject → `busy` が null に戻る（`finally` 解放確認） |
| TC-FAIL-02 | `MemberDrawer.test.tsx`（新規） | `/api/admin/members/:memberId` fetch が reject → `role="alert"` でエラーメッセージ表示 |
| TC-FAIL-03 | `MemberDrawer.test.tsx` | `memberId` prop 変更で前のデータが残らない（stale guard 動作） |
| TC-FAIL-04 | `MembersClientShell.test.tsx`（新規） | filter 変更時 `page` query が削除される |

### 1.2 edge case

| ID | ファイル | ケース |
|----|---------|------|
| TC-EDGE-01 | `KpiGrid.test.tsx` | `totalMembers === 0` で `Total members` が `0` 表示 |
| TC-EDGE-02 | `RecentActionsTable.test.tsx` | `actorEmail === null` で `system` 表示 |
| TC-EDGE-03 | `MembersTable.test.tsx` | `total < pageSize` で「次へ」が disabled |
| TC-EDGE-04 | `MembersTable.test.tsx` | `m.fullName === ""` で「(氏名未登録)」表示 |
| TC-EDGE-05 | `ZoneDistribution.test.tsx`（新規） | `byZone === undefined` で placeholder 表示、`role="status"` 取得可 |

### 1.3 a11y（jest-axe — Phase 4 todo 解消）

| ID | ファイル | アサーション |
|----|---------|-----------|
| TC-A11Y-01 | `KpiGrid.test.tsx` | `axe(container)` violations 0 |
| TC-A11Y-02 | `MembersFilters.test.tsx` | 同上、`role="search"` 取得可 |
| TC-A11Y-03 | `MembersTable.test.tsx` | 同上、`<th scope="col">` 必須 |
| TC-A11Y-04 | `RecentActionsTable.test.tsx` | 同上 |
| TC-A11Y-05 | `BulkActionBar.test.tsx` | 同上、`role="region"` + `aria-label="一括操作"` |
| TC-A11Y-06 | `MemberDrawer.test.tsx` | 同上、`role="dialog"` + `aria-labelledby` |

---

## 2. テスト実装テンプレート（jest-axe）

```ts
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("a11y violations 0", async () => {
  const { container } = render(<KpiGrid totals={baseTotals} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

`jest-axe` が devDependencies に無ければ Phase 6 着手前に追加:
```bash
mise exec -- pnpm -F @ubm-hyogo/web add -D jest-axe @types/jest-axe
```

---

## 3. 補助 command（テスト実行スクリプト）

`apps/web/package.json` の scripts に追加（既存に無ければ）:
```json
"test:admin": "vitest run src/features/admin"
```

実行:
```bash
mise exec -- pnpm -F @ubm-hyogo/web run test:admin
```

---

## 4. 完了条件（DoD）

- [ ] §1.1 fail path 4 ケース実装 + PASS
- [ ] §1.2 edge case 5 ケース実装 + PASS
- [ ] §1.3 a11y 6 ケース実装 + PASS（jest-axe violations 0）
- [ ] 計 21 + 15 = **36 ケース** が green
- [ ] `outputs/phase-06/test-results.md` に PASS 件数 + テスト ID 一覧

## 成果物

- 追加・拡張された `*.test.tsx`（既存 5 + `MemberDrawer.test.tsx` + `MembersClientShell.test.tsx` + `ZoneDistribution.test.tsx` 計 8 ファイル）
- `outputs/phase-06/test-results.md`
- 実行後に `artifacts.json` の `phase06.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
