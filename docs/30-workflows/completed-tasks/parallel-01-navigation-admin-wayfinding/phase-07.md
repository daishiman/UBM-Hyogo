# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | PARALLEL-01-NAV |
| タスク名 | parallel-01-navigation — admin 動線（sidebar logo / members→tags drawer link） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント反映) |
| 状態 | pending |
| 実装区分 | **実装仕様書** |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 判定根拠 | `AdminSidebar.component.spec.tsx` / `MemberDrawer.spec.tsx` の **実テストコード追加・更新**と既存 admin smoke E2E の拡張案を確定する。Phase 5 のシグネチャ・Phase 6 の JSX 差分に対応する Test ID とカバレッジ目標を固定する。 |

---

## 目的

spec.md §7 を完全展開し、ユニット（component）/ E2E（admin smoke） の 2 層テスト戦略を確定する。
カバレッジ目標は **lines ≥ 80%**（task-specification-creator §7.5）を必達とする。

---

## 7-1. テスト層と責務

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| component | `AdminSidebar` / `MemberDrawer` | vitest + @testing-library/react | href assertion / aria-label / keyboard focus / link text / encodeURIComponent / OKLch token 経由 |
| E2E smoke | admin 9 routes 巡回 + 新規シナリオ | Playwright（既存 admin smoke を拡張） | drawer open → tags link click → page transition と `focusMemberId` 受領 |

---

## 7-2. component テストケース

### 7-2-1. `AdminSidebar.component.spec.tsx`（最低 4 ケース）

| Test ID | シナリオ | 入力 | 期待 |
| --- | --- | --- | --- |
| AS-01 | logo link の href / aria-label | `<AdminSidebar />` を render | `getByRole("link", { name: "ホームに戻る" })` が `href="/"` を持つ |
| AS-02 | keyboard focus 到達 | link を `.focus()` | `toHaveFocus()` が true |
| AS-03 | HEX 直書きが含まれない | link element の className | `/\[#[0-9a-fA-F]{3,8}\]/` に match しない |
| AS-04 | link 内に visible label | link textContent | 1 文字以上の visible text |

### 7-2-2. `MemberDrawer.spec.tsx`（最低 4 ケース + special char）

| Test ID | シナリオ | 入力 | 期待 |
| --- | --- | --- | --- |
| MD-01 | 通常 memberId の href | `memberId="abc123"` | `href="/admin/tags?memberId=abc123"` |
| MD-02 | special char `@` を含む | `memberId="user@example"` | `href` の query が `encodeURIComponent("user@example")` 結果と一致（`%40`） |
| MD-03 | special char `/` を含む | `memberId="a/b"` | query が `%2F` を含む |
| MD-04 | special char `#` を含む | `memberId="x#y"` | query が `%23` を含む |
| MD-05 | link text | render 後 | `getByRole("link", { name: /タグ管理へ/ })` が hit |
| MD-06 | rendering / focus で onClose 未発火 | `onClose=vi.fn()` を渡し link を focus | `onClose` の call count が 0 |
| MD-07 | OKLch token 経由 | link className | HEX 直書き正規表現に match しない |

> AS-01..04 + MD-01..07 を必須 Test ID とする。`it.todo` / `test.todo` 残留禁止。

---

## 7-3. E2E smoke（既存 admin smoke 拡張案）

既存テストファイル想定: `apps/web/e2e/admin-smoke.spec.ts`（or `apps/web/playwright/tests/admin-pages.spec.ts`）。
存在しない場合は新規追加し、admin 9 routes 巡回と本タスクシナリオを併設する。

### シナリオ追加: E2E-NAV-01 (logo→home)

```ts
test("admin sidebar logo navigates to '/'", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "ホームに戻る" }).click();
  await expect(page).toHaveURL("/");
});
```

### シナリオ追加: E2E-NAV-02 (members drawer → tags)

