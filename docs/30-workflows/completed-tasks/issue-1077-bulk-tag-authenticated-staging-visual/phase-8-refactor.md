# Phase 8: リファクタ

> **実装区分: 実装仕様書** — 新 spec の構造を、既存 authenticated spec 群と整合する形で設計する。

## 8.0 方針

新 spec は新規ファイルのため「既存コードの書き換え」リファクタは無いが、
**最初から重複が出ない構造で書く**ことを Phase 8 の責務とする（後から剥がすのではなく、最初から整える）。
基準は既存 `admin-dashboard-authenticated.spec.ts` / `admin-tags-authenticated.spec.ts` の storageState パターン。

## 8.1 リファクタ（=最初から整える）対象テーブル

| 対象 | Before（素朴な書き方） | After（採用形） | 理由 |
| --- | --- | --- | --- |
| storageState 解決 | 各 test で path をベタ書き | ファイル冒頭で `test.use({ storageState: join(__dirname, "..","..",".auth","admin.storageState.json") })`（既存 spec と同一） | 既存 authenticated spec との共通パターンに揃え、mint 出力先のドリフトを 1 箇所に集約 |
| picker 撮影 2 状態 | assign / unassign で goto〜選択を 2 回コピペ | `prepareBulkRegion(page)` ヘルパで「到達→2件選択→region 取得」を 1 回化し、2 状態は mode 切替＋撮影のみ差分 | 重複排除（DRY）。選択ロジックの 1 箇所化で行 locator 変更への耐性を上げる |
| 撮影前処理 | 各撮影で addStyleTag を重複 | `freezeAnimations(page)` ヘルパ（既存 dashboard spec の content 文字列を踏襲） | アニメ抑止 CSS の重複と表記ゆれを排除 |
| canonical 名 | 文字列を撮影箇所に直書き | `const SNAP = { assign: "bulk-tag-picker-assign-mode.png", unassign: "bulk-tag-picker-unassign-mode.png" }` const に集約 | AC-4（artifacts ledger との一致）を 1 箇所参照にして照合容易化 |

## 8.2 ヘルパ関数（spec 内 local）の形

外部 util を新設せず、spec ファイル内 local 関数に閉じる（他 spec へ影響を波及させない）。

```ts
async function prepareBulkRegion(page: Page) {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  const rows = page.getByTestId(/^admin-members-row-/);
  await expect(rows.first(), "認証付き /admin/members 未到達").toBeVisible({ timeout: 15_000 });
  expect(await rows.count(), "member 行 2 件未満").toBeGreaterThanOrEqual(2);
  // 行内の選択 checkbox（aria-label="{fullName} を選択"）を先頭 2 件チェック
  for (const cb of (await page.getByRole("checkbox", { name: /を選択$/ }).all()).slice(0, 2)) {
    await cb.check();
  }
  const region = page.getByRole("region", { name: "一括操作" });
  await expect(region).toBeVisible();
  return region;
}

function freezeAnimations(page: Page) {
  return page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}",
  });
}
```

assign / unassign の本体は以下のように差分のみになる:

```ts
const region = await prepareBulkRegion(page);
await freezeAnimations(page);
await expect(region).toHaveScreenshot(SNAP.assign, { animations: "disabled", maxDiffPixelRatio: 0.05 });

await region.getByRole("button", { name: "解除" }).click(); // client state のみ
await expect(region.getByRole("button", { name: "解除" })).toHaveAttribute("aria-pressed", "true");
await expect(region).toHaveScreenshot(SNAP.unassign, { animations: "disabled", maxDiffPixelRatio: 0.05 });
```

## 8.3 既存 spec との共通化余地（過剰共通化はしない）

| 共通化候補 | 判断 |
| --- | --- |
| storageState path（`.auth/admin.storageState.json`） | **既存パターンに準拠**（共有 util 化はしない＝既存 spec も inline のため整合優先） |
| `freezeAnimations` の content 文字列 | 既存 dashboard spec と同一文字列を採用。共有 util への切り出しは本タスクのスコープ外（他 spec を巻き込むため YAGNI） |
| 行選択ロジック | 新 spec のみで使うため spec local に留める |

→ 共有 util の新設は行わない。既存の inline パターンに揃えることで navigation / 構造のドリフトをゼロに保つ。

## 8.4 navigation drift チェック

- 遷移先は `/admin/members` のみ。新規ルート追加なし。
- 既存 admin shell / sidebar / route 定義に変更なし（テストコードのみ追加）。
- → **navigation drift なし**。

## 8.5 完了条件（Phase 8）

- 対象 / Before / After / 理由テーブルが埋まっている
- 重複排除（`prepareBulkRegion` / `freezeAnimations` / `SNAP` const）が設計されている
- 共有 util を新設しない判断（YAGNI）が明記されている
- navigation drift なしが確認されている
