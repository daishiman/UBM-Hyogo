# Phase 1: 要件定義 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / status: implemented_local_evidence_captured]**

## 1. 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
| --- | --- |
| 真の論点 | `apps/web/src/styles/globals.css` の `@layer components`（124 行開始）直下に、`parallel-01 P1-1〜P1-5` の 5 ブロック（page surface / section rhythm / card chrome / shell surface / typography）が **byte 完全一致で 2 回** 定義されている構造的重複（DRY 違反）。片側だけ更新すると drift が発生し、shell 描画値の単一正本（SSOT）が崩れる。 |
| 依存・責務境界 | 対象は単一ファイル `apps/web/src/styles/globals.css` のみ。`apps`/`api`/その他 CSS への波及なし。両重複ブロックは同一 `@layer components` 直下・@media 非内包で cascade 文脈が完全同一のため、後発ブロックの機械的削除で責務境界は不変。 |
| 価値とコストの不均衡 | 価値 = 片側更新リスク（drift）を恒久排除し、shell/token surface 定義を 1 本化。コスト = 後発重複ブロック 130 行余の削除のみ（残存ブロック値は無変更）。byte 一致削除のため視覚不変が証明可能で、極小コストで DRY/SSOT を確立する高 ROI。 |
| 改善優先順位 | (1) byte 一致 + cascade 文脈同一の二重証明（AC-3）→ (2) 後発ブロック削除（AC-2/AC-4）→ (3) build / token gate / grep カウントで視覚不変を担保（AC-1/AC-5/AC-6/AC-7）。 |
| 4 条件評価 | 価値性=drift 防止と SSOT 確立 / 実現性=単一ファイル単一サイクルで完結 / 整合性=byte 一致削除で cascade ゼロ変化 / 運用性=grep + build + `verify-design-tokens` gate で担保。 |

## 2. Why（背景・課題・放置影響）

### 2.1 背景（親タスクからの carry-over）

親タスク `sidebar-footer-pinning-and-account-popover-ux` の **Phase 8 Task 8-1** では、重複していた 2 ブロックを「双方とも同一値へ整合する」（drift 防止）ところまで実施した。しかし **1 本化（重複ブロックの物理削除）は当該タスクのスコープ外**として見送られ、本 follow-up（issue-1103）へ分離された。結果、現行コードは「値は一致しているが定義が 2 本ある」状態であり、根本（重複そのもの）が未解消のまま残っている。

### 2.2 課題

- 同一 selector group（`[data-route]` / `[data-section*]` / `[data-card*]` / `[data-shell="topbar|sidebar|footer"]` / `[data-text*]`）が 2 箇所で定義されている。
- 値は現状一致しているが、**今後どちらか一方だけを編集すると即 drift** する。CSS は後勝ち（cascade source order）なので、先発を編集しても後発が打ち消し、編集が無効に見える事故も起こり得る。
- issue の記述（対象 = `[data-shell]` topbar/sidebar/footer + typography、行番号 1417/1549）は **古く、現行コードと乖離**している（後述 §8 の再スコープで訂正）。

### 2.3 放置した場合の影響

- 将来 shell 高さ・border・背景・typography スケールのいずれかを変更する際、片側更新の見落としで silent な視覚 drift / 無効編集が発生する。
- レビュー・grep 時に「どちらが正本か」が判別できず、後続実装者の認知コストが恒常的に増える。

## 3. What（目的・ゴール・スコープ・成果物）

### 3.1 目的・最終ゴール

`apps/web/src/styles/globals.css` の `parallel-01 P1-1〜P1-5` 重複ブロックを **1 本化** し、shell / token surface 定義の単一正本を物理的に確立する。**視覚は 1px も変えない**（byte 一致削除のため）。

### 3.2 スコープ

| 区分 | 内容 |
| --- | --- |
| 含む | 後発の重複ブロック（`parallel-01 P1-1〜P1-5`・1774-1904 行）の削除。先発ブロック（1642-1772 行）を正本として残す。 |
| 含まない | 残存ブロックの値変更 / 新規 selector・token・primitive の追加 / `[data-route-group="admin"] [data-shell="sidebar"]`（2306 行・`@media (max-width: 767px)` 内のレスポンシブ override）への変更 / 他 CSS ファイル / `apps/api` / Google Form 仕様。 |

### 3.3 成果物

- `apps/web/src/styles/globals.css` の後発重複ブロック削除差分（残存ブロック値は無変更）。
- 削除前の byte 一致（diff 空）+ cascade 文脈同一の evidence 記録。
- build 成功・token gate 緑・grep カウント `data-shell="sidebar"` = 2 件の検証ログ。
- 消費元 unassigned-task の consumed 記録。

## 4. 受入条件（AC・index.md と同一）