```ts
test("members drawer link transitions to /admin/tags with memberId", async ({ page }) => {
  await page.goto("/admin/members");

  // 任意の会員行を click（先頭行を採用）
  await page.getByRole("row").nth(1).click();

  // drawer が開き、タグ管理リンクが視認できる
  await expect(page.getByRole("link", { name: /タグ管理へ/ })).toBeVisible();

  await page.getByRole("link", { name: /タグ管理へ/ }).click();

  // URL が /admin/tags?memberId=... に遷移
  await expect(page).toHaveURL(/\/admin\/tags\?memberId=.+/);
});
```

### 既存 admin 9 routes 巡回維持

`/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`, `/admin/attendance`（または現行 SCOPE で確定する 9 routes）を 200 で開けることを既存 smoke で継続検証する。本タスクで routes を削減・改名しない。

---

## 7-4. ローカル実行コマンド

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# component test（focused）
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer

# component test（全体・カバレッジ取得）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# E2E（admin smoke のみ）
mise exec -- pnpm --filter @ubm-hyogo/web e2e -- admin-smoke
```

---

## 7-5. カバレッジ目標

| 対象 | line | branch |
| --- | --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx`（差分行範囲） | ≥ 80% | ≥ 75% |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（差分行範囲） | ≥ 80% | ≥ 75% |
| 既存標準 | line ≥ 80% | branch ≥ 75% |

> E2E 拡張の lines coverage ≥ 80% は task-specification-creator §7.5 必達要件として明示。

---

## 7-6. 異常系・境界値

| カテゴリ | 観点 | 担当 Test ID |
| --- | --- | --- |
| URL encode | `@` `/` `#` を含む memberId | MD-02 / MD-03 / MD-04 |
| onClose 二重発火 | link focus / render で onClose を呼ばない | MD-06 |
| a11y | aria-label と keyboard focus | AS-01 / AS-02 |
| design tokens | HEX 直書き禁止 | AS-03 / MD-07 |
| 視覚 label | link が空ラベルでない | AS-04 / MD-05 |
| E2E | logo→`/` 遷移 | E2E-NAV-01 |
| E2E | drawer→tags 遷移と memberId 受領 | E2E-NAV-02 |

---

## 7-7. 不変条件（テスト側で守る）

- [ ] テストから `apps/api` D1 へ直接アクセスしない
- [ ] テストファイル名は `*.spec.tsx`（`*.test.tsx` 禁止）
- [ ] `it.todo` / `test.todo` を残さない
- [ ] mock URL に `127.0.0.1:8888` などローカル限定値を `src` 配下へ焼き込まない
- [ ] OKLch token assertion は HEX 直書き正規表現 `/\[#[0-9a-fA-F]{3,8}\]/` で否定する形に限定

---

## 7-8. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/parallel-01-navigation-admin-wayfinding/phase-05.md | 関数シグネチャ |
| 必須 | docs/30-workflows/parallel-01-navigation-admin-wayfinding/phase-06.md | JSX 差分 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | §7 テスト方針 |
| 参考 | https://testing-library.com/docs/queries/byrole/ | role クエリ |
| 参考 | https://playwright.dev/docs/test-assertions | E2E 期待値 API |

---

## 7-9. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | 2 層戦略・Test ID 一覧・カバレッジ目標・E2E 拡張案 |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 7-10. 完了条件

- [ ] AS-01〜AS-04 / MD-01〜MD-07 の必須 Test ID が定義
- [ ] E2E-NAV-01 / E2E-NAV-02 が記述
- [ ] special char (`@`, `/`, `#`) の encode ケースが MD-02 / MD-03 / MD-04 で網羅
- [ ] カバレッジ目標 lines ≥ 80% を明示
- [ ] 実行コマンドが `mise exec -- pnpm` 経由で記述
- [ ] HEX 直書き検出 assertion が記述
- [ ] `it.todo` / `test.todo` 残留禁止が明示

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-07 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（ドキュメント反映）
- 引き継ぎ事項:
  - E2E-NAV-01 / E2E-NAV-02 の追加は Phase 8 で SCOPE.md / implementation-guide.md の動線記述更新の根拠
  - カバレッジ目標 lines ≥ 80% は Phase 9 品質保証で再検証
- ブロック条件: special char encode ケース欠落、または HEX 直書き検出 assertion 欠落

---

作成日: 2026-05-15
