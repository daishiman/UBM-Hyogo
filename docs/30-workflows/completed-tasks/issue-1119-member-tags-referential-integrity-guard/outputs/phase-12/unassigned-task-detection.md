# Unassigned Task Detection（issue-1119-member-tags-referential-integrity-guard）

> **status: implemented_local** / NON_VISUAL / 2026-06-06
> 未タスク検出結果。**0 件でも出力必須。** current（本 wave で発生）/ baseline（本タスク以前から存在）を分離する。

---

## 1. 検出方針

本タスクは「孤児行の**検出・監査**」を application 層で実装する spec。スコープ外の派生課題
（孤児行の**自動修復**・FK 系の別アプローチ）は本タスクに混入せず、未タスク候補として分離記録する。

---

## 2. current（本 wave で新規発生した未タスク）

| # | 内容 | 判定 |
|---|------|------|
| — | なし | **0 件** |

本 wave（issue-1119 implemented_local）で新規に発生した未タスクは **0 件**。
本タスクの実装仕様（read 関数 2 + endpoint 1 + テスト + fixture 健全性確認）はスコープ内で自己完結する。

---

## 3. baseline（本タスク以前から存在する範囲外候補・別タスク候補）

| # | 候補 | 範囲外理由 | 起票判断 |
|---|------|-----------|----------|
| B-1 | 既存孤児行の**自動クリーンアップ mutation**（検出した孤児行を一括削除 / 別 tag へ寄せる write 経路） | 本タスクは **検出・監査（read-only）** がスコープ。mutation は invariant #13（write 経路は `assign*` 4 関数限定）と責務が衝突し、別 ADR が必要。検出結果を運用判断したうえで設計すべき | **起票しない（baseline 記録のみ）**。検出 endpoint 運用後に必要性が確定したら別タスク化 |
| B-2 | issue-1117 の `migrateTo`（参照付き tag の物理削除前に別 tag へ全件移行） | 別 Issue #1117 で spec 化済み（`task-issue-1117-...`）。本タスクの孤児検出とは独立した移行経路 | **起票しない（別 Issue 既存）**。重複起票回避 |

---

## 4. 関連タスク差分確認（重複チェック）

| 関連 | 内容 | 重複有無 |
|------|------|----------|
| #1070（親・完了） | tag reactivate + physical delete + count guard（削除時参照防壁） | **重複なし**。count guard は「削除時の発生防止」、本タスクは「既存孤児の検出」で責務が異なる（二段防壁） |
| #1117（別 Issue・spec 化済み） | 参照付き tag の `migrateTo` 強制移行 | **重複なし**。移行（mutation）vs 検出（read-only）で独立 |
| #1105（別 Issue・spec 化済み） | member_status FK 制約導入 | **重複なし**。member_status テーブルが対象であり member_tags とは別テーブル。本タスクは no-FK 方針を維持する点で方針も独立 |
| 直近コミット（#1078/#1079/#1080） | bulk tag picker / batchId 検索 / 部分失敗表示 | **重複なし**。member_tags の参照整合性検出には触れていない |

---

## 5. 結論

- **current 未タスク: 0 件**（起票対象なし）。
- baseline 候補 2 件（B-1 自動クリーンアップ / B-2 migrateTo）はいずれも**範囲外**として記録のみ。**新規 Issue 起票は行わない。**
- GitHub Issue #1119 は CLOSED 維持（reopen しない）。
