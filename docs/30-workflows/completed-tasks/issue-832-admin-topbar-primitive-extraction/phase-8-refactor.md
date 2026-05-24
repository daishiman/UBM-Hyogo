# Phase 8: リファクタ

## 1. 本タスクの位置づけ

本タスク（issue #832）は「inline `<header data-shell="topbar">` を `AdminTopbar` primitive へ**抽出**する」こと自体がリファクタリングである。Phase 5 の抽出をもって主たるリファクタは完了する。追加のリファクタ余地を以下で点検する。

## 2. 抽出による変更（対象 / Before / After / 理由）— Feedback RT-03 テーブル形式

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `apps/web/app/(admin)/layout.tsx` の topbar slot | inline `<header data-shell="topbar">` ブロック（**11 行**: `<header>` + breadcrumb `<div>` + actions `<div>` + 閉じタグ） | `<AdminTopbar />`（**1 行**）+ import 1 行 | 兄弟 primitive（`AdminSidebar` / `PublicHeader` / `MemberHeader`）と対称な責務分離。layout は AppShell wrapper・auth gate・grid に専念し、topbar 描画は primitive に委譲 |
| topbar 描画ロジック | layout.tsx に埋没（再利用・単体テスト不可） | `AdminTopbar.tsx` に独立（props 省略可 API + 単体 spec で契約検証可能） | testability と再利用性の向上。slot 契約（breadcrumb / actions）を型で表現 |
| data-* 契約所有権 | topbar 系 data-* が layout に混在 | `data-shell="topbar"` / `data-component="admin-*"` は primitive 内、`data-route-group` / `data-theme` は wrapper に分離 | shell slot 識別は primitive 責務、route group 識別は AppShell 責務という所有権境界を明確化（Phase 2 §2） |

> layout.tsx の行数削減: topbar inline 11 行 → `<AdminTopbar />` 1 行（import 1 行追加を加味しても正味削減）。DOM 出力は同一（NFR-1 / AC-3 で担保）。

## 3. 追加リファクタ余地の点検 → **なし**（根拠明記）

| 候補 | 判定 | 根拠 |
|---|---|---|
| 重複コード抽出 | なし | 抽出後、topbar JSX は AdminTopbar 1 箇所のみ。重複は発生していない |
| navigation drift | なし | 本タスクは route / nav リンクを一切変更しない（topbar に navigation 要素は無く、breadcrumb / actions は slot placeholder のまま） |
| dead code | なし | inline `<header>` は完全に `<AdminTopbar />` へ置換され、旧 JSX は残らない（Phase 9 で `data-shell="topbar"` 直書き残存ゼロを grep 検証） |
| token / class 改変 | なし | OKLch トークン参照・class・文言「管理」を無改変移植（不変条件4 / AC-7）。リファクタによる visual drift なし |

## 4. 他 header 系 primitive との API 統一余地（観察結果 / 本タスクスコープ外）

抽出にあたり兄弟 primitive を観察した結果を記録する。**先送りではなく「現時点での観察結果」**として残す（本タスクで変更すると責務外の新 design / API 変更になるため対象外）。

| primitive | `<header>` 所有 | props | 観察 |
|---|---|---|---|
| `AdminTopbar`（本タスク新規） | 自身が root `<header>` を所有 | `breadcrumb?` / `actions?`（省略可 slot） | slot 注入型。3 primitive 中で唯一 props を持つ |
| `MemberHeader` | 自身が `<header>` を所有 | props ゼロ（default-rendering） | AdminTopbar の `<header>` 所有パターンと一致 |
| `PublicHeader` | 自身が `<header>` を所有 | props ゼロ（default-rendering） | 同上 |

- **観察 1**: `<header>` を primitive 自身が所有する点は 3 者で統一済み。AdminTopbar はこのパターンに正しく整合している。
- **観察 2**: props 設計は分岐がある。MemberHeader / PublicHeader は props ゼロ、AdminTopbar のみ slot props を持つ。これは admin topbar が breadcrumb / actions という可変領域を持つという機能差に由来する正当な差分であり、無理に統一する必要はない。
- **スコープ外の理由**: MemberHeader / PublicHeader に slot props を後付けする、あるいは共通 `Header` 抽象を導入するのは「責務外の新 design 追加」（CLAUDE.md UI 不変条件3 / index.md スコープ外）。本タスクは AdminTopbar 抽出 1 サイクルで完結させる。将来 header 系の共通 slot API を検討する場合は別タスク化候補（Phase 12 §未タスク検出で 0 件判定の妥当性確認時に参照）。

## 5. 結論

- 主たるリファクタ = AdminTopbar 抽出（Phase 5 で完了）。
- 追加リファクタ余地 = なし（§3 根拠）。
- header 系 API 統一 = 観察済み・本タスクスコープ外（§4）。
