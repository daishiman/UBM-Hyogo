# Phase 11: VISUAL evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | VISUAL evidence |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | completed |
| visualEvidence | VISUAL |

## 目的

mutation 成功直後の `RequestPendingBanner` 即時反映を Playwright screenshot で証跡化する。

## 11-1. screenshot 取得シナリオ

| # | シナリオ | スクリーンショット名 | 期待 |
| --- | --- | --- | --- |
| 1 | profile 初回ロード（pending なし） | `01-profile-initial.png` | banner 非表示。「公開を停止する」「退会を申請する」ボタン enabled |
| 2 | 公開停止 dialog open | `02-visibility-dialog-open.png` | dialog 表示。理由 textarea / 申請ボタン |
| 3 | 公開停止 mutation 成功直後（dialog close & banner 表示） | `03-visibility-banner-shown.png` | dialog 消失。banner (visibility_request) 表示。「公開を停止する」ボタン disabled |
| 4 | 退会 dialog open（confirmed checkbox） | `04-delete-dialog-confirmed.png` | checkbox にチェック / 退会申請ボタン enabled |
| 5 | 退会 mutation 成功直後 | `05-delete-banner-shown.png` | banner (delete_request) 表示 / 「退会を申請する」disabled |

## 11-2. canonical path 列挙

```
docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/
├── visual-evidence.md
└── screenshots/
    ├── 01-profile-initial.png
    ├── 02-visibility-dialog-open.png
    ├── 03-visibility-banner-shown.png
    ├── 04-delete-dialog-confirmed.png
    └── 05-delete-banner-shown.png
```

## 11-3. Playwright spec 方針

新規または既存の `apps/web/tests/e2e/profile.spec.ts` に以下のシナリオを追加（既存 e2e に統合可能なら統合）:

```ts
test("visibility request → banner instant reflect", async ({ page }) => {
  // 1. login + navigate
  await page.goto("/profile");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.screenshot({ path: "outputs/phase-11/screenshots/01-profile-initial.png" });

  // 2. open dialog
  await page.getByTestId("open-hide-dialog").click();
  await page.screenshot({ path: ".../02-visibility-dialog-open.png" });

  // 3. submit
  await page.getByTestId("visibility-submit").click();

  // 4. banner 即時表示（reload 前）
  await page.locator('[data-pending-type="visibility_request"]').waitFor({ state: "visible" });
  await page.screenshot({ path: ".../03-visibility-banner-shown.png" });
});
```

DELETE 側も同様のフロー。

## 11-4. 取得タイミング

- 実装完了後 + AC-1〜AC-6 PASS 後
- staging 環境ではなくローカル `pnpm --filter @ubm-hyogo/web dev` で取得（test アカウント `manju.manju.03.28@gmail.com` 使用）
- screenshot は Phase 13 PR 本文に参照を含める

## 11-5. test アカウント注意事項

- 退会 mutation は不可逆。テストアカウント `manju.manju.03.28@gmail.com` で実施すると後続テストに影響する可能性
- 推奨: staging D1 上の dummy アカウントを別途用意するか、テスト後に admin 経由で revert する
- screenshot は dialog open / submit 直後を取得すれば良く、実際の delete 完了状態までは進めない

## 実行タスク

- [x] 5 screenshot シナリオを定義する
- [ ] Playwright spec の追加方針を記録する
- [ ] canonical path を列挙する
- [ ] test アカウント注意事項を明記する
- [ ] `outputs/phase-11/visual-evidence.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/visual-evidence.md | screenshot シナリオ + canonical path |
| 画像 | outputs/phase-11/screenshots/*.png | 5 枚（実装完了後に取得） |

## 完了条件

- [x] 5 screenshot のシナリオが定義されている
- [ ] Playwright spec の方針が記録されている
- [ ] canonical path が列挙されている

## 次 Phase

- 次: 12 (正本同期)
- 引き継ぎ事項: screenshot 5 枚の参照 path（PR 本文用）
