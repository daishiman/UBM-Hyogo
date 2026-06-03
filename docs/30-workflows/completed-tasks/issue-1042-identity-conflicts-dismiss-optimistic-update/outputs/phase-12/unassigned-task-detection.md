# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 0 件でも出力必須。検出ソースを網羅し、候補は理由付きで記録する。current（本サイクル検出）と baseline（既存タスク差分）を分離する。

---

## 検出ソース一覧（current）

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」（Phase 1.3） | Phase 1 で明示的にスコープ外宣言した項目 | 候補 1 件（row fade animation） |
| Phase 3 / Phase 10 レビュー MINOR | MINOR 判定の指摘事項 | 新規 HIGH/MEDIUM なし。fade animation のみ（候補 1 と同一） |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | 手動テスト・Playwright 実施済み。HIGH なし |
| コードコメント（TODO / FIXME / HACK / XXX） | 対象 3 ファイルの新規残存コメント | コード編集済み。新規残存なし |
| `describe.skip` ブロック | 削除 testid / 要素名の旧参照残存 | コード編集済み。新規残存なし |

---

## 候補（1 件・既存 unassigned 管理済み）

### 候補 1: row 消失時の fade animation

| 項目 | 内容 |
| --- | --- |
| 検出ソース | 元タスク仕様書「スコープ外」（Phase 1.3）/ Phase 10 MINOR |
| 内容 | optimistic hide を即時 `return null` ではなく短い fade animation 付きで見せる UX 改善 |
| スコープ外の理由 | **Issue #1042 本文が別 followup `admin-identity-conflicts-followup-005-row-fade-animation` に明示的に分離宣言している**。本サイクルで実施すると Issue スコープを逸脱し、visual baseline と a11y motion preference（`prefers-reduced-motion`）の追加検証が必要になり最小実装を超える |
| 状態 | 既存 unassigned 管理済み |
| formalize 判定 | **新規 formalize 不要**。`docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md` が存在するため、本サイクルで重複起票しない |
| 担当タスク ID | `admin-identity-conflicts-followup-005-row-fade-animation` |

> dismiss optimistic 化（本タスクのスコープ）と fade animation は同じ component（`IdentityConflictRow`）内だが、fade は CSS transition + 遅延 unmount の追加実装と visual/a11y 検証を伴うため、本タスク（state 1 個追加 + ハンドラ差し替え + render guard 統合）とは粒度が異なる。issue 分離宣言を尊重し本サイクルでは扱わない。

---

## 関連タスク差分確認（baseline・FB-CANCEL-004-2）

既存 `admin-identity-conflicts-followup-*` 系・親/兄弟ワークフローとの重複チェック。

| 既存タスク / Issue | 重複の有無 | 判定 |
| --- | --- | --- |
| `issue-988-identity-conflicts-merge-optimistic-update`（親 / merge 側） | 重複なし（merge optimistic は実装済み。本タスクは dismiss 経路を対称追加） | 別関心。本タスクは render guard 統合時の merge 非回帰のみ依存 |
| `admin-identity-conflicts-followup-002-merge-confirm-optimistic-update` | 重複なし（#988 ワークフローへ昇格・consumed 済み） | 本タスク（dismiss）とは別スコープ |
| `admin-identity-conflicts-followup-005-row-fade-animation`（候補 1） | 既存 unassigned spec が存在 | 重複起票しない。本サイクルでは参照のみ |
| dismiss optimistic 化（本タスクのスコープそのもの） | 既存タスクに同一スコープなし → 本ワークフローが担当 | 重複なし |

---

## 結論

- **本サイクルで formalize する未タスク: 0 件**（候補 1 = fade animation は issue が別 followup へ明示分離しており、既存 unassigned spec `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md` で管理済み）。
- 親 #988・兄弟 followup・別 followup（fade animation）との重複起票なし。
- dismiss optimistic 化は本ワークフロー（`issue-1042-...`）が唯一の担当であり、重複タスクは存在しない。

## 完了条件

- 検出ソース表（5 ソース）が current として記載されていること。
- 候補（fade animation 1 件）が既存 unassigned 管理済み・重複起票不要として記録されていること。
- 関連タスク差分確認（baseline）で親 #988・別 followup との重複なしが確認されていること。
- current / baseline が分離されていること。
