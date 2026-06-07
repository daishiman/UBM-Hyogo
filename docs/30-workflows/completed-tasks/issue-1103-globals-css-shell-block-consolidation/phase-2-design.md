# Phase 2: 設計 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 既存コンポーネント再利用可否

新規 UI・新規 primitive・新規 selector・新規 token はゼロ。既存 `apps/web/src/styles/globals.css` の **後発重複ブロックの削除**のみ。残存する先発ブロックの selector / プロパティ / `--ubm-*` token 参照は 100% そのまま再利用する（CLAUDE.md「新規 primitive を生やさない」「既存 token のみ」に整合）。

## 2. 重複検出の全体 topology

### 2.1 grep + cascade 文脈による特定（2026-06-05 実機確定）

```
@layer components {                              … L124（単一の components layer）
  …
  /* parallel-02 G3-3 visibility marker (end) */ … L1640
  /* === parallel-01 P1-1 page surface === */     … L1642 ┐
  /* === parallel-01 P1-2 section rhythm === */    … L1649 │ ブロック1（残す）
  /* === parallel-01 P1-3 card chrome === */       … L1666 │ 1642-1772
  /* === parallel-01 P1-4 shell surface === */     … L1697 │  [data-shell="sidebar"] = L1708
  /* === parallel-01 P1-5 typography scale === */  … L1723 ┘ （末尾 } = L1772）
                                                     L1773 = 空行
  /* === parallel-01 P1-1 page surface === */      … L1774 ┐
  /* === parallel-01 P1-2 section rhythm === */     … L1781 │ ブロック2（削除）
  /* === parallel-01 P1-3 card chrome === */        … L1798 │ 1774-1904
  /* === parallel-01 P1-4 shell surface === */      … L1829 │  [data-shell="sidebar"] = L1840
  /* === parallel-01 P1-5 typography scale === */   … L1855 ┘ （末尾 } = L1904）
                                                     L1905 = 空行
  /* === parallel-09 G9-6 mobile responsive … === */ … L1906（後続・別ブロック）
  …
    [data-route-group="admin"] [data-shell="sidebar"] … L2306（@media max-width:767px 内・別 selector・対象外）
}
```

### 2.2 `data-shell="sidebar"` 出現箇所の分類

| 行 | selector | 分類 | 扱い |
| --- | --- | --- | --- |
| 1708 | `[data-shell="sidebar"]`（parallel-01 P1-4・ブロック1） | base surface（残す側） | **保持** |
| 1840 | `[data-shell="sidebar"]`（parallel-01 P1-4・ブロック2） | base surface（重複・削除側） | **削除** |
| 2306 | `[data-route-group="admin"] [data-shell="sidebar"]` | admin スコープ派生・`@media (max-width: 767px)` 内のレスポンシブ override | **対象外（誤削除しない）** |

→ 削除後の `grep -c 'data-shell="sidebar"'` は **2 件**（1708 + 2306）になる（AC-1）。

## 3. 削除アプローチ（後発を削除・先発を残す根拠）

### 3.1 どちらを残すか

CSS の後勝ち（source order）規則上、2 ブロックは byte 完全一致のため **どちらを残しても算出スタイルは同値**。本設計では **後発ブロック（1774-1904）を削除し、先発ブロック（1642-1772）を残す**。

根拠:

| 理由 | 内容 |
| --- | --- |
| コメント並びの自然さ | 先発ブロックは直前の `parallel-02 G3-3 visibility marker (end)`（L1640）→ `parallel-01 P1-1…`（L1642）という自然な並びを構成する。後発を削除すると、残存ブロック末尾（L1772）→ `parallel-09 G9-6 mobile responsive …`（L1906）への接続も並び順として破綻しない。 |
| diff の局所性 | 後発（ファイル後方）を削除すると、残存ブロックの行番号が動かず、レビュー時に「先発 = 正本」が一目で分かる。 |
| cascade 無影響 | byte 一致 + 後勝ち同値のため、先発のみ残しても最終算出スタイルは削除前と完全一致。 |

### 3.2 削除境界の正確な行範囲

| 項目 | 行 | 内容 |
| --- | --- | --- |
| 残す側 末尾 | 1772 | ブロック1 の typography ブロック閉じ `}` |
| 区切り空行 | 1773 | ブロック1 と ブロック2 の間の空行 |
| 削除する側 先頭 | 1774 | `/* === parallel-01 P1-1 page surface === */`（ブロック2 開始） |
| 削除する側 末尾 | 1904 | ブロック2 の typography ブロック閉じ `}` |
| 区切り空行 | 1905 | ブロック2 と parallel-09 の間の空行 |
| 後続 | 1906 | `/* === parallel-09 G9-6 mobile responsive helpers … === */` |

