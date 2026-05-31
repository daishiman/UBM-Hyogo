# Phase 12: 未タスク検出（unassigned task detection）

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

> 本ファイルは検出結果が 0 件でも必須。current（本 wave）と baseline（元タスク仕様）を分離して記録する。

## 1. ソース別確認

| ソース | 確認内容 | 検出 |
| --- | --- | --- |
| 元タスク仕様書スコープ外 | `task-members-selected-filters-chip-ux-hardening-001.md` のスコープ外要件 | 候補 1 件（§2 で評価） |
| Phase 3 / Phase 10 の MINOR 指摘 | 設計レビュー・最終レビューで MINOR 化された残課題 | なし |
| Phase 11 手動テスト | 手動計画から派生する新規課題 | なし |
| コードコメント TODO / FIXME | 影響 surface 3 ファイルの TODO/FIXME | なし（grep 0 件） |
| `describe.skip` / `it.skip` | 対応 2 spec の skip テスト | なし |

## 2. 検出候補の評価

| 候補 | 内容 | 判定 |
| --- | --- | --- |
| topTags 未登録 tag の表示名解決（API 拡張） | `search.tag` に `topTags` に載らない code が来た場合、表示名を解決するには API/D1 側の拡張（全 tag の code→label 解決）が必要 | **新規起票不要** |

### 判定根拠

- 本タスクは未登録 code を `#${code}` の **code fallback で許容**する設計（AC-2 / 純粋関数の防御的返却）であり、表示名解決の API 拡張は本タスクの DoD に含まれない（元 Issue #1006 にスコープ外として明記済み）。
- 全 tag の表示名解決は **GitHub #222（public search query parser shared 化）系の別責務**であり、本タスクとは **非依存**。本タスクの code fallback は #222 の有無に関わらず安全側に倒れる。
- したがって本タスクから新規未タスクを起票する必要はなく、当該領域は既存 #222 の射程で扱う。

## 3. 関連タスク差分確認（[FB-CANCEL-004-2]）

| 既存タスク | 重複チェック結果 |
| --- | --- |
| GitHub #222（public search query parser shared 化） | **重複なし**。#222 は query parser の共有化（解析層）であり、本タスクは chip 表示・focus・mobile CSS（描画/UX 層）。責務が異なり、本タスクの新規未タスクは #222 と重複しない。 |
| `members-list-ux-clarity`（親・completed） | **重複なし**。親は `SelectedFiltersBar` の一般化（実装済み前提）。本タスクはその堅牢化で、追加未タスクは発生しない。 |

## 4. 結論

| 区分 | 件数 |
| --- | --- |
| current（本 wave 由来の新規未タスク） | **0 件** |
| baseline（元タスク仕様由来の残課題） | 0 件（上記候補は #222 射程・本タスクは code fallback で許容） |

**新規起票 0 件で確定。**
