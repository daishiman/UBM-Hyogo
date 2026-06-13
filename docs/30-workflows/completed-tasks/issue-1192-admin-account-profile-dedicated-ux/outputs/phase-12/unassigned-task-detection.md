# Unassigned Task Detection — issue-1192-admin-account-profile-dedicated-ux

## 検出結果

新規未タスク: **0 件**

## 分類（current / スコープ外検討痕跡 / CONST_007 分離）

| 項目 | 分類 | 根拠 | 扱い |
| --- | --- | --- | --- |
| 管理者補助導線 `AdminAccessNotice` の新設（分岐 (b)） | current scope | R-1 / AC-1〜AC-2 の本体 | 本ワークフローの実装サイクルで完結。未タスク化しない |
| 非管理者描画の不変保証 | current scope | R-2 / AC-3 | 同上（T-P2 で固定） |
| degrade 分岐の不変保証 | current scope | AC-4 | 同上（既存 guard + T-P3 で固定） |
| **session 有効 + D1 drift 時の 401 → `/login` 挙動** | スコープ外（検討痕跡として記録） | `session-guard.ts` の 401 は session 上の memberId が D1 と整合しない場合の挙動であり、**全 member 共通の既存挙動**。本 Issue の主題（管理者固有の `/profile` UX）の課題ではない。元 Issue も「401 redirect はバナー事象と別経路」とスコープ分離済み。本仕様の変更はこの経路に一切触れない | **未タスク化もしない**（先送りではなく課題外）。必要なら将来の独立検討として扱う |
| 管理画面（`/(admin)/**`）側の変更 | スコープ外 | 導線の到達先であり変更不要（Phase 1 §スコープ外） | 未タスク化しない |
| member（非管理者）側の `/profile` UX 変更 | スコープ外 | 元 Issue「含まない」明記 | 未タスク化しない |

## CONST_007 例外による分離

**0 件**。本仕様書は単一サイクル・単一 PR で完了するスコープであり、分割・先送りは行わない（Phase 1 §スコープ境界）。BLOCKER/MINOR の格下げによる未タスク逃がしも発生していない。

## Issue #1192 の扱い

- Issue #1192 は **CLOSED のまま維持**する（再オープンしない・PR で close キーワードを使わない）。
- 2026-06-12 時点で対応実装は存在しない（`/profile` に `isAdmin` 参照 0 箇所）が、Issue を再オープンせず、本ワークフロー `docs/30-workflows/completed-tasks/issue-1192-admin-account-profile-dedicated-ux/` を **canonical な実装仕様**として本実装サイクルで解消した。
- したがって本件のための新規 Issue 起票も行わない（canonical workflow が追跡単位）。