**削除範囲 = 1773-1904（区切り空行 + ブロック2）**。これにより 1772（`}`）の直後に 1 行の空行（旧 1905）を残し、その次に 1906（parallel-09）が来る整形になる。

> 等価な代替: 「1774-1904 を削除」して残った連続空行（旧 1773 + 旧 1905）を 1 行に詰める整形でも結果は同一。**正本は「区切り空行 1 本 + ブロック2」を 1 単位で削除し、ブロック間が空行 1 行で保たれること**とする。

### 3.3 削除後の期待構造（イメージ）

```css
  /* === parallel-01 P1-5 typography scale === */
  [data-text="display"] { … }     /* ブロック1 内（残存・無変更） */
  …
  }                                 /* L1772 相当・ブロック1 末尾 */

  /* === parallel-09 G9-6 mobile responsive helpers (使用は parallel-01〜08 側) === */
  …
```

## 4. cascade 同一性の証明手順（AC-3）

削除を実装する**前に**以下を実行し、evidence として記録する:

| 手順 | コマンド | 期待 |
| --- | --- | --- |
| (1) byte 一致証明 | `diff <(sed -n '1642,1772p' apps/web/src/styles/globals.css) <(sed -n '1774,1904p' apps/web/src/styles/globals.css)` | **出力空**（差分なし = byte 完全一致） |
| (2) cascade 文脈の単一 layer 確認 | `grep -n '@layer' apps/web/src/styles/globals.css` で両ブロックが同一 `@layer components`（L124）配下にあること | 両ブロックとも L124 の components layer 内・他 layer 不在 |
| (3) @media 非内包確認 | 1642-1904 範囲内に `@media` が現れないこと（`sed -n '1642,1904p' … \| grep -n '@media'` が空） | 出力空（両ブロックとも media query 外 = 無条件適用） |

(1)+(2)+(3) により「2 ブロックは同一 cascade 文脈で同一バイト列を定義しており、後発削除で算出スタイルがゼロ変化する」ことが証明される。

## 5. validation path（実装後・local 実行済み）

| 検証 | コマンド | 期待 / AC |
| --- | --- | --- |
| grep カウント | `grep -c 'data-shell="sidebar"' apps/web/src/styles/globals.css` | **2**（AC-1） |
| 重複ブロック消滅 | `grep -c 'parallel-01 P1-1 page surface' apps/web/src/styles/globals.css` | **1**（AC-2） |
| 残存ブロック無変更 | 削除後の 1642-1772 範囲 diff（HEAD 比較で当該行は不変） | 残存ブロックの値に変更なし（AC-4） |
| build | `pnpm --filter @ubm-hyogo/web build` | 成功（AC-7） |
| token gate | `pnpm verify:tokens` / `verify-design-tokens` | 緑（HEX 増なし・AC-6） |
| 視覚比較 | 削除前後で shell（topbar/sidebar/footer）/ typography の描画を目視（NON_VISUAL のため byte 証明で代替可） | 視覚不変（AC-5/AC-7） |

## 6. SubAgent lane 設計

| lane | 担当 | 並列性 |
| --- | --- | --- |
| 直列（単一 lane） | Phase 1-13 全体 | **直列 1 lane で十分**。対象は単一ファイルの局所的削除（130 行余）であり、並列分割するとファイル競合・整合コストが価値を上回る。 |

> **lane 分割しない根拠**: 変更対象が `globals.css` の連続した 1 ブロック削除のみで、テスト・ドキュメント・実装が同一ファイルの同一変更に収束する。複数 SubAgent で並列化しても同一ファイルを取り合うため直列が最適。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| admin スコープ派生（L2306）を誤削除 | 削除範囲を 1773-1904 に厳密固定。L2306 は `@media (max-width: 767px)` 内の `[data-route-group="admin"] [data-shell="sidebar"]` で selector・スコープが別。削除前 grep で 3 件 → 削除後 2 件（うち 1 件が L2306）を確認（AC-1）。 |
| 残存ブロックの値を誤変更 | 削除のみ・先発ブロックは 1 行も触らない。削除後に 1642-1772 範囲を HEAD と diff し無変更を確認（AC-4）。 |
| byte 一致が崩れていた場合の silent 視覚変化 | 削除**前**に §4 の diff(1) を必ず実行。空でなければ削除を中止し再調査（親タスクで整合済みのため空が期待値）。 |
| 空行整形ミスで構文崩れ | ブロック間は空行 1 行を維持。削除後 `pnpm --filter @ubm-hyogo/web build` で CSS パースを担保（AC-7）。 |
