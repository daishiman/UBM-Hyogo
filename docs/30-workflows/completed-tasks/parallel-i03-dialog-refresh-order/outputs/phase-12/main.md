# Phase 12 Main

## 結論

`parallel-i03-dialog-refresh-order` は `implemented_local_evidence_captured / implementation / NON_VISUAL` として close-out する。Phase 13 の commit / push / PR は user approval gate。

Review feedback applied in this cycle: duplicate pending branches now preserve the previous refresh behavior via dialog-owned `refresh -> onSubmitted`, while success branches keep `refresh -> onSubmitted -> onClose`.

## 中学生レベルの説明

友だちに連絡して、黒板を書き直してから教室を出る場面に近い。先に教室を出てしまうと、黒板を書き直す人がいなくなって困る。今回の修正では、画面を新しくする合図を先に出し、そのあと「送れたよ」と親画面へ知らせ、最後に小さな確認画面を閉じる。

## 実装結果

- dialog 2 件で `router.refresh()` を success path の先頭に移動。
- parent `RequestActionPanel` から refresh 発火を撤去。
- component spec で順序と非発火を検証。

## 4条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | completed | 原典 spec と canonical root を同期 |
| 漏れなし | completed | Phase 12 strict 7 outputs を実体化 |
| 整合性あり | completed | `implemented_local_evidence_captured` に統一 |
| 依存関係整合 | completed | dialog -> spec -> evidence -> aiworkflow sync |
