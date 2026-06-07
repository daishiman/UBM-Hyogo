# Phase 5: 実装手順 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> implementation_mode: new / status: implemented_local_evidence_captured（commit・push・PR は user-gated）

## 1. 変更対象ファイル一覧

| 区分 | パス | 操作 | 内容 |
| --- | --- | --- | --- |
| 編集 | `apps/web/src/styles/globals.css` | **重複ブロック削除のみ** | 後発の `parallel-01 P1-1〜P1-5` ブロック（重複 2 個目）を 1 本化のため削除 |
| 新規 | — | なし | 追加ファイルなし |
| 削除（ファイル） | — | なし | ファイル単位の削除はなし（ファイル内の行ブロック削除のみ） |

**変更は 1 ファイルのみ。** D1 / API / wrangler / token 定義 / コンポーネントには一切触れない。

## 2. 入力 / 出力 / 副作用の定義

- **入力**: 現行 `globals.css`。`@layer components` 直下に `parallel-01 P1-1〜P1-5` ブロックが **byte 完全一致で 2 回連続**で存在する状態（先発 1642-1772 行 / 後発 1774-1904 行）。
- **出力**: 後発ブロック（重複 2 個目）を削除し、`parallel-01` ブロックが 1 個のみ存在する `globals.css`。
- **副作用**: **なし**。後発ブロックは先発と byte 一致のため、CSS の last-wins cascade で「先発と同一の宣言を上書きしていただけ」= 削除しても最終的な computed style は完全に不変。両ブロックは同一 `@layer components` 直下・@media 非内包でスコープ文脈も完全同一。

## 3. 削除手順（行番号非依存・アンカー特定方式）

> **行番号は編集により変動するため、行番号ではなくアンカー文字列で特定する。** 共有事実の行番号（1774-1904）は現行スナップショット時点の参照値であり、特定の根拠にはアンカーを用いる。

### 3.1 削除前ガード（必須）

削除に着手する前に Phase 4 TC-1c を実行し、byte 一致を証明する:

```bash
diff <(sed -n '1642,1772p' apps/web/src/styles/globals.css) \
     <(sed -n '1774,1904p' apps/web/src/styles/globals.css)
```

- **空出力（exit 0）の場合のみ削除を続行**。
- 非空の場合は **削除を中断しユーザーに報告**（想定外の文脈差 = byte 一致前提の崩壊。機械的削除は危険）。

### 3.2 削除範囲のアンカー特定

削除する範囲は「**`/* === parallel-01 P1-1 page surface === */` の 2 回目の出現**」から「**`/* === parallel-09 G9-6 mobile responsive helpers ... */` の直前**」まで。

| 境界 | アンカー文字列 | 役割 |
| --- | --- | --- |
| 削除開始（含む） | `/* === parallel-01 P1-1 page surface === */`（**2 回目**の出現） | 後発ブロックの先頭コメント |
| 削除終端（後発ブロック末尾） | `/* === parallel-01 P1-5 typography scale === */` の **2 回目**配下、`[data-text="eyebrow"] { ... }`（**2 回目**）の閉じ括弧 `}` | 後発ブロックの最後の宣言 |
| 残すべき直後行 | `/* === parallel-09 G9-6 mobile responsive helpers (使用は parallel-01〜08 側) === */` | この行は **削除しない**。後発ブロック削除後、先発ブロック末尾の直後に続く |

### 3.3 編集後の整形

- 先発ブロック（残す）末尾の `[data-text="eyebrow"]` ブロックの閉じ括弧の直後に、**空行 1 行**を挟んで `/* === parallel-09 G9-6 mobile responsive helpers ... */` が自然に続く形に整える。
- 後発ブロック直前の空行（現 1773 行相当）と後発ブロック直後の空行が連続二重空行にならないよう、**先発ブロック末尾と parallel-09 コメントの間は空行 1 行**に統一する。
- インデント（`@layer components` 直下 2 スペース）は先発ブロックの既存スタイルを維持する。

### 3.4 編集後の構造（期待形）

```
  ...
  [data-text="eyebrow"] {            ← 先発ブロック末尾（残す）
    color: var(--ubm-color-text-muted);
    font-size: var(--ubm-text-xs);
    font-weight: 500;
    line-height: 1.4;
    text-transform: uppercase;
  }
                                      ← 空行 1 行
  /* === parallel-09 G9-6 mobile responsive helpers (使用は parallel-01〜08 側) === */
  ...
```

（後発の 2 個目 `/* === parallel-01 P1-1 page surface === */ ... [data-text="eyebrow"] { ... }` は丸ごと消える）

## 4. エラーハンドリング

| 想定異常 | 検出方法 | 対応 |
| --- | --- | --- |
| byte 不一致（diff 非空） | §3.1 削除前ガード | 削除を中断しユーザー報告。手作業判断に切替 |
| 先発ブロックを誤削除 | Phase 4 TC-2b（`parallel-01 P1-1` カウント = 0 になる） | revert して再実行 |
| admin スコープ派生（元 2306）を誤削除 | Phase 4 TC-2c（`[data-route-group="admin"] [data-shell="sidebar"]` ヒット 0） | revert して再実行 |
| CSS 括弧不整合 | Phase 4 TC-4 build fail | 削除範囲（閉じ括弧の取り過ぎ/取り残し）を見直し |
| 二重空行混入 | lint（stylelint / prettier がある場合）/ 目視 | 空行 1 行に整形 |

## 5. 実装後の検証（local 実行済み）

Phase 4 の TC-2a / TC-2b / TC-2c → TC-5 → TC-3 token gate → TC-4 build を順に実行し全 PASS を確認済み。視覚回帰（shell 表示）は byte-identical 削除 + cascade 文脈同一のため NON_VISUAL とし、Phase 11 ではスクリーンショットではなく deterministic evidence を採用する。
