# Phase 6: テスト追加（fail path / 回帰 guard）

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイル内の assertion / fail path を設計する。コードは仕様書内の例として示す。

## 6.0 目的

新規 spec `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` に、
baseline 取得だけでなく **「前提未達を早期に・明示メッセージで fail させる guard」** と **「mutation が一切起きていないことの assert」** を組み込む。
visual baseline の信頼性は「期待した状態に到達できたこと」を非 snapshot assertion で固めることで担保する（snapshot だけでは "空ページを撮る" 退行を検出できない）。

## 6.1 fail path 一覧

| ID | 前提未達 | 検出方法 | fail メッセージ（例） |
| --- | --- | --- | --- |
| FP-01 | storageState 不在 / 非 admin | `/admin/members` 到達後 `admin-members-row-*` が 0 件 | `認証付き admin storageState で /admin/members に到達できませんでした（行 0 件）。setup.staging-auth.ts の mint を確認` |
| FP-02 | member が 2 件未満 | 行 locator の `count()` < 2 | `選択 2 件が必要ですが member 行が N 件しかありません（staging seed を確認）` |
| FP-03 | tag master 0 件 | tag section 内に mode group はあるが pill が 0、かつ「付与可能なタグがありません」表示 | `tag master が 0 件のため picker を撮影できません（GET /admin/tags / staging tag seed を確認）` |
| FP-04 | snapshot 不一致 | `toHaveScreenshot` の組込み比較 | Playwright 既定の diff レポート（CI artifact） |

FP-01..03 は `expect(...).toBeGreaterThanOrEqual(...)` / カスタム message で **snapshot 比較の前に** 落とす。
これにより「未認証の login 画面を baseline として焼き込む」事故を構造的に防ぐ。

```ts
const rows = page.getByTestId(/^admin-members-row-/);
await expect(rows.first(), "認証付き /admin/members に到達できませんでした").toBeVisible({
  timeout: 15_000,
});
const rowCount = await rows.count();
expect(rowCount, `member 行が ${rowCount} 件（2 件以上必要）`).toBeGreaterThanOrEqual(2);
```

## 6.2 mutation 非実行の assert（AC-6 の機械化）

result サマリー要素 `data-testid="bulk-tag-result"` は `runBulkTags()` が成功して
`setBulkResult(...)` が走った時だけ DOM に現れる（`BulkActionBar.tsx:253`）。
よって **「baseline 撮影の全行程を通して `bulk-tag-result` が一度も現れないこと」** を assert すれば、
apply ボタン（`...を付与` / `...を解除`）を押していない＝staging D1 への副作用ゼロを機械的に保証できる。

```ts
const bulkRegion = page.getByRole("region", { name: "一括操作" });
// assign / unassign 両 baseline 撮影後、最終ガードとして:
await expect(
  page.getByTestId("bulk-tag-result"),
  "mutation を実行していないため結果サマリーは出てはいけない（AC-6）",
).toHaveCount(0);
```

加えて、テストは apply ボタンの存在を確認するが **click しない**（`locator(...).click()` を呼ばない）ことをコードレビュー観点として明記する。
apply ボタンは tag 未選択時 `disabled`（TC-BAB-TAG-05 / `tagDisabled`）なので、tag pill を選択しないまま撮る assign baseline では二重に副作用が起き得ない。

## 6.3 baseline 取得シナリオ（撮影状態の固定）

| 状態 | 操作（read-only） | snapshot arg |
| --- | --- | --- |
| assign-mode | 行 checkbox を 2 件チェック → bulk region 表示 → mode group 既定 `付与`（`aria-pressed=true`）を確認 → tag section を scope に撮影 | `bulk-tag-picker-assign-mode.png` |
| unassign-mode | 同上の選択を保ったまま mode group の `解除` を click（state 変更のみ・mutation でない）→ `aria-pressed` が `解除` 側に移ったのを確認 → 撮影 | `bulk-tag-picker-unassign-mode.png` |

`解除` トグルは `setTagMode("unassign")`（`BulkActionBar.tsx:206`）のみを呼ぶ純粋な client state 変更で、ネットワーク mutation を伴わない。
撮影は bulk region を locator scope にして安定させる（`fullPage` ではなく region 限定）。アニメーションは `admin-dashboard-authenticated.spec.ts` と同じく `addStyleTag` + `animations: "disabled"` で抑止する。

```ts
const section = page.getByRole("region", { name: "一括操作" });
await expect(section.getByRole("group", { name: "付与モード" })).toBeVisible();
await page.addStyleTag({
  content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}",
});
await expect(section).toHaveScreenshot("bulk-tag-picker-assign-mode.png", {
  animations: "disabled",
  maxDiffPixelRatio: 0.05,
});
```

## 6.4 回帰 guard（既存テストの再確認）

新規 spec は apps ソースを変更しないため、機能本体の回帰は **既存 component spec を再走** することで担保する。

| 対象 | 内容 | 実行 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | TC-BAB-TAG-01..05（master load / assign trigger / 部分失敗集計 / unassign / disabled）+ a11y violations 0 | focused vitest（local 検証で実行） |

このタスクで apps ソースに変更が無いことから、上記 spec は **無変更で緑が維持される** ことを期待する（変化したら本タスクのスコープ逸脱を意味する＝即 stop シグナル）。

## 6.5 完了条件（Phase 6）

- FP-01..04 の fail path が spec に設計として明記されている
- `bulk-tag-result` non-existence assert が AC-6 を機械化している
- assign / unassign 2 状態の撮影手順が region scope で固定されている
- BulkActionBar.spec.tsx を回帰 guard として参照している
