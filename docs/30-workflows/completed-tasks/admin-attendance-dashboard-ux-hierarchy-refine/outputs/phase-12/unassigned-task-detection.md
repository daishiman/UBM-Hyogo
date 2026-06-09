# Phase 12 — 未タスク検出（current / baseline 分離）

> ステータス: `completed`。本ファイルは未タスクを **current（本サイクルで残存する未完了証跡）** と **baseline（将来候補・本サイクル対象外）** に分離して記録する。

---

## 1. current（本サイクルで解消すべき新規未タスク）

**1 件。**

| # | 内容 | 理由 | 実施場所 | 実施時期 |
| --- | --- | --- | --- | --- |
| VIS-1 | Phase 11 の 8 canonical PNG を `outputs/phase-11/screenshots/` に保存する | 対象 route は admin 認証必須で、計画上の capture runtime は staging deploy + admin bearer mint + user-gated Playwright。現ワークツリーには認証済み runtime capture に必要な bearer / staging 実行承認がない | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/outputs/phase-11/screenshots/` | staging admin bearer を用意し、user 承認後に即時取得 |

表現層の 3 層リファイン・PRIMARY ヒーロー・Segmented タブ統合・要フォロートーン強調・既存機能温存・token 正本・a11y の source-level 実装は完了。focused vitest / typecheck / lint / token gate は PASS。残存は visual evidence PNG のみ。

MINOR M-1 / M-2 / M-3 も本サイクル内（Phase 4〜9）で解消されるため、未タスク化しない（§3 参照）。

---

## 2. baseline（将来候補・本サイクル対象外）

元タスクの「スコープ外」項目を baseline 候補として記録する。いずれも **新 endpoint / API 変更を要する**ため、本タスクの不変条件（AC-7 / ui-prototype invariant #1: 新 endpoint・D1・Form 変更禁止）に抵触する。したがって本サイクルでは扱わず、将来の別タスクとして起票判断する候補に留める。

| # | 内容 | 必要な変更 | 抵触する不変条件 | 扱い |
| --- | --- | --- | --- | --- |
| OOS-1 | 会員ごとの直近 N 回セッション出席フラグの一覧表示 | 新 endpoint（会員別 × 直近 N セッションの出席マトリクス集計） | AC-7 / ui-prototype #1 | baseline 候補（未起票・将来別タスク） |
| OOS-2 | 月別「出席率」=延べ÷(セッション×総員) のサーバ集計表示 | 新 endpoint（月別出席率のサーバ集計） | AC-7 / ui-prototype #1 | baseline 候補（未起票・将来別タスク） |

> baseline は「将来あり得る価値ある拡張」として記録するのみ。本サイクルで起票・実装はしない。起票するかは別途ユーザー判断。

---

## 3. MINOR M-1 / M-2 / M-3 の扱い

| MINOR | 内容 | 未タスク化するか | 理由 |
| --- | --- | --- | --- |
| M-1 | route 二重 className / testid 整理 | **しない** | 本サイクルの Phase 5（実装）で解消（スコープ内追跡事項） |
| M-2 | 要フォロー属性名 `data-attendance-follow`（none/warn）命名分離 | **しない** | 本サイクルの Phase 5（実装）で解消（設計済・命名固定のみ） |
| M-3 | 既存 spec のレイアウト追従 | **しない** | 本サイクルの Phase 4 / 6（テスト）で解消 |

> MINOR 3 件はいずれもスコープ内の実装サイクルで解消されるため、current にも baseline にも計上しない（未タスクではない）。

---

## 4. サマリ

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| current（新規未タスク） | **1** | VIS-1（8 canonical PNG 未取得） |
| baseline（将来候補） | 2 | OOS-1（会員別直近 N 回出席フラグ一覧）/ OOS-2（月別出席率サーバ集計）— ともに新 endpoint 要 |
| MINOR（スコープ内追跡・未タスク非該当） | 3 | M-1 / M-2 / M-3（本サイクル内解消） |
