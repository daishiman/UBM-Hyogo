# Phase 11: 手動テスト / 証跡取得

> 正本は `outputs/phase-11/main.md`。本ファイルは root index からの導線兼サマリ。
> 正本更新後、本サイクルでは local screenshot 2 枚を取得済み。PR 作成・実機 IME/staging 撮影は user-gated。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 10 / 次 Phase: 12
- 作成日: 2026-06-02

## 目的

本タスクは **VISUAL**（NON_VISUAL ではない）であり、視覚証跡を要する。
ただし日本語 IME 操作を伴う検索 UI の実機 screenshot は **staging 認証 + 実機 IME 操作が必要なため user-gated**。
two-tier evidence（local jsdom render unit + local screenshot + staging IME screenshot）の取得方針と撮影計画を確定する。

## 実行タスク

1. Tier 1（local jsdom render unit）の証跡対象を確定する。
2. Tier 1 runtime（local `/members` screenshot）を取得する。
3. Tier 2（staging IME screenshot）の撮影予定画面と canonical 命名を確定する（撮影は user-gated・将来実施）。

## 参照資料

- `outputs/phase-11/main.md`（証跡正本）
- `phase-4.md`（テスト計画）/ `phase-5.md`（実装手順・検証コマンド）

## 成果物

- `outputs/phase-11/main.md`
- `phase-11.md`（本ファイル）

## 統合テスト連携

Tier 1 の jsdom render unit は Phase 4 のテストケースと一致し、全 Green で present 化済み。
local screenshot は `outputs/phase-11/screenshots/` に 2 枚 present。
Tier 2 の staging screenshot は実装後の user-gated 承認後に取得し、視覚回帰の baseline 候補とする。

## 完了条件

- [x] VISUAL かつ local screenshot present / staging real-IME screenshot user-gated であることを明記
- [x] two-tier evidence の構成を確定
- [x] local screenshot 2 枚を取得
- [x] 撮影予定画面と canonical 命名を確定
- [x] 実機撮影は user-gated・将来実施であることを明記
