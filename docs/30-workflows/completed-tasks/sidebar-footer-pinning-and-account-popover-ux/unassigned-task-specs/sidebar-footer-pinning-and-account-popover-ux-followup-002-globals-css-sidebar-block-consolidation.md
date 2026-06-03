# globals.css の重複 shell ブロック（`[data-shell="sidebar"]` ほか）1 本化 - タスク指示書

## メタ情報

```yaml
issue_number: 1103
```

## メタ情報

| 項目         | 内容                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| タスクID     | sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation |
| タスク名     | `globals.css` 内で重複している shell surface ブロック（topbar / sidebar / footer + typography）の 1 本化（DRY） |
| 分類         | リファクタリング（CSS 重複除去 / drift 防止）                                   |
| 対象機能     | `apps/web/src/styles/globals.css` の shell / token surface 定義                 |
| 優先度       | 低                                                                              |
| 見積もり規模 | 小規模                                                                          |
| ステータス   | 未実施                                                                          |
| 発見元       | sidebar-footer-pinning-and-account-popover-ux（Phase 8 Task 8-1 / Phase 10 引き継ぎ）|
| 発見日       | 2026-06-02                                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `sidebar-footer-pinning-and-account-popover-ux` の C1（sidebar フッター固定）で `[data-shell="sidebar"]` の高さ規則を `min-height:100vh` → `height:100dvh` + `max-height:100dvh` + `overflow:hidden` へ変更した。このとき `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` で、`[data-shell="sidebar"]` が **2 箇所（現状 1417 行付近 / 1549 行付近）に重複定義**されていることが判明した。

実際には `[data-shell="sidebar"]` 単体ではなく、その前後の `[data-shell="topbar"]` / `[data-shell="footer"]` + `[data-text="..."]` typography ブロック群を含む shell surface セクション全体（おおよそ 1407-1538 行 と 1539-1670 行付近）が、ほぼ丸ごと 2 回繰り返されている構造的重複である（歴史的な responsive / theme 分岐の経緯と推測される）。

### 1.2 問題点・課題

- 親タスクでは「2 ブロック双方を同一値へ整合」（片側更新による drift 防止）までに留め、1 ブロックへの統合は scope 外として見送った（Phase 8 Task 8-1）。現状、両 `[data-shell="sidebar"]` ブロックは同一値（`height:100dvh; max-height:100dvh; overflow:hidden`）になっているが、**重複構造そのものは残存**している。
- 今後どちらか一方だけを更新すると、もう一方が古い値のまま残る silent drift が再発する。親タスクの C1 修正でも「2 ブロック両方を直す」必要があり、修正コストが二重化した。
- 同一 selector が 2 回出ることで CSS の cascade 上どちらが最終勝者かが非自明になり、`verify-design-tokens` gate / 将来の token リファクタで混乱の元になる。

### 1.3 放置した場合の影響

- shell surface（topbar / sidebar / footer）の高さ・border・背景を変える将来タスクが、必ず 2 箇所を直す必要があり、片側漏れによるレイアウト回帰（例: sidebar の高さだけ片側 100vh / 片側 100dvh に分岐）が起きうる。
- 重複ブロックのどちらかが media query / `@layer` / theme 文脈に依存している場合、安易な削除は別 breakpoint / テーマでの挙動変化を招く。「整合は済んでいるが統合は怖くて触れない」状態が固定化する。

> **本体タスクで統合しなかった理由（重要）**: Phase 8 で「両ブロックを統合すると、意図しない responsive / theme 文脈の挙動変化リスクがある」と判断し、整合のみに留めた。本 follow-up は **2 つのブロックがどの media query / `@layer` / 親 selector 文脈に属するかを精査した上で**、文脈が同一であることを確認できた場合のみ 1 本化する。文脈が異なる（例: 別 breakpoint）なら統合せず「重複ではなく意図的分岐」として注釈を残す。

---

## 2. 何を達成するか（What）

### 2.1 目的

`globals.css` 内で重複している shell surface セクション（`[data-shell="topbar"]` / `[data-shell="sidebar"]` / `[data-shell="footer"]` + 後続 typography）の 2 ブロックを精査し、同一文脈であれば 1 本化して構造的重複を解消する。挙動（描画結果）は完全不変。

### 2.2 最終ゴール

