---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-03
task_id: issue-1063-shell-collapse-cookie-secure-attribute
issue: 1063
issue_state: CLOSED
---

# 未タスク検出レポート

## サマリ

| 区分 | 件数 |
|------|------|
| 今サイクルで formalize する未タスク | 0 |
| backlog 候補 | 0 |
| 非タスク観察事項 | 2（対象不在 / YAGNI のため未タスク化しない） |

## 検出ソース別確認

| ソース | 確認項目 | 結果 |
|--------|----------|------|
| 元タスク仕様書 | 「スコープ外」明示項目 | 他 cookie の Secure 化 / `browserLocation()` 横展開 = 本タスクの単一責務外（先送りでなく別関心） |
| Phase 3/10 レビュー | MINOR 判定 | M-1 / M-2（下記） |
| Phase 11 手動テスト | スコープ外発見 | なし（NON_VISUAL・serializer 単体） |
| コードコメント | TODO/FIXME/HACK/XXX | 対象 2 ファイルに新規 TODO を残さない設計 |
| `describe.skip` | 旧参照残存 | なし（test は追記のみ・削除/改名なし） |

## 関連タスク差分確認（重複起票防止）

| 既存タスク | 重複か | 判断 |
|-----------|--------|------|
| issue-1063（本タスク） | — | 本タスク自身 |
| #1065（issue-1024-followup-002 / doc 命名ドリフト） | 重複しない | cookie 名のドキュメント整合であり `Secure` 属性とは独立した関心 |

## 非タスク観察事項（未タスク化しない）

| # | 内容 | 判定 | 未タスク化しない理由 |
|---|------|--------|----------------|
| O-1 | `is-browser.ts` に汎用 `browserLocation()` accessor を設け `location.protocol` 参照を統一 | 非タスク | 現状 `location` を参照するのは本タスクの serializer 1 箇所のみ。横展開の需要が複数箇所に生じてから設計するのが適切（YAGNI）。本タスクは `browserDocument()?.location` で完結 |
| O-2 | 他 UI 設定 cookie（density 等）追加時の `Secure` 標準化を doc 化 | 非タスク | 対象となる第2の UI cookie がまだ存在しない。実需が生じる cookie 追加タスクで併せて対応するのが整合的 |

> O-1 / O-2 は「検出した改善点の先送り」ではなく、現時点で対象が単一または不在のためタスク要件を満たさない観察事項。将来 `location` 参照箇所が増える / 第2の UI cookie が追加される時点で、その実タスク内で再評価する。

## 判定

**今サイクルで formalize すべき未タスク = 0 件。backlog 送り = 0 件。** 本タスクの単一責務（collapse cookie の `Secure` 環境分岐）は 2 ファイル編集 + focused test で 1 サイクル完結する（CONST_007）。先送り分割なし。
