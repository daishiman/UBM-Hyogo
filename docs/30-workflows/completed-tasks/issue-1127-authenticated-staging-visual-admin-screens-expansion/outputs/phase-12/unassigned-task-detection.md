# Unassigned Task Detection — issue-1127

## 検出結果サマリー

**current 新規未タスク: 0 件** / baseline（既追跡・本タスクで新規化しない）: 2 件

## current（本タスクで新たに起票すべき未タスク）

| ソース | 確認 | 新規未タスク |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」 | mutation result baseline は §2.3 で C-1 系へ恒久委譲済（既追跡）| 0 |
| Phase 3/10 レビュー MINOR | MINOR-01（C-1 系境界）/ MINOR-02（baseline 生成手順）を確認（下記）| 0 |
| Phase 11 手動テスト | スコープ外発見なし（read-only 5 画面で完結）| 0 |
| コードコメント TODO/FIXME | spec 5 本に TODO/FIXME なし（read-only ガードのみ）| 0 |
| `describe.skip` 残存 | 該当なし（新規 spec に skip なし）| 0 |

→ **新規未タスク 0 件**。

## baseline（既存追跡・本タスクで新規化しない）

| ID | 内容 | 既追跡先 | 新規化しない理由 |
| --- | --- | --- | --- |
| B-1 | mutation result 状態の authenticated staging visual baseline（承認後 / merge 後 / 削除後 / bulk 適用後）| C-1 系 mutation baseline（issue-1125 系列 seed/cleanup runner）| issue #1127 §2.3 が定義する恒久アーキテクチャ境界。read-only capture（本タスク）とは必要インフラが根本的に異なる独立タスク族。重複起票しない |
| B-2 | 横展開した read-only spec の baseline 初回生成 + CI 認識の運用手順ドキュメント化（MINOR-02）| 実装/capture execution 時（user-gated）に実施。phase-5.md §5.5 / phase-11.md に手順記載済 | 仕様書内に手順を記載済で、execution 時の運用作業。独立未タスクにするほどの scope ではない（YAGNI）|

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

- 既存 issue #1125 / issue-1126（bulk tag picker viewport / result mutation visual baseline）と本タスクは
  **read-only 横展開 vs mutation result** で責務分離されており重複しない。
- 既実装 3 画面（/admin, /admin/tags, /admin/members）は別タスクで完了済のため本タスクから除外（再起票しない）。

## 判定

current 0 件 / baseline 2 件（既追跡）。Phase 10 MINOR 指摘は「機能影響なし」ではなく
「既追跡 C-1 系境界（B-1）」「仕様書内に手順記載済（B-2）」を理由に新規未タスク化しない（silent drop ではなく明示除外）。
