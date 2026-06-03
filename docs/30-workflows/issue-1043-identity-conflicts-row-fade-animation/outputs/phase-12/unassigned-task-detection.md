# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 0 件でも出力必須。検出ソースを網羅し、候補は理由付きで記録する。current（本タスク由来）と baseline（既存）を分離する。

---

## 検出ソース一覧

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」（Phase 1.4） | Phase 1 で明示的にスコープ外宣言した項目 | dismiss 側 fade / hook 汎化 / API 変更 等は本タスク AC 外・別タスク or 不要判断済み |
| Phase 3 レビュー MINOR | MINOR-1（scale 簡素化）/ MINOR-2（#988 screenshot 意味 drift） | いずれも本タスク内で解決済み（未タスク化不要） |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | implemented_local_evidence_captured のため未実行。設計上 HIGH 候補なし |
| コードコメント（TODO / FIXME / HACK / XXX） | 対象 3 ファイルの新規残存コメント | 実コード差分あり。対象差分に新規 TODO / FIXME / HACK / XXX コメントなし |
| `describe.skip` ブロック | 削除 testid / 要素名の旧参照残存 | implemented_local_evidence_captured のため新規なし |

---

## current（本タスク由来）— MINOR 個別評価

### MINOR-1: `scale-[0.99]`（collapse 補助）の扱い

| 項目 | 内容 |
| --- | --- |
| 検出ソース | Phase 3 §3.4 MINOR-1 |
| 内容 | `scale-[0.99]` は opacity fade のみでも AC を満たすため任意。height collapse（行高縮小）まで行うと layout reflow が flaky リスク |
| 扱い | **本タスク内で確定（未タスク化不要）**。実装は opacity を主とし scale は任意。height collapse は本タスクでは行わないと Phase 3 で決定済み。Phase 8 で簡素化確認する設計のため、新規 followup は不要 |

### MINOR-2: 親 #988 screenshot の意味 drift

| 項目 | 内容 |
| --- | --- |
| 検出ソース | Phase 3 §3.4 MINOR-2 |
| 内容 | 親 #988 の `identity-conflict-row-optimistic-removed.png` は「即時削除」時点の証跡。本タスクで挙動が「fade 後の安定 removed」へ変わるため意味が drift する |
| 扱い | **#1043 metadata 注記で解決済み（未タスク化不要）**。#988 成果物は越境編集せず、#1043 側の capture metadata / implementation-guide §視覚証跡に「#988 screenshot は即時削除時点の証跡」と注記し、#1043 で新 canonical screenshot 3 枚（`-exiting-fade` / `-removed-stable` / `-rollback-restored`）を撮る方針が Phase 1.4 / Phase 3 で確定済み。新規 followup 不要 |

→ **current（本タスク由来）の新規未タスク: 0 件**。MINOR-1/MINOR-2 はいずれも本ワークフロー内で解決方針が確定しており、別 followup への切り出しは不要。

---

## baseline（既存）— 関連 followup / Issue の差分確認（FB-CANCEL-004-2）

既存 `admin-identity-conflicts-followup-*` 系 / 関連 Issue との重複チェック。

| 既存タスク / Issue | 重複の有無 | 判定 |
| --- | --- | --- |
| `#1042`（dismiss optimistic update） | **重複なし・独立** | dismiss 側の optimistic 化は別タスク。本 #1043（merge row fade）とは対象操作が異なり、設計上も独立 boolean で分離されるため fade を巻き込まない。本タスクでは新規起票しない |
| `admin-identity-conflicts-followup-005-row-fade-animation`（発見元 unassigned spec） | 重複なし（本 issue-1043 ワークフローへ昇格済み） | 統合先 = 本ワークフロー。新規起票不要。PR/Issue close cycle で consumed trace 化 |
| `#988`（merge optimistic update・親） | 重複なし（#988 は即時 hide、本タスクは fade 退場の追加差分） | 親サイクル completed-tasks 配下。本タスクで上乗せ |
| `#987` audit log medium（identity-conflicts 系） | 重複なし（監査ログ領域、merge fade とは別関心） | 別タスク継続 |

> baseline 側に本タスクと同一スコープ（merge row exit fade animation）の既存タスクは存在しない。remediation 対象の既存 baseline 違反も検出されていない。

---

## 関連タスク差分確認（#1042 との独立性の明記）

- **#1042（dismiss optimistic）と本 #1043（merge row fade）は独立**。
  - 対象操作: #1042 = dismiss（別人マーク）、#1043 = merge（統合）。
  - state 設計: 本タスクの exiting fade は merge 専用 state（`isExiting` / `exitTimerRef` / merge の `onMerge` 経路）にのみ適用。dismiss は exiting / fade を一切適用しない（Phase 1.4 スコープ外・Phase 2 §2.0 で確認）。
  - 干渉: 各 row が独立 component instance で、merge と dismiss は別 state を持つため相互干渉しない。
- 仮に将来 dismiss 側にも fade を入れる場合は #1042 の延長で別途検討するが、本タスクでは扱わない（需要未確認）。

---

## 結論

- **本サイクルで formalize する未タスク: 0 件**。
- current（本タスク由来）の MINOR-1（scale 簡素化）/ MINOR-2（#988 screenshot 意味 drift）はいずれも本ワークフロー内で解決方針が確定済みのため未タスク化不要。
- baseline（既存）に本タスクと同一スコープの重複タスク・未処理 remediation はなし。
- #1042（dismiss optimistic）は独立タスクであることを明記し、本タスクでの巻き込み・新規起票はしない。
