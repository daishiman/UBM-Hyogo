# Phase 12: 未タスク検出（unassigned-task-detection）

## 結論

current 未タスク: **0 件**。AskUser 合意（2026-06-12）の A+B 両対応はすべて本仕様書スコープ内に収まり、
CONST_007（1 サイクル完結・編集 4 + 新規テスト 1・API 新設なし）を充足した。「将来タスク」「別 PR」前提の分割はない。
baseline（スコープ外・既存追跡）は下表のとおり分離記録し、本タスクでは新規起票しない。

## 検出ソースの確認結果（0 件でも記録）

| 検出ソース | 確認内容 | 結果 |
|-----------|---------|------|
| スコープ外項目の棚卸し | index.md 不変条件 8（自己復帰なし）・CONST_007 宣言と AskUser 合意（A+B）を突合 | 自己復帰フローは「先送り」ではなく**合意済みプロダクト判断による対象外**（baseline B-1 として記録のみ） |
| レビュー指摘（Phase 3 / Phase 10） | 設計レビュー・最終レビューの MINOR 候補 | 未解決指摘なし |
| TODO grep | 本 WF 配下の成果物に `TODO` / `FIXME` / 先送りマーカーがないこと | 0 件（spec 内に未決事項を残していない） |
| 親 WF 未タスク台帳 | `completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/` の C-1（#1189）を本仕様書が consume | C-1 は本 WF で消化。残りの #1190/#1191/#1192 は独立（baseline B-2） |

## current 未タスク（本タスクで完結・起票不要）

| 候補 | 判定 |
|------|------|
| C1: /profile 410 退会明示 + 導線（AC-1〜AC-3） | 本仕様書スコープ内（session-error-display.ts + テスト 2 本編集） |
| C2: MemberDrawer 復元ボタン配線（AC-4〜AC-6） | 本仕様書スコープ内（MemberDrawer.tsx 編集 + restore spec 新規） |
| 品質ゲート（AC-7〜AC-10） | 本仕様書スコープ内（検証コマンド 5 本） |

→ current として切り出す未タスクは **0 件**。

## baseline（スコープ外・本タスクでは起票しない）

| # | 候補 | 起票しない理由 |
|---|------|----------------|
| B-1 | 一般会員の**自己復帰フロー**（会員自身が退会を取り消す API/UI） | 新 endpoint 追加が必要（既存 restore は admin 専権・session-guard が 410 で遮断するため `/me/*` 系の新設計が必須）。AskUser 合意（2026-06-12）で「明示誘導＋管理者復元で根本解消」とする**プロダクト判断により対象外と決定**済み。先送りではなくスコープ外宣言（index.md 不変条件 8） |
| B-2 | 親 WF の他未タスク **#1190 / #1191 / #1192** | 本 WF（#1189 起点）と独立した別論点であり、**既存 issue として GitHub 上で追跡済み**（全 OPEN）。本 WF で重複起票・状態変更を行わない |

## current / baseline 分離の根拠

- current（0 件）= A+B の全 AC が本 workflow の 1 サイクルで完了（CONST_007）。
- baseline = (B-1) 合意済みスコープ外（新 endpoint 必要・プロダクト判断）、(B-2) 既存 issue 追跡（重複起票防止）。
  いずれも本タスクでは記録のみ行い、issue 起票・状態変更はしない（起票が必要になった場合も user-gated）。

## 完了条件（unassigned-task-detection）

- [x] 検出ソース（スコープ外項目 / レビュー指摘 / TODO grep / 親 WF 台帳）の確認結果を 0 件でも記録した。
- [x] current 未タスク 0 件を判定した（CONST_007 充足の根拠付き）。
- [x] baseline 2 系統（自己復帰フロー / #1190・#1191・#1192）をスコープ外・既存追跡として理由付きで分離記録した。
- [x] 新規 issue 起票・既存 issue 状態変更を行っていない。
