# Phase 12: ドキュメント

## 1. 中学生レベル概念説明 (canonical heading: SSOT)

### 1.1 何が問題だったか (中学生レベル)

`/profile` というページには「公開停止」「再公開」「退会」を申請するボタンがあります。ボタンを押すと小さな確認画面 (これを **dialog** と言います) が開きます。

申請を送ったあと、本当はこの順番で動いてほしい:

1. ページの中身をもう一回サーバから読み直す (これが `router.refresh()`)
2. 親の画面に「送信されたよ」と伝える
3. 最後に dialog を閉じる

ところが今のコードでは順番がずれていて、「dialog を閉じてから親が読み直しをお願いする」形になっています。すると、

- 画面がほんの一瞬だけ古いままに見える
- React が「もう消えた部品から呼ばれた」とブラウザの警告コンソールに文句を出すことがある

このズレを直すのがこのタスクです。

### 1.2 どう直すか (中学生レベル)

「読み直しのお願い」を **dialog の中** で先に出すように変えます。順番が `読み直し → 親に伝える → dialog を閉じる` になり、閉じるのが最後になるので、上の問題が起きません。

### 1.3 用語

| 用語 | やさしい言い換え |
|------|----------------|
| dialog | 確認するために開く小さい画面 |
| `router.refresh()` | ページの中身をサーバから取り直す合図 |
| `onSubmitted` | 親の画面に「送信成功したよ」と知らせる関数 |
| `onClose` | dialog を閉じる関数 |
| race condition | 「どっちが先に終わるか分からない」せいで起きるバグ |

## 2. 仕様書 / 参照ドキュメント更新

| ファイル | 更新内容 |
|---------|---------|
| `docs/30-workflows/LOGS.md` | 本 workflow の完了を 1 行追記 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md` | status を `implemented` に更新 (canonical_workflow に本 workflow ID を記載) |
| `docs/30-workflows/unassigned-task/integration-fixes-i03-dialog-refresh-order.md` | issue #766 と本 workflow への参照を追加し、`docs/30-workflows/completed-tasks/` へ移送 (CONST_007 / completed-tasks-policy 準拠) |

## 3. 不要な更新

- CLAUDE.md: 変更不要 (不変条件に影響なし)
- aiworkflow-requirements skill references: 変更不要 (UI 副作用順序は skill の管理対象外)

## 4. DoD

- [ ] §1 の中学生レベル説明が canonical heading 構成で記述されている
- [ ] LOGS.md に 1 行追記
- [ ] spec.md の status 更新
- [ ] unassigned-task → completed-tasks 移送
- [ ] verify-phase12-compliance CI gate を意識した heading SSOT を守っている (h2/h3 一貫)
