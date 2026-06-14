# Phase 7 成果物: ac-matrix（AC × TC × 実装ファイル 1:1 トレース）

> 状態: completed。AC-1〜AC-10 を全 TC（正常 TC-XX + 異常 TC-E-XX）と実装ファイルに 1:1 トレースする。

## 1. AC × TC × 実装ファイル トレース表

| AC | 内容（要約） | 担保 TC | 実装ファイル | 担保区分 |
| --- | --- | --- | --- | --- |
| AC-1 | visibility で `公開→非公開` 遷移を 1 箇所に強調表示 | TC-01, TC-02, TC-09 | RequestQueueDetail.tsx（diff 行 + `buildPublishStateDiff`） | テスト |
| AC-2 | delete は「在籍→退会」で混同しない | TC-03, TC-04, TC-10, TC-E-05, TC-E-08 | RequestQueueDetail.tsx | テスト |
| AC-3 | publishState 生値を日本語ラベルへ変換・英語非露出 | TC-05, TC-08, TC-E-01, TC-E-02, TC-E-03, TC-E-04 | RequestQueueDetail.tsx（`formatPublishStateLabel`） | テスト |
| AC-4 | diff 強調色が OKLch トークン経由で design-tokens.md 整合 | （token 名実在確認 + TC は色値非 assert） | globals.css | 機械検証（token 実在 + verify-design-tokens） |
| AC-5 | HEX 直書き 0 件・verify-design-tokens PASS | （HEX grep gate） | globals.css / 3 component | 機械検証（HEX grep / verify-design-tokens） |
| AC-6 | 新規 primitive 追加 0 件 | （primitive catalog 差分なし） | （`components/ui/` 追加なし） | 機械検証 + レビュー |
| AC-7 | 新 endpoint/D1/projection 拡張なし・apps/api diff 空 | （`git diff -- apps/api packages/shared` 空） | （apps/api 不変） | 機械検証（git diff） |
| AC-8 | ダイアログが visibility 具体遷移文言 / delete 退会文言 | TC-11, TC-12, TC-E-07 | RequestQueuePanel.tsx（`destructiveMessage`）/ RequestConfirmDialog.tsx（92 行緩和） | テスト |
| AC-9 | 矢印 aria-hidden / before-after テキスト意味担保 / 既存 aria 不変 | TC-06, TC-07, TC-E-09 | RequestQueueDetail.tsx | テスト |
| AC-10 | 既存 3 spec green 維持 + note_type 別 diff assertion PASS / ルート・API パス・セレクタ不変 | TC-R-01, TC-R-02, TC-R-03, TC-E-06 | 3 spec / 3 component | テスト |

## 2. TC → AC 逆引き（全 TC がいずれかの AC にマップ）

| TC | AC |
| --- | --- |
| TC-01 | AC-1, AC-3 |
| TC-02 | AC-1, AC-3 |
| TC-03 | AC-2 |
| TC-04 | AC-2 |
| TC-05 | AC-3 |
| TC-06 | AC-9 |
| TC-07 | AC-9, AC-10 |
| TC-08 | AC-3 |
| TC-09 | AC-1, AC-3 |
| TC-10 | AC-2 |
| TC-11 | AC-8 |
| TC-12 | AC-8 |
| TC-E-01 | AC-3 |
| TC-E-02 | AC-3 |
| TC-E-03 | AC-3 |
| TC-E-04 | AC-3 |
| TC-E-05 | AC-2, AC-10 |
| TC-E-06 | AC-10 |
| TC-E-07 | AC-8 |
| TC-E-08 | AC-2 |
| TC-E-09 | AC-9 |
| TC-R-01 | AC-10 |
| TC-R-02 | AC-8, AC-10 |
| TC-R-03 | AC-10 |

## 3. 未カバー AC 宣言

**未カバー AC: 0 件**。AC-1〜AC-10 のすべてがテスト（TC-XX / TC-E-XX）または機械検証 gate（verify-design-tokens / HEX grep / `git diff -- apps/api packages/shared` / primitive catalog 差分）にマップされている。テスト担保 = AC-1/2/3/8/9/10、gate 担保 = AC-4/5/6/7。

> 本サイクルは spec_created（仕様書作成のみ）。実測 line/branch カバレッジ値は実装サイクルで `outputs/phase-07/main.md` §3 の記録欄に転記する。
