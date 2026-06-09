# Phase 8: リファクタ

> **実装区分: 実装仕様書** — 新規 spec / runner を、既存 authenticated spec 群・issue-1081 runner と整合する形で「最初から重複なく」設計する。

## 8.0 方針

新規ファイルのため「既存コードの書き換え」リファクタは無いが、**最初から重複と navigation drift が出ない構造**で書くことを Phase 8 の責務とする（後から剥がすのではなく最初から整える）。基準は read-only 先例 `admin-members-bulk-tag-authenticated.spec.ts` と issue-1081 `runtime-tag-bulk.sh`。

---

## 8.1 duplicate / navigation drift 削減テーブル（[Feedback RT-03]）

| 対象 | Before（素朴な書き方） | After（採用形） | 理由 |
| --- | --- | --- | --- |
| storageState 解決 | 各 test で path ベタ書き | ファイル冒頭で `test.use({ storageState: join(__dirname,"..","..",".auth","admin.storageState.json") })`（read-only spec と同一） | mint 出力先のドリフトを 1 箇所に集約・既存 authenticated spec と整合 |
| member 選択 → bulk region 取得 | all-success / partial-failure で「goto→synthetic 行 check→region 取得」を 2 回コピペ | `selectMembers(page, ids[])` ヘルパで「goto→指定 memberId 行 check→region 取得」を 1 化 | 重複排除（DRY）。行 locator 変更耐性を上げる |
| 撮影前アニメ抑止 | 各撮影で `addStyleTag` を重複 | `freezeAnimations(page)` ヘルパ（read-only spec の content 文字列を踏襲） | 抑止 CSS の重複と表記ゆれ排除 |
| canonical 名 | 撮影箇所に文字列直書き | `const SNAP = { allSuccess:"bulk-tag-result-all-success.png", partialFailure:"bulk-tag-result-partial-failure.png" }` に集約 | AC-4（artifacts ledger 一致）を 1 箇所参照にして照合容易化 |
| runner guard / run_d1 / cleanup / count_by_table / redact | issue-1081 と別実装で再発明 | issue-1081 `runtime-tag-bulk.sh` の関数構造を踏襲（mutation 部のみ Playwright 呼び出しに差し替え） | navigation drift / 構造ドリフトをゼロに保つ。guard・cleanup ロジックの分岐を増やさない |
| seed/cleanup SQL | issue-1081 SQL をコピー | `BEGIN/COMMIT` 除去 + 退会済み member 追加で**新規作成** | D1 remote が明示トランザクション拒否（Phase 2 §2.2）。コピーは regression を生む |

---

## 8.2 spec 内 local ヘルパの形（外部 util を新設しない）

外部 util を新設せず spec ファイル内 local 関数に閉じる（他 spec へ影響を波及させない）。

```ts
const SNAP = {
  allSuccess: "bulk-tag-result-all-success.png",
  partialFailure: "bulk-tag-result-partial-failure.png",
} as const;

async function selectMembers(page: Page, memberIds: string[]) {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  for (const id of memberIds) {
    const row = page.getByTestId(`admin-members-row-${id}`);
    await expect(row, `synthetic member ${id} 行が見つかりません（seed を確認）`).toBeVisible({ timeout: 15_000 });
    await row.getByRole("checkbox").check();
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

all-success / partial-failure の本体は「選択 ID 配列 + 待機する result 状態 + SNAP 名」の差分のみになる:

```ts
const region = await selectMembers(page, ["e2e_test_issue1125_as_mem_1", "e2e_test_issue1125_as_mem_2"]);
await region.getByRole("button", { name: /issue1125 結果タグ1/ }).click(); // tag pill 選択
await region.getByRole("button", { name: /を付与$/ }).click();              // apply = 実 mutation
await expect(page.getByTestId("bulk-tag-result")).toBeVisible({ timeout: 20_000 });
await freezeAnimations(page);
await expect(region).toHaveScreenshot(SNAP.allSuccess, { animations: "disabled", maxDiffPixelRatio: 0.05 });
```

---

## 8.3 共通ヘルパ抽出の判断（read-only spec / 本 spec / issue-1081 runner）

| 共通化候補 | 判断 | 根拠 |
| --- | --- | --- |
| `disableAnimations`（freezeAnimations）content 文字列 | **抽出しない**（各 spec inline 踏襲） | read-only spec も本 spec も inline で同一文字列。共有 util 化は他 spec を巻き込む YAGNI。Rule of Three 未成立（authenticated spec 群はいずれも inline 慣習で揃っており、共有 helper 化は既存全 spec の書き換えを誘発する不要な波及） |
| `phase11ScreenshotsDir` 解決（raw screenshot 保存先） | **抽出しない**（spec local 踏襲） | read-only spec と同一の env/相対パス解決を inline で再掲。spec をまたぐ共有が 1 箇所（本 spec）増えるだけでは Rule of Three に達しない |
| storageState path | **抽出しない**（既存パターン準拠の inline） | 既存 authenticated spec も inline。整合優先 |
| runner の guard / run_d1 / cleanup / count_by_table | **共通化しない**（issue-1081 構造を踏襲した別ファイル） | issue-1081 runner は curl mutation 専用に組まれており、本 runner は Playwright mutation。共有スクリプト化すると mutation 経路の分岐（curl vs playwright）を 1 ファイルに抱え込み複雑化する。**構造の踏襲（同型コピーではなく同じ関数分割）に留める**のが整合的。仮に 3 本目の seed-cleanup runner が必要になった時点で初めて共通 lib 化を検討する（Rule of Three） |

→ 結論: **共有 util / 共有 runner lib は新設しない。** 既存 inline パターンに揃えることで navigation / 構造のドリフトをゼロに保つ。

---

## 8.4 新規 primitive を生やさない方針

- screenshot 対象は既存 `BulkActionBar` の result summary DOM（`bulk-tag-result` / `-counts` / `-skipped` / `-not-found`）。**新規 UI primitive / 新規 CSS / 新規トークンは作らない**（Phase 2 §2.5）。
- 新規 route 追加なし。遷移先は `/admin/members` のみ。
- → **navigation drift なし。**

---

## 8.5 完了条件（Phase 8）

- 対象 / Before / After / 理由テーブルが埋まっている（duplicate + navigation drift 削減・[Feedback RT-03]）
- spec local ヘルパ（`selectMembers` / `freezeAnimations` / `SNAP` const）が設計されている
- 共有ヘルパ（disableAnimations / phase11ScreenshotsDir / issue-1081 runner）の抽出可否が YAGNI / Rule of Three 観点で判断され、いずれも非抽出と明記されている
- 新規 primitive を生やさない方針・navigation drift なしが確認されている
