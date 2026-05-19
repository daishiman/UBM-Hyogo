# Implementation Guide — issue-769-root-error-focus

## Part 1: 中学生レベル

### なぜ必要か

エラー画面が出たとき、読み上げソフトを使っている人は「今どこを読めばよいか」をすぐ知る必要があります。カーソルが前の画面に残ったままだと、新しく出たエラーに気付くのが遅れます。

学校で先生が黒板に大事なお知らせを書いたとき、何も言わずに授業を進めると生徒は気付きにくいです。先生が「ここを見てください」と黒板の見出しを指すと、全員がすぐ内容に気付けます。この変更は、エラー画面の大見出しを指してあげるためのものです。

### 何をするか

エラー画面が出た瞬間に、画面の大見出し「画面を表示できませんでした」へ自動でカーソルを移します。読み上げソフトはカーソルが当たっている場所を読みやすいため、ユーザーがエラーにすぐ気付けます。

`preventScroll: true` を使うので、カーソルが移っても画面が勝手に上へ動きません。

### 用語の言い換え

| 用語 | 日常語での説明 |
| --- | --- |
| フォーカス | 画面上の「今ここを見ている・使っている」という印 |
| h1 | ページの一番大きな見出し |
| 読み上げソフト | 画面の文字を声で読んでくれる道具 |
| preventScroll | カーソルを移しても画面を勝手に動かさないお願い |
| tabIndex=-1 | キーボードの Tab では止まらないが、プログラムからはカーソルを当てられる印 |

## Part 2: 技術者向け

- `apps/web/app/error.tsx` に `useRef<HTMLHeadingElement>(null)` を追加
- 既存 `useEffect([error])` で `logger.error(...)` の後に `headingRef.current?.focus({ preventScroll: true })` を実行
- h1 に `ref={headingRef}` と `tabIndex={-1}` を付与
- `apps/web/app/__tests__/error.component.spec.tsx` に TC-U-09a/b/c を追加
- `role="alert"` / `aria-live="assertive"` / digest 表示 / reset ボタン / className は維持

## Verification

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component
```
