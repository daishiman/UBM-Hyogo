# Phase 3: 設計レビュー — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]** — Phase 4 へ進めるかを判定する。

## 1. レビュー観点と判定

| ID | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | 重複削除の安全性（二重証明） | PASS | byte 一致（`diff` 空・実機検証済み）+ cascade 文脈同一（両ブロックとも単一 `@layer components` L124 配下・@media 非内包）の二重証明を Phase 2 §4 に手順化。後発削除で算出スタイルがゼロ変化することが論理的に保証される。 |
| R-2 | 残す側／削除する側の選定 | PASS | 後勝ち同値のためどちらでも同値だが、先発（1642-1772）を残し後発（1773-1904）を削除。コメント並びの自然さ + 残存行番号の安定 + レビュー容易性で妥当。 |
| R-3 | admin スコープ派生の保護 | PASS | L2306 `[data-route-group="admin"] [data-shell="sidebar"]`（`@media max-width:767px` 内 override）は selector・スコープが別で削除対象外。削除範囲を 1773-1904 に厳密固定し、grep 3→2 件で誤削除を検知（AC-1）。 |
| R-4 | token gate / 不変条件 I-4 | PASS | 削除のみで HEX を増やさず `--ubm-*` token 参照は残存ブロックにそのまま残る。`verify:tokens` / `verify-design-tokens` 緑を validation path に明記（AC-6）。 |
| R-5 | shell 描画値の不変性 | PASS | 高さ 100dvh / border / 背景 / typography スケールは残存ブロックが正本として保持。値変更ゼロ（AC-5）。 |
| R-6 | issue 前提の現行コード整合 | PASS | issue の行番号 1417/1549 → 現行 1708/1840、対象範囲 `[data-shell]`+typography → parallel-01 P1-1〜P1-5 全体へ再スコープ済み（Phase 1 §8）。issue は CLOSED 維持・reopen しない。 |
| R-7 | スコープ単一サイクル性（CONST_007） | PASS | 単一ファイルの 1 ブロック削除のみ。先送り（別 PR / Phase 2 / バックログ）項目なし。1 サイクルで完結。 |
| R-8 | 検証可能性（運用性） | PASS | grep カウント / build / token gate / 削除前 byte 証明 / 残存ブロック diff の各 validation path が機械検証可能（Phase 2 §4-5）。 |

## 2. MAJOR / MINOR 指摘

### 2.1 MAJOR

**なし。**

### 2.2 MINOR（Phase 12 未タスク化候補として記録）

| ID | 指摘 | 対応方針 |
| --- | --- | --- |
| M-1 | `parallel-01 P1-1〜P1-5` のような連番ブロックが他にも重複していないか（parallel-02 / parallel-09 等の他系統）。本タスクのスコープは parallel-01 重複の 1 本化に限定。 | 本サイクルでは scope を parallel-01 重複に固定。他系統の重複有無は本削除の副作用ではないため、必要なら Phase 10/12 で別 follow-up 未タスク化を判断（本タスクでは grep で parallel-01 のみが 2 回出現することを確認済みのため当面の追加重複なし）。 |
| M-2 | 削除後の空行整形（区切り空行 1 本維持）はレビュー時に diff ノイズが出やすい | Phase 2 §3.2 で削除範囲を 1773-1904（区切り空行 + ブロック2）に確定し、ブロック間 空行 1 行維持を正本化。build による CSS パース担保で構文崩れを検知（実害なし・記録のみ）。 |

## 3. 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | 片側更新 drift の恒久排除と shell/token surface 定義の物理 SSOT 化。親タスクで整合のみだった根本（重複）を解消。 |
| 実現性 | 単一ファイルの byte 一致ブロック削除。削除前証明 + build + gate で 1 サイクル完結。 |
| 整合性 | byte 一致 + cascade 同一の二重証明により cascade ゼロ変化。残存ブロック・admin 派生・token 参照すべて不変で閉じる。 |
| 運用性 | grep カウント / build / token gate / diff の機械検証パスが揃い、視覚不変を客観担保（NON_VISUAL）。 |

## 4. ゲート判定

**APPROVED — Phase 4 へ進む。**

MAJOR 指摘なし。MINOR（M-1/M-2）は記録のみで本サイクル進行を妨げない。重複削除の安全性（byte 一致 + cascade 同一の二重証明）・admin スコープ派生の保護・token gate / shell 描画値の不変性・単一サイクル性の各観点が確認できたため、テスト計画（Phase 4）へ進行する。実装（globals.css 編集）・build / gate 実行は本 wave で完了済み。commit / PR は user-gated 境界として残す。
