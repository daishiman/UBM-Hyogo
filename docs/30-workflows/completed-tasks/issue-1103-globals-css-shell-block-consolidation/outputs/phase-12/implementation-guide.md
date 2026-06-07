# Implementation Guide — issue-1103 globals.css 重複 shell ブロック 1 本化

- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new / status: implemented_local_evidence_captured）
- workflow: `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/`
- issue: #1103（CLOSED）/ 本仕様書は CLOSED のまま現行コードへ再スコープ（reopen しない）
- 対象ファイル: `apps/web/src/styles/globals.css`（唯一の変更対象）

---

## Part 1（やさしい説明 / 中学生レベル）

### 背景（なぜ必要か）

このタスクが必要な理由は、**同じ文章が説明書に 2 回コピペされて残っている**からです。

たとえば、組み立て家具の説明書を作っているとき、「ネジを締める手順」のページを間違えて 2 回印刷してしまったとします。中身がまったく同じなら、読む人は「あれ、さっきと同じことが書いてある？　何か違うのかな？」と迷ってしまいます。実際にはどちらか 1 つで十分なのに、同じものが 2 つあるだけで混乱が生まれます。

今回のプログラムでも同じことが起きています。サイト全体の見た目（色・余白・サイドバーの形など）を決めるスタイルの「設計図」ファイルがあり、その中に、まったく同じ内容のかたまり（ブロック）が**1 文字も違わずに 2 回**書かれていました。専門用語では、見た目を決めるこの設計図を「CSS」と呼びます。

### 何をするか（要約）

やることはとてもシンプルです。**同じ内容のかたまりが 2 つあるので、後から書かれた方（コピーの方）を 1 つ消すだけ**です。

- 最初に書かれているかたまり（1642〜1772 行）は、そのまま残します。
- 後から書かれた同じ内容のかたまり（1774〜1904 行）を、まるごと消します。
- 消すかたまりは、残すかたまりと **1 文字も違わない**ことを先に確かめます。

### なぜ見た目は変わらないのか

「設計図を消したら見た目が変わってしまうのでは？」と心配になるかもしれません。でも今回は大丈夫です。理由は 2 つあります。

1. 消すかたまりは、残すかたまりと**まったく同じ内容**だから（同じことが 2 回書いてあるだけ）。
2. 2 つのかたまりは**同じ場所・同じルールの下**に置かれているから（片方だけが特別な条件で効く、ということがない）。

同じ料理のレシピが 2 枚あって、1 枚捨てても、残った 1 枚があれば同じ料理が作れるのと同じです。

### 実装ステップ（やさしい順番）

1. まず「後の方のかたまりが、前の方とまったく同じか」を確かめる（diff という比較ツールで「差が 0」を確認）。
2. 確認できたら、後の方のかたまり（1774〜1904 行）をまるごと消す。
3. ビルド（プログラムを組み立てる作業）を動かして、エラーが出ないことを確かめる。
4. 色のルール（トークン）のチェックを動かして、何も壊れていないことを確かめる。

### 既知の注意点

- これは画面（見た目）を一切変えない作業です。だからスクリーンショットは不要です。
- もし「2 つのかたまりに差がある」と分かったら、その場で作業を止めます（差があるのに消すと見た目が変わってしまうため）。

---

## Part 2（開発者向け詳細）

### 背景

`apps/web/src/styles/globals.css` 内で、`@layer components`（124 行開始）直下に **`parallel-01 P1-1〜P1-5` ブロック（約 130 行）が byte 完全一致で 2 回**定義されている。親タスク `sidebar-footer-pinning-and-account-popover-ux` の Phase 8 Task 8-1 で「整合のみ」を実施し、重複の物理統合は本 follow-up（issue-1103）へ分離された。本タスクは後発の重複ブロックを削除して 1 本化する。

### 要約

- keep（残す）: ブロック 1 = **1642-1772 行**（先発・parallel-01 P1-1〜P1-5）。
- delete（削除）: ブロック 2 = **1774-1904 行**（後発・ブロック 1 と byte 完全一致）。
- diff = ブロック 2 の除去のみ。残存ブロックの値・他の selector は無変更。
- 視覚不変は「byte 一致 + cascade 文脈同一」の二重証明で保証する。

### 対象 selector 一覧（parallel-01 P1-1〜P1-5）

| サブブロック | 概念 | 主な selector |
| --- | --- | --- |
| P1-1 | page surface | `[data-route]` |
| P1-2 | section rhythm | `[data-section*]` |
| P1-3 | card chrome | `[data-card*]` |
| P1-4 | shell surface | `[data-shell="topbar"]` / `[data-shell="sidebar"]` / `[data-shell="footer"]` |
| P1-5 | typography | `[data-text*]` |

### 削除ブロック行範囲（アンカー文字列特定法）

行番号は将来シフトし得るため、削除時は **アンカー文字列**でブロック境界を再特定する（行番号は 2026-06-05 現行の参考値）:

- ブロック 2（削除対象）の先頭アンカー: 後発の `parallel-01 P1-1` page surface コメント / `[data-route]` ルールの **2 回目の出現**（現行 1774 行付近）。
- ブロック 2 の末尾アンカー: 後発の `parallel-01 P1-5` typography（`[data-text*]`）ルールの **2 回目の出現の閉じ括弧**（現行 1904 行付近）。
- 削除範囲 = この 2 回目の出現群（1774-1904）全体。1 回目の出現群（1642-1772・ブロック 1）は残す。

