# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 0 件でも出力必須。検出ソースを網羅し、候補は理由付きで記録する。

---

## 検出ソース一覧

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」 | Phase 1 で明示的にスコープ外宣言した項目 | 候補 1 件（dismiss optimistic 化） |
| Phase 3 / Phase 10 レビュー MINOR | MINOR 判定の指摘事項 | 候補 2 件（dismiss optimistic 化 / fade animation） |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | HIGH なし。visual capture は local PASS |
| コードコメント（TODO / FIXME / HACK / XXX） | 対象 3 ファイルの新規残存コメント | 新規なし |
| `describe.skip` ブロック | 削除 testid / 要素名の旧参照残存 | 新規なし |

---

## 候補（2 件）

### 候補 1: dismiss 側の optimistic 化

| 項目 | 内容 |
| --- | --- |
| 検出ソース | 元タスク仕様書「スコープ外」（Phase 1.2） |
| 内容 | merge を optimistic 化するのに対し、dismiss（別人マーク）操作は本サイクルでは optimistic 化しない |
| スコープ外の理由 | Issue #988 が dismiss を**明示的にスコープ外宣言**しており（dismiss 不変が受け入れ基準）、本サイクルで実施すると Issue スコープを逸脱する |
| 状態 | 未タスク候補（本サイクルでは formalize しない） |
| 実施時期 | 必要が生じた時点で別 followup として起票（現時点で実需要は確認されていない） |
| 担当タスク ID | 未採番（起票時に決定） |

> dismiss 側は merge と同じ component（`IdentityConflictRow`）内だが、optimistic state を共有せず独立 boolean を別途持たせれば対応可能。ただし本サイクルでは需要が確認されていないため、即時起票はしない。

### 候補 2: row 消失時の fade animation

| 項目 | 内容 |
| --- | --- |
| 検出ソース | Phase 10 MINOR |
| 内容 | optimistic hide を即時 `return null` ではなく短い fade animation 付きで見せる UX 改善 |
| スコープ外の理由 | Issue #988 の受け入れ基準は「操作直後に row が一覧から消える」ことで、animation は追加価値だが必須ではない。今回入れると visual baseline と a11y motion preference の追加検証が必要になり、最小実装を超える |
| 状態 | 未タスク候補（本サイクルでは formalize しない） |
| 実施時期 | 実運用で消失が唐突というフィードバックが出た時点 |
| 担当タスク ID | 未採番（起票時に決定） |

---

## 関連タスク差分確認（FB-CANCEL-004-2）

既存 `admin-identity-conflicts-followup-*` 系との重複チェック。

| 既存タスク / Issue | 重複の有無 | 判定 |
| --- | --- | --- |
| `admin-identity-conflicts-followup-002-merge-confirm-optimistic-update` | 重複なし（本 issue-988 ワークフローへ昇格済み） | 統合先 = 本ワークフロー。新規起票不要 |
| `#987` audit log medium（identity-conflicts 系） | 重複なし（監査ログ領域、merge optimistic とは別関心） | 別タスク継続 |
| `#989` manualMergeReason schema low | 重複なし（schema 領域、本タスクは payload 不変） | 別タスク継続 |
| dismiss optimistic 化（上記候補 1） | 既存タスクに同一スコープなし | 重複なし。起票時は新規 ID |
| fade animation（上記候補 2） | 既存タスクに同一スコープなし | 重複なし。起票時は新規 ID |

---

## 結論

- **本サイクルで formalize する未タスク: 0 件**（候補 2 件はいずれも Issue #988 の必須 AC 外で、同一サイクル実装すると scope creep になるため分離保留）。
- 候補 1（dismiss optimistic 化）と候補 2（fade animation）は需要発生時に別 followup として起票する旨を記録した。
- 既存 followup 系との重複起票なし。
