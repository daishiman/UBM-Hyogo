# Phase 11: 発見事項（discovered-issues）

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001
- 段階: implemented_local_runtime_pending（semantic/focus/CSS sanity はローカルで確認済み。data-backed screenshot は auth 設定済み環境で実施）

## 1. 発見した問題（HIGH / MEDIUM / LOW）

| 重大度 | 内容 | 対応 |
| --- | --- | --- |
| LOW | staging data-backed screenshot は未実施 | local component-harness で Phase 11 canonical screenshot 3 枚を取得済み。staging または auth 設定済みローカルでの data-backed 再取得は Phase 13 user-gated verification として扱う。source-level / focused test / component-harness visual は pass のため未タスク化しない |

## 2. スコープ外の改善提案（未タスク候補）

| 候補 | 内容 | 判定 |
| --- | --- | --- |
| topTags 未登録 tag の表示名解決 | `search.tag` に topTags 外の code が入った場合、表示名に解決できず `#{code}` fallback となる。全 tag の表示名を取りに行くには API/データ拡張が必要 | **本タスクスコープ外**。GitHub #222（public search query parser shared 化）系の別責務・非依存。本タスクは code fallback で許容（元 issue にもスコープ外明記）。新規未タスク起票は不要 |

## 3. フィードバックループ

今後 Phase 11 の data-backed screenshot 取得時に HIGH 問題が出た場合のみ、`docs/30-workflows/unassigned-task/` へ spec を自動生成する。現時点の staging data-backed 未実施は user-gated runtime 境界であり、実装欠陥としては扱わない。