- `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` の結果が、`[data-route-group="admin"] [data-shell="sidebar"]`（スコープ付き派生・統合対象外）を除き **1 件**になる。
- 重複していた topbar / footer / typography 定義も同様に 1 本化される（または意図的分岐として明示注釈）。
- 統合前後で公開 HP `/`（一般 / admin 閲覧）・管理画面の sidebar / topbar / footer 描画が視覚的に不変（screenshot 比較で確認）。

### 2.3 スコープ

#### 含むもの

- 重複している shell surface セクション 2 ブロックの media query / `@layer` / 親 selector 文脈の精査。
- 文脈同一が確認できた場合の 1 本化（後勝ちブロックの値を残し、前ブロックの重複定義を削除）。
- 文脈差がある場合の「意図的分岐」注釈付与（統合せず）。

#### 含まないもの

- shell 描画値の変更（高さ・border・背景・typography スケールの値はいずれも現状維持。本タスクは重複除去のみ）。
- `[data-route-group="admin"] [data-shell="sidebar"]`（2014 行付近）のスコープ付き派生 selector の変更（別 selector のため対象外）。
- token 定義（`tokens.css`）側のリファクタ。

### 2.4 成果物

- `apps/web/src/styles/globals.css`（重複 shell セクションの 1 本化 diff）
- 視覚不変の証跡（統合前後の screenshot 比較 / staging 認証は user-gated）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親タスク `sidebar-footer-pinning-and-account-popover-ux` の C1 が landed 済み（両 `[data-shell="sidebar"]` が `height:100dvh; max-height:100dvh; overflow:hidden` に整合済みの状態）。

### 3.2 依存タスク

- 親: `sidebar-footer-pinning-and-account-popover-ux`（C1 / AC-1 / Phase 8 Task 8-1）

### 3.3 必要な知識

- CSS cascade と同一 selector 重複時の後勝ち規則。
- `globals.css` の `@layer` / media query 構造（重複が同一 layer / breakpoint 内か別文脈かの判定）。
- OKLch token 正本化（不変条件 I-4 / `verify-design-tokens` gate）— 値は token 変数経由のまま変えない。
- 親タスク不変条件 I-7（観測契約属性 / 描画結果を変えない additive 原則）。

### 3.4 推奨アプローチ

1. `grep -n 'data-shell="\(topbar\|sidebar\|footer\)"' apps/web/src/styles/globals.css` で全重複行を洗い出し、各ブロックを囲む `@media` / `@layer` / 親 selector を遡って特定する。
2. 2 ブロックが同一文脈（同 layer・同 breakpoint・同親）なら、後勝ちブロック（現状 1549 行側）を残し、前ブロック（1417 行側）の重複定義を削除する。typography / topbar / footer の重複も同様に処理。
3. 文脈が異なる場合は統合せず、各ブロック冒頭に「この重複は別 breakpoint / theme のため意図的」とコメント注釈を入れて drift 警告だけ残す。
4. ビルド（`pnpm build`）で CSS が壊れないことを確認し、公開 HP `/`・管理画面の sidebar / topbar / footer を統合前後で screenshot 比較し視覚不変を確認する。

---

## 4. 実行手順

### Phase 構成

1. 重複文脈の精査
2. 1 本化（または意図的分岐注釈）
3. 視覚不変確認

### Phase 1: 重複文脈の精査

#### 目的

2 ブロックが同一 cascade 文脈かを確定し、統合可否を判定する。

#### 手順

1. 全 `[data-shell=...]` 重複行を grep し、各ブロックの親 `@media` / `@layer` を遡って特定する。
2. 同一文脈 / 別文脈を判定表に整理する。

#### 完了条件

各重複ブロックの cascade 文脈が表で確定し、統合可否が判定済み。

### Phase 2: 1 本化（または意図的分岐注釈）

#### 目的

構造的重複を除去（または明示注釈）する。

#### 手順

1. 同一文脈なら後勝ちブロックを残し前ブロックの重複 selector を削除する。
2. 別文脈なら統合せず注釈を付与する。
3. `pnpm build` で CSS ビルドが通ることを確認する。

#### 完了条件

`grep -n 'data-shell="sidebar"'` がスコープ派生を除き 1 件（または別文脈注釈付き）になる。

### Phase 3: 視覚不変確認

#### 目的

