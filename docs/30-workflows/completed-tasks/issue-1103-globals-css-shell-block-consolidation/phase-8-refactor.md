# Phase 8: リファクタリング — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 本タスク自体がリファクタリングである

本タスクの本質は、`apps/web/src/styles/globals.css` に存在する **`parallel-01 P1-1〜P1-5` ブロックの byte 完全一致重複（130 行 × 2）** という duplicate と、それに伴う **navigation drift（同一 selector が複数箇所に散らばり、どちらが正本か判別不能）** を削ることである。すなわち Phase 5（実装）の diff そのものがリファクタリング（重複ブロック除去 / SSOT 一本化）であり、Phase 8 で**追加する**リファクタリングは存在しない。

- **duplicate の除去**: 同一 `@layer components` 直下に byte 一致で 2 回定義された `parallel-01 P1-1〜P1-5` ブロックを 1 本へ収斂させる。`[data-shell="sidebar"]` を含む shell surface 定義の重複（1708 行 / 1840 行）を解消する。
- **navigation drift の除去**: 同じ selector 群が 1642-1772 と 1774-1904 の 2 箇所に存在することで「どちらを編集すれば反映されるか」が不明瞭になる構造的曖昧さを排し、参照先を 1 箇所に固定する。

## 2. 変更内容（Before / After / 理由）[Feedback RT-03]

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `apps/web/src/styles/globals.css` の `parallel-01 P1-1〜P1-5` ブロック | 2 ブロック（**1642-1772**=ブロック1 + **1774-1904**=ブロック2、byte 完全一致） | 1 ブロック（**1642-1772**=ブロック1 のみ） | 構造的重複の除去。後発ブロック2（1774-1904）を削除し、先発ブロック1（1642-1772）を残す。byte 一致削除のため cascade 上書きはゼロ・描画値不変。 |
| `[data-shell="sidebar"]` 定義 | 3 箇所（1708 / 1840 / 2306） | 2 箇所（1708 / 2306） | 重複側 1840 を削除。2306 は admin スコープ派生（`@media (max-width:767px)` 内）で**削除対象外**・無変更。 |
| `parallel-01 P1-1` page surface コメントヘッダ | 2 回出現 | 1 回出現 | ブロック単位の 1 本化により付随コメントも自動的に重複解消。 |

### 削減効果（duplicate / navigation drift）

| 指標 | Before | After |
| --- | --- | --- |
| `parallel-01 P1-1〜P1-5` 重複行数 | 130 行（ブロック2） | 0 行 |
| `[data-shell="sidebar"]` 重複定義数（parallel-01 由来） | 2（1708 / 1840） | 1（1708） |
| 「どちらが正本か」判別コスト | 高（同一 selector が 2 箇所） | ゼロ（単一定義） |

## 3. keep する定義（不変）

- ブロック1（1642-1772）の `parallel-01 P1-1〜P1-5` 定義（page surface / section rhythm / card chrome / shell surface / typography）は**値・selector・順序とも一切変更しない**。
- `[data-shell="sidebar"]`（1708 行・ブロック1 内）および admin スコープ派生（2306 行・`@media (max-width:767px)` 内）は無変更。
- 削除は後発ブロック2（1774-1904）の**行削除のみ**に閉じる。

## 4. 追加リファクタリングの要否 — scope 外の明記

**不要。** 本タスクは重複除去のみに厳格に絞る。以下は「綺麗にしたくなる」誘惑として明示的に **scope 外** とする。

| 誘惑 | scope 判定 | 理由 |
| --- | --- | --- |
| 残存ブロックの値整理（spacing/サイズの統一・round） | **scope 外** | 値変更は描画回帰を招き、byte 一致削除で保証される「視覚不変」の証明性を失う。 |
| token 変数への巻き取り・token 再編 | **scope 外** | I-4 token gate（`verify:tokens` / `verify-design-tokens`）の fail と視覚回帰の切り分けが困難になる。重複除去と token 整理を 1 PR に混ぜると AC-5/AC-6 の検証が交絡する。 |
| selector 名のリネーム・`@layer` 再構成 | **scope 外** | cascade 文脈変更は AC-5（描画値不変）を崩す。 |

> 本サイクルの diff は **後発ブロック2（1774-1904）の行削除のみ**。値・token・selector・cascade は無変更とし、CONST_007（単一サイクル）と AC-4（削除のみ）に閉じる。
