# Phase 4: テスト戦略 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 4 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Playwright spec のテスト計画、assertion 方針、storageState 取得手順、CI 上の実行可否を確定する。本タスクは visual evidence 取得が主目的なので unit / contract test は新規追加しない。

## 実行タスク

1. テストレベルごとの新規追加範囲を確定する。
2. Playwright spec の test plan（`describe` × `test`）を確定する。
3. storageState 取得手順とその安全運用を確定する。
4. CI 実行可否（GitHub Actions / 手元実行）を確定する。
5. coverage への影響と除外方針を確定する。

## 参照資料

- Phase 2 outputs/main.md
- Phase 3 outputs/main.md
- `apps/web/playwright.config.ts`
- `.github/workflows/`（CI 設定。staging job が無ければ追加対象外）
- `docs/00-getting-started-manual/specs/06-member-auth.md`

## テストレベル × 追加方針

| レベル | 追加 | 理由 |
| --- | --- | --- |
| unit (vitest) | なし | 仕様変更を伴わない |
| contract | なし | API 変更なし |
| integration | なし | shared 層変更なし |
| E2E (Playwright) | **追加** | M-08〜M-10 / M-16 の DOM read-only assertion |
| manual smoke | **追加** | M-14 / M-15 の人手認証フロー |
| visual regression | 採用しない | 静的画像比較は本タスクの目的（現状の read-only 確認）と一致しないため |

## Playwright spec テストプラン

`apps/web/playwright/tests/profile-readonly.spec.ts` (project: `staging`)

```ts
test.describe("profile read-only", () => {
  for (const viewport of [{name:"desktop", width:1280, height:800}, {name:"mobile", width:390, height:844}]) {
    test(`M-08 logged-in /profile screenshot (${viewport.name})`, ...);
    test(`M-09 no-form DOM count (${viewport.name})`, ...);
    test(`M-10 ?edit=true ignored (${viewport.name})`, ...);
  }
  test("M-16 logout redirects /profile to /login", ...);
});
```

### assertion 方針

```ts
const counts = await page.evaluate(() => ({
  form: document.querySelectorAll('form[data-edit], form[action*="profile"], form[method="post"]').length,
  input: document.querySelectorAll('input:not([type="hidden"]):not([type="search"])').length,
  textarea: document.querySelectorAll('textarea').length,
  submit: document.querySelectorAll('button[type="submit"], input[type="submit"]').length,
  editLink: document.querySelectorAll('a[href*="/profile/edit"]').length,
}));
expect(counts.form).toBe(0);
expect(counts.input).toBe(0);
expect(counts.textarea).toBe(0);
expect(counts.submit).toBe(0);
expect(counts.editLink).toBe(0);
```

DOM dump JSON は test 内で `fs.writeFileSync` ではなく Playwright `testInfo.attach` 経由で attach し、capture script 側が attach を `outputs/phase-11/dom/` にコピーする。

## storageState 取得手順

1. `pnpm --filter @ubm-hyogo/web exec playwright codegen --save-storage=apps/web/playwright/.auth/member-state.json https://staging.example/login` で staging 上ログインを 1 回実施
2. 取得した `member-state.json` を **コミットしない**（`apps/web/playwright/.auth/*.json` を gitignore）
3. CI で再現したい場合は GitHub Secrets に `PLAYWRIGHT_STORAGE_STATE_JSON` として保管し、job 内で書き出す（本タスクの MVP では CI 統合は実施せず手元実行のみ）

## CI 実行可否

| 経路 | 実行可否 | 理由 |
| --- | --- | --- |
| 手元 staging 実行 | 可 | storageState 直接保有 |
| GitHub Actions PR 上 | 不可（本タスクでは） | Magic Link/OAuth の secret を扱う必要があり、本タスクの責務外 |
| 09a staging visual smoke job | 移譲 | profile readonly テストの再利用は 09a で評価 |

## coverage への影響

- Playwright spec は coverage 計測対象外。`vitest.config.ts` に変更なし。
- `pnpm --filter @ubm-hyogo/web test --run --coverage` の結果に影響しない。Phase 9 で再確認。

## サブタスク管理

- [ ] テストレベル方針表の確定
- [ ] Playwright spec テストプラン確定
- [ ] storageState 取得手順の確定
- [ ] CI 実行可否の確定
- [ ] coverage 除外方針の確定
- [ ] outputs/phase-04/main.md に戦略要約を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| テスト戦略書 | `outputs/phase-04/main.md` |

## 完了条件

- [ ] Playwright spec テストプランが 6 test ケース（viewport 2 × marker 3 + M-16）以上で確定
- [ ] storageState を gitignore する手順が明記されている
- [ ] CI 統合は本タスクではしないことが記録されている
- [ ] coverage 影響なしが明示されている

## タスク100%実行確認

- [ ] unit / contract / integration test を不必要に追加していない
- [ ] visual regression（snapshot diff）を導入していない

## 次 Phase への引き渡し

Phase 5 へ、test plan・assertion・storageState 手順を引き渡す。
