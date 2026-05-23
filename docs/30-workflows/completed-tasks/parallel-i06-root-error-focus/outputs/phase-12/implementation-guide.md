# Phase 12 implementation guide — parallel-i06-root-error-focus

## Part 1 — 中学生にも分かる説明

### なぜ直したのか

エラー画面は、学校の放送で「大事なお知らせです」と伝える場面に近い。
放送が始まっても、最初に何が起きたか分からない場所から読まれると、聞いている人は困る。
今回の修正は、エラー画面が出た瞬間に一番大事な見出しへ読み上げ位置を合わせるためのもの。

### 何を直したのか

画面に「画面を表示できませんでした」という見出しがある。
その見出しを、エラー画面が開いた直後の最初の案内場所にした。
目で画面を見ている人には見た目が大きく変わらないが、読み上げソフトを使う人には最初の案内が分かりやすくなる。

### どう確かめたのか

テストでは、エラー画面を表示したあと、見出しが選ばれた状態になることを確認した。
また、管理者へ伝えるためのエラーIDが消えていないことも確認した。

### 専門用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| focus | 今どこを見ているか、操作しているかを示す印 |
| h1 | ページで一番大事な見出し |
| screen reader | 画面の文字を読み上げる道具 |
| error boundary | 画面が壊れた時に代わりのエラー画面を出す仕組み |
| digest | 管理者へ伝えるための短いエラー番号 |
| `tabIndex={-1}` | ふだんの順番には入れず、プログラムからだけ選べるようにする指定 |

## Part 2 — 技術者向け詳細

### 実装要約

`apps/web/app/error.tsx` は `useRef<HTMLHeadingElement>` で h1 を保持し、既存 `useEffect` 内で `logger.error` の直後に `headingRef.current?.focus({ preventScroll: true })` を呼び出す。
`tabIndex={-1}` により h1 を programmatic focus 可能にし、通常の tab order には混ぜない。
既存の文言、digest 表示、dev stack 表示、token class は変更しない。

### テスト要約

`apps/web/app/error.spec.tsx` は component render 後の `document.activeElement` を h1 と比較する。
同じ test で `logger.error` の event / digest / err payload も検証し、digest 表示 regression も別ケースで確認する。
Phase 11 の `test.log` は package test script ではなく direct Vitest invocation で取得し、`apps/web/app/error.spec.tsx` 1 ファイル / 2 tests PASS を確認する証跡として扱う。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx
```

### Phase 11 / Screenshot 境界

本タスクは `visualEvidence: NON_VISUAL` であり、スクリーンショットは必須ではない。
視覚的なレイアウト変更ではなく、error boundary mount 時の focus 副作用をテストで検証するタスクである。
`outputs/phase-11/evidence/` には typecheck、lint、direct Vitest run、grep gate、diff evidence を置く。

### 正本同期

source spec、unassigned task、integration-fixes index に canonical workflow pointer と consumed / implemented state を反映する。
aiworkflow-requirements には quick-reference、resource-map、task-workflow-active、artifact inventory、changelog、LOGS、generated indexes を同一 wave で登録する。
`outputs/artifacts.json` は root `artifacts.json` の full mirror とし、summary marker ではなく同一 schema / phase map を持たせる。

### 完了条件

`apps/web/app/error.tsx` の h1 focus 実装、`apps/web/app/error.spec.tsx` の focus / logger / digest 検証、Phase 11 evidence、Phase 12 strict 7、root / outputs artifacts full mirror、Phase 13 user gate がすべて揃っていること。
