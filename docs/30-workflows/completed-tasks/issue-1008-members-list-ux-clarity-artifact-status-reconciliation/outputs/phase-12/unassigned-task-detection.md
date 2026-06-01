# Phase 12: 未タスク検出

未タスクが 0 件でも本レポートは必須出力とする。`current`（本タスクで対応）と `baseline`
（既存・スコープ外で既に整理済み）を分離して記録する。

## 検出結果サマリ

**0 件**（reconciliation スコープで完結）。新規 unassigned task は発生しない。

## 1. 元タスク仕様書のスコープ外項目

| # | 項目 | 区分 | 判定 |
|---|------|------|------|
| 1 | `apps/` 配下のアプリケーションコード変更 | スコープ外（禁止）| 元実装は commit `37fe488e8` でマージ済み。本タスクは status 補正のみ。新タスク化不要 |
| 2 | `members-list-ux-clarity` の実装内容・evidence 中身の変更 | スコープ外 | 変更しない方針が不変条件。新タスク化不要 |
| 3 | commit / push / PR | スコープ外（user-gated / Phase 13）| 本 spec の Phase 13 で user-gated として定義済み。新タスク化不要 |
| 4 | issue #1008 の状態変更 | スコープ外 | CLOSED のまま維持。新タスク化不要 |
| 5 | staging visual baseline（Gate-C 相当）| スコープ外（user-gated）| 対象 workflow の Gate-C として `pending` 維持。本 reconciliation の責務外で新タスク化不要 |

## 2. Phase 3 / Phase 10 の MINOR 指摘

| Phase | 指摘 | 区分 | 判定 |
|-------|------|------|------|
| Phase 3 | sub-task の phase status 表記不統一（`spec_created` 値混在）| MINOR | Phase 2 で `completed`/`pending` 正規化方針として補正対象に内包済み。新タスク化不要 |
| Phase 3 | gate `passed` 化時の evidence path 実在確認 | MINOR | `gate-metadata:validate` が path 実在を検査。補正手順に内包済み。新タスク化不要 |
| Phase 10 | — | — | 本 spec の Phase 10 で未解決 MINOR なし |

## 3. 関連タスク差分確認

| 関連タスク | 差分 | 判定 |
|------------|------|------|
| `issue-976-admin-fetch-service-binding`（整合先正本例）| 規約は同一（`implemented_local_runtime_pending` + Gate-A/B passed + Gate-C pending）| 差分なし。借用のみ |
| aiworkflow register / inventory | 既に `implemented_local_runtime_pending` 記載 → 実 `artifacts.json` の `spec_created` と drift | 本 reconciliation が artifacts 側を正にして解消。新タスク化不要 |

## 4. current / baseline 分離

| 区分 | 内容 |
|------|------|
| **current**（本タスクで対応）| 補正対象 6 ファイルの status / checkbox 整合補正、root↔outputs parity、register 整合確認 |
| **baseline**（既存・スコープ外）| 元実装（feat #1009）、Phase 11 evidence（24 PNG）、Phase 12 strict 7 — いずれも既に整備済みで本タスクは変更しない |

## 結論

reconciliation の単一責務（CONST_007 充足）で全スコープが 1 サイクル内に完結する。
先送り項目・分割の必要・新規 unassigned task はいずれも **0 件**。