### `[data-shell="sidebar"]` 出現箇所（重要）

| 行（現行 2026-06-05） | 内容 | 削除対象か |
| --- | --- | --- |
| 1708 | ブロック 1 内（残す）の `[data-shell="sidebar"]` | 残す |
| 1840 | ブロック 2 内（削除）の `[data-shell="sidebar"]` | **削除** |
| 2306 | `[data-route-group="admin"] [data-shell="sidebar"]`（@media (max-width:767px) 内・admin スコープ派生） | **削除対象外**（別 selector・別 cascade 文脈） |

→ 削除後の `grep -n 'data-shell="sidebar"'` は **2 件**（1708 由来 1 件 + 2306 由来 1 件）になる（AC-1）。削除前は 3 件。

> **issue の現行コード最適化（核心）**: issue #1103 は重複対象を `[data-shell]` + typography と記述し、行番号を 1417/1549 と記すが、これは陳腐化している。現行実態は `parallel-01 P1-1〜P1-5` ブロック全体が 1642-1772 / 1774-1904 に重複しており、`[data-shell="sidebar"]` の行も 1708/1840 へシフトしている。本仕様は現行コードへ再 grep して範囲を再スコープした。

### cascade 同一性の根拠（AC-3 / AC-5）

両ブロックが視覚不変に削除できる根拠は二重証明:

1. **byte 一致**: `diff <(ブロック1) <(ブロック2)` が **空**（実機検証済み・差分 0 行）。内容が完全同一なので、後発削除後も同一ルールが残る。
2. **cascade 文脈同一**: 両ブロックとも同一 `@layer components`（124 行開始）直下・**@media 非内包**。layer 順・specificity・media 条件がすべて同一のため、CSS の cascade で「片方だけが特定条件で勝つ」状況が発生し得ない。

この 2 条件が同時成立するとき、後発ブロックの削除は computed style を**数学的に不変**にする。

### 検証コマンド

```bash
# AC-3: 2 ブロックの byte 一致（削除前・diff 空を期待）
diff <(sed -n '1642,1772p' apps/web/src/styles/globals.css) \
     <(sed -n '1774,1904p' apps/web/src/styles/globals.css)

# AC-1: data-shell="sidebar" 出現件数（削除前 3 / 削除後 2 を期待）
grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css

# AC-7: build green
mise exec -- pnpm --filter @ubm-hyogo/web build

# AC-6 / I-4: token gate green（HEX 直書き増加 0）
mise exec -- pnpm exec vitest run apps/web/src/__tests__/tokens.runtime.spec.ts
mise exec -- pnpm verify:tokens   # verify-design-tokens 相当

# AC-4: 削除 diff は重複ブロック除去のみ
git diff apps/web/src/styles/globals.css
```

### エラーハンドリング（中断条件）

- **diff 不一致時は中断**: 上記 `diff` が空でない（ブロック 1 とブロック 2 に 1 行でも差がある）場合、機械的削除では視覚不変を保証できない。その場で作業を止め、差分箇所を Phase 設計へ差し戻して再判断する（byte 一致が AC-3 の前提条件）。
- **cascade 文脈差異検出時は中断**: 万一どちらかのブロックが @media や別 layer に内包されていた場合（再 grep で前提と異なる構造が判明した場合）も中断し、再スコープする。
- **build / token gate fail 時**: 削除以外の意図しない編集が混入していないか `git diff` で確認する。token gate fail は HEX 直書き混入を意味するため、削除のみの diff であることを再確認する。

### 既知制限

- 本タスクは単一ファイル `globals.css` の重複ブロック削除のみ・単一 PR で完結する（CONST_007・先送りなし）。
- `[data-route-group="admin"] [data-shell="sidebar"]`（2306 行・admin スコープ派生）は別 selector・別 cascade 文脈（@media 内包）であり**削除対象外**。これを誤削除すると admin モバイル表示が変わるため、削除範囲はブロック 2（1774-1904）に厳密に限定する。
- shell 描画値（高さ 100dvh / border / 背景 / typography スケール）は無変更（AC-5）。
- HEX 直書きを増やさず token 変数経由を維持（AC-6 / I-4 / `verify-design-tokens` gate 緑）。

### user-gated 境界

`pnpm build` 実走・token gate 実走は本 wave の local evidence として完了済み。`git commit` / `git push` / PR 作成・staging screenshot 取得のみ **user 明示承認後に実行**する。本 wave は実装仕様書（Phase 1-13）の作成、globals.css 重複削除、local verification を完了（status: implemented_local_evidence_captured）。

---

## 視覚証跡

UI/UX 変更なし（byte 一致ブロック削除で視覚不変）のため Phase 11 スクリーンショット不要。

代替証跡として以下を参照:

- `outputs/phase-11/manual-test-result.md`（diff / grep / build / token gate の検証コマンドスイートと各 expected）
- `phase-10-final-review.md`（最終レビュー・byte 一致 + cascade 文脈同一の二重証明）
