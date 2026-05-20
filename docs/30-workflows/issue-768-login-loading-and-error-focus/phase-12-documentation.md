# Phase 12: ドキュメント（中学生レベル概念説明含む）

## 1. 中学生レベル概念説明

### 1.1 「ローディング画面」って何？

ウェブサイトのページが表示されるまでには、サーバーから情報を取りに行って画面を組み立てる時間がかかる。その「ちょっと待ってね」の間に出す仮の画面が **ローディング画面**。何も出ないと、画面が真っ白で「壊れたのかな？」と不安になる。

このタスクでは、`/login`（ログインページ）を開くときに出る「カクカクした灰色の四角」を skeleton と呼び、それを表示する仕組みを作る。

### 1.2 「エラー画面」って何？

サーバーが何かに失敗したり、プログラムにバグがあるとページが壊れる。そのとき画面真っ白だと困るので、「エラーが起きました、もう一回試してね」と表示する画面が **エラー画面**。今回は `/login` 用のエラー画面に手を加える。

### 1.3 「スクリーンリーダー」って何？

目が見えない / 見えにくい人のために、画面の文字を**音声で読み上げる**ソフト（VoiceOver / NVDA など）。普通の人が画面を「目で見る」のと同じ役割を、音で果たす。

### 1.4 「フォーカス移譲」って何？

ウェブページには「今ここにカーソルが当たってる」という状態がある。Tab キーで入力欄を移動するときの「枠線が付いている要素」がそれ。これを **フォーカス** と呼ぶ。

エラーが起きたとき、「エラーです！」という見出しに**自動で**フォーカスを移すと、スクリーンリーダーがその見出しを即座に読み上げてくれるし、キーボードユーザーも「再読み込み」ボタンまで Tab 1 回で行ける。これが **フォーカス移譲**。

### 1.5 「aria-live」って何？

スクリーンリーダーに「ここに新しい情報が出たら、すぐ読んで」と伝える HTML 属性。

- `aria-live="polite"`: 今読んでる文章が終わってから読んで（控えめ）
- `aria-live="assertive"`: すぐ読んで（強め）

エラーは緊急性が高いので `assertive`、ローディングは急ぐ必要ないので `polite` を使う。

### 1.6 「OKLch トークン」って何？

色を表す数値のセット。`#FF0000`（赤）みたいに直接書くのではなく、「`--ubm-color-surface-2`」みたいな**名前**で色を指定する仕組み。
こうしておくと、後で「全部の灰色をちょっと暗くしたい」と思ったとき、名前の定義を 1 ヶ所変えるだけで全画面が一斉に変わる。

## 2. 仕様書として残す情報

- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- 本 issue: `#768`
- 解決した課題: parallel-07 DoD line 141, 142 の未達
- 横展開: i06 (root error focus) 完了後に `useAutoFocusOnMount` hook 抽出

## 3. CHANGELOG（任意）

apps/web に CHANGELOG がある場合のみ追記:

```
## Unreleased
- a11y: /login に loading boundary を追加、error boundary に focus 移譲と aria-live=assertive を実装 (#768)
```

## 4. 更新対象 doc 一覧

| File | 更新内容 |
|---|---|
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` | i05 行を `implemented` に |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md` | 末尾に「Implemented in issue #768 / PR #<n>」追記 |
| parent parallel-07 spec（line 141, 142 該当箇所） | 「Resolved by #768」コメント追加 |