描画結果が変わっていないことを保証する。

#### 手順

1. 公開 HP `/`（一般 / admin 閲覧）・管理画面で sidebar / topbar / footer を統合前後 screenshot で比較する（staging 認証は user-gated）。
2. `verify-design-tokens` gate（HEX 直書きなし）通過を確認する。

#### 完了条件

統合前後で視覚差分なし。token gate 緑。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `[data-shell="sidebar"]` の重複が 1 件（スコープ派生 `[data-route-group="admin"] ...` を除く）に解消、または別文脈注釈付与
- [ ] topbar / footer / typography の重複も同様に処理
- [ ] 統合前後で sidebar / topbar / footer 描画が視覚不変

### ドキュメント要件

- [ ] 統合判断（同一文脈で統合 / 別文脈で注釈）の根拠を PR 本文または diff コメントに記載
- [ ] 親タスク implementation-guide からの相互リンク（任意）

### 品質要件

- [ ] shell 描画値（高さ・border・背景・typography）を変えていない（重複除去のみ）
- [ ] HEX 直書きを増やさない / token 変数経由維持（I-4 / `verify-design-tokens`）
- [ ] `pnpm build` が通る

---

## 6. 苦戦箇所・知見（再発防止）

親タスク Phase 8 Task 8-1 で実際に詰まった点と、本統合タスクで注意すべき点を、将来の CSS 重複除去系タスクで活かせる粒度で記録する。

### 6.1 同一 selector の重複は片側更新 drift を生む

- `[data-shell="sidebar"]` が 2 箇所に定義されていたため、C1 で高さ規則を変える際に「両方直さないと片側だけ古い値が残る」状況になった。実際 Phase 8 では 2 ブロック双方を `height:100dvh; max-height:100dvh; overflow:hidden` に揃える作業が必要で、修正コストが二重化した。
- 対策: 親タスクでは「両方を同一値に整合」までを確実な価値として実施し、構造的統合は本 follow-up へ分離した。
- 教訓: 同一 selector の重複定義は「どちらが最終勝者か」が非自明で、修正のたびに 2 箇所同期が必要になる。整合（同一値化）と統合（1 本化）を段階分けし、まず drift を止めてから構造を直す 2 段階アプローチが安全。

### 6.2 安易な重複削除は responsive / theme 文脈の挙動変化を招く

- Phase 8 で「両ブロックを統合すると、意図しない responsive / theme 文脈の挙動変化リスクがある」と判断し、整合のみに留めた。重複に見えても、片方が別 media query / `@layer` / theme 配下にある可能性があり、機械的に削除すると別 breakpoint で sidebar が崩れる恐れがある。
- 対策: 統合の前提として「2 ブロックが同一 cascade 文脈に属すること」を grep + 親文脈の遡り確認で証明してから削除する。確証が取れなければ統合せず注釈に留める。
- 教訓: CSS の重複除去は「テキスト上同じ」だけでは不十分で、cascade 文脈（layer / breakpoint / 親 selector）の同一性が条件。文脈確認を Phase 1 に独立させ、削除を急がない。

### 6.3 値は token 変数経由のまま触らない（I-4 / token gate）

- 重複除去のついでに値を「綺麗にしたく」なるが、`verify-design-tokens` gate が HEX 直書き / token 逸脱を fail させる。shell 値は `var(--ubm-color-*)` / `100dvh` のまま、重複構造だけを削るのが鉄則。
- 教訓: リファクタの scope を「重複除去のみ」に厳格に絞り、値変更・token 整理を混ぜない。混ぜると視覚回帰と token gate fail の切り分けが困難になる。

---

## 7. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-8-refactor.md`（Task 8-1 重複ブロック整合）
- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-10-final-review.md`（Task 10-3 / Phase 12 引き継ぎ）
- `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/design-tokens.md`（token 正本）

### 関連コード

- `apps/web/src/styles/globals.css`（`[data-shell="sidebar"]` 1417 行 / 1549 行・shell surface 重複セクション）
- `apps/web/src/styles/tokens.css`（token 正本・本タスクでは非変更）

### 関連 issue / task

- 親: `sidebar-footer-pinning-and-account-popover-ux`
- 兄弟候補: `sidebar-footer-pinning-and-account-popover-ux-followup-001-usedismissable-hook-extraction`
