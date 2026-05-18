# Phase 12: Open Runtime Boundary / 概念説明（中学生レベル）

[実装区分: 実装仕様書]

## 1. unassigned-task consumed 化

`docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md` を `consumed (issue-746, 2026-05-17)` に更新（Phase 8 §1.3 で実施）。

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md` の Open Runtime Boundary 該当行（存在する場合）も同様に更新。

## 2. 概念説明（中学生レベル）

### このタスクは何をするの？

ホームページの「部品」（ボタン、入力欄、ページ送り、矢印つきメニュー、エラー表示など）が「ちゃんと正しい見た目で表示されているか」を **写真に撮って残す** 作業です。

### なんで写真を撮るの？

人間が目で見るのは大変だし、見落とすこともあります。だから:

1. 一度「正解の写真」を撮っておく
2. 次にコードを直したとき、自動で写真を撮り直して「正解の写真」と見比べる
3. もし違っていたら「壊れたかも」とコンピューターが教えてくれる

この「正解の写真」のことを **baseline（ベースライン）** と呼びます。今回はその baseline を作る作業です。

### なんで前に終わらなかったの？

写真を撮るとき、コンピューターのハードディスク（写真などを保存する場所）が **満杯になっていて** 撮れませんでした。これを `ENOSPC` (No Space) と呼びます。

今回はハードディスクの整理が終わって空きができたので、ちゃんと撮れるはずです。撮るときの「整理のしかた」も runbook（Phase 10）に書いてあるので、次に同じ問題が起きてもすぐ直せます。

### Open Runtime Boundary って何？

「コードは書いたけれど、まだ **実際に動かして確認はしていない** 部分」のことです。今回のタスクで「動かして写真を撮る」ことで、この境界線を **越えて完了状態にする** ということです。

## 3. consumed 判定基準

| 条件 | 充足判定 |
|------|---------|
| 12 PNG 生成 | Phase 6 PNG count gate |
| state 更新 | Phase 8 §3 検証 |
| 視覚的整合 | Phase 11 §4 チェックリスト |
| 全 AC green | Phase 1 §2 |

全条件 green なら `consumed`、いずれか fail なら `pending-retry`。