| AC | 内容 |
| --- | --- |
| AC-1 | `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` が **2 件**（dedup 後の parallel-01 ブロック 1 件 + admin スコープ派生 1 件）になる（削除前 3 件）。 |
| AC-2 | `parallel-01 P1-1〜P1-5` の重複ブロック全体が 1 本化される。 |
| AC-3 | 削除前に 2 ブロックの byte 一致（diff 空）と cascade 文脈同一を証明し evidence に記録。 |
| AC-4 | 削除 diff は重複ブロックの除去のみ（残存ブロックの値は無変更）。 |
| AC-5 | shell 描画値（高さ 100dvh / border / 背景 / typography スケール）を変えない。 |
| AC-6 | HEX 直書きを増やさず token 変数経由維持（I-4 / `verify:tokens` / `verify-design-tokens` gate 緑）。 |
| AC-7 | `pnpm --filter @ubm-hyogo/web build` 成功・統合前後で描画が視覚不変。 |

## 5. 前提条件・依存タスク

| 項目 | 内容 |
| --- | --- |
| 変更対象 | `apps/web/src/styles/globals.css`（唯一） |
| 親タスク | `sidebar-footer-pinning-and-account-popover-ux`（Phase 8 Task 8-1 で 2 ブロックを同一値へ整合済み・1 本化は本 follow-up へ分離） |
| 消費元未タスク | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/unassigned-task-specs/sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation.md` |
| 不変条件 I-4 | HEX 直書き禁止・token 変数（`--ubm-*`）経由維持。`verify:tokens` / `verify-design-tokens` gate で fail 判定。 |
| 不変条件（shell 描画値） | 高さ 100dvh / border / 背景 / typography スケールを不変に保つ。 |

## 6. タスク分類記録

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| 実装区分 | 実装仕様書（`implementation_spec`） | root cause（CSS 構造的重複）の解消にコード変更（重複削除）が必須。CONST_004 に従いラベルより実態優先。 |
| visual_category | **NON_VISUAL** | byte 一致ブロックの削除 = cascade ゼロ変化。視覚不変が証明可能。 |
| implementation_mode | `new` | 本 wave で local 削除実装を完了。 |
| status | `implemented_local_evidence_captured` | commit・push・PR・staging screenshot は user-gated。 |

## 7. 既存命名規則の分析

| 規則対象 | 規則 | 本タスクでの扱い |
| --- | --- | --- |
| selector | CSS data-attribute selector（`[data-route]` / `[data-section*]` / `[data-card*]` / `[data-shell="topbar\|sidebar\|footer"]` / `[data-text*]`） | 残存ブロックの selector・構造を一切変えない。後発の重複定義のみ削除。 |
| 区切りコメント | `/* === parallel-NN GN-N <名称> === */` 形式でブロック境界を明示 | 残す側（parallel-01）の境界コメントを保持。削除する側のコメントもブロックごと除去。 |
| token 命名 | `--ubm-*`（OKLch / spacing / typography）変数経由。HEX 直書き禁止 | 値は触らないため token 参照はそのまま維持（HEX を増やさない）。 |

## 8. issue の現行コードへの再スコープ

| 観点 | issue 記述（古い） | 現行コード実態（2026-06-05 確定） |
| --- | --- | --- |
| 重複対象 | `[data-shell]` topbar/sidebar/footer + typography のみ | `parallel-01 P1-1〜P1-5` の **5 ブロック全体**（page surface / section rhythm / card chrome / shell surface / typography） |
| `[data-shell="sidebar"]` 行番号 | 1417 / 1549 | **1708 / 1840**（重複）+ **2306**（admin スコープ派生・対象外）。行シフトにより訂正 |
| 重複範囲 | 行番号のみ言及 | 先発 **1642-1772**（残す）/ 後発 **1774-1904**（削除）。`diff` 空（byte 一致）を実機検証済み |

> **再スコープの核心**: issue の対象記述（`[data-shell]`+typography）は現行コードでは parallel-01 P1-1〜P1-5 の 5 ブロック全体に拡大しており、行番号も 1708/1840 へシフトしている。本仕様書ではこの現行実態を正本とし、削除対象を後発の重複ブロック全体（1774-1904 行）に確定する。issue 自体は CLOSED のまま reopen しない。

## 9. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に削除実装が存在するか | **Yes**（本 wave で後発重複ブロックを削除済み） | local evidence captured |
| 他タスクで解決済みか | **No**（重複は現行コードに現存） | 本タスクで解消 |
| upstream にマージ済みか | N/A（新規変更） | — |
| 依存タスク完了済みか | Yes（親タスク Phase 8 Task 8-1 で 2 ブロック整合済み = byte 一致が成立） | 削除の前提（byte 一致）が確立済み |

→ `implementation_mode: new`。削除のみの極小実装（RED/GREEN は「削除後も build 成功 + token gate 緑 + grep カウント減」で担保）。

## 10. carry-over 確認

- 前タスク: `sidebar-footer-pinning-and-account-popover-ux`（Phase 8 Task 8-1 で 2 ブロックを同一値へ整合・1 本化は scope 外として本 follow-up へ分離）。
- 本タスクの新規作業: 後発重複ブロックの物理削除 + byte 一致 / cascade 同一の二重証明 + 視覚不変検証。
- 元 unassigned-task（`...-followup-002-globals-css-sidebar-block-consolidation.md`）を本 workflow が consume。
