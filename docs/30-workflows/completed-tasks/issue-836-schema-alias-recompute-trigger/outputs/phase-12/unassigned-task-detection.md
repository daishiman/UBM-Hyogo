# Phase 12 output: unassigned task detection

[実装区分: 実装仕様書]

本タスクは `index.md` の「含まない」セクション（CONST_007 例外宣言）でスコープ外を明示している。それらを未タスク候補として formalize する。0 件ではない。

## 関連タスク差分確認（重複起票防止）

既存 unassigned-task との重複チェックを実施した結果:

| 既存タスク ID | 状態 | 本サイクルでの扱い |
| --- | --- | --- |
| `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` | 既存・pending | 残置（重複起票しない）。bulk recompute は本タスクから分離 |
| `serial-05-step-03-followup-007-schema-alias-rollback-notification.md` | 既存・pending | 残置（重複起票しない）。通知は本タスクから分離 |
| `serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` | 既存・原典 | 本タスクで消化（fold-state sync）。新規起票しない |

## 未タスク候補一覧

### 候補 1: bulk recompute（複数 alias 一括再集計）

| 項目 | 内容 |
| --- | --- |
| 理由 | bulk rollback の従属。複数 alias を一括 reverse-backfill する race condition 設計が recompute 単体の倍以上の検討量。bulk rollback 本体（followup-006）が未着手で依存元が不在 |
| 既存 unassigned-task の有無 | あり: `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` |
| formalize 方針 | **既存に残置・新規起票しない**。bulk recompute は bulk rollback タスクのスコープへ吸収する |
| CONST_007 該当 | 例外条件 1（今サイクル内完了が破綻する明確な理由） |

### 候補 2: recompute 完了通知（Slack / email）

| 項目 | 内容 |
| --- | --- |
| 理由 | 通知チャネル（Slack / email）の仕様合意が未済 |
| 既存 unassigned-task の有無 | あり: `serial-05-step-03-followup-007-schema-alias-rollback-notification.md` |
| formalize 方針 | **既存に残置・新規起票しない**。rollback notification タスクへ recompute 完了通知も含めて吸収する |
| CONST_007 該当 | 例外条件 1 |

### 候補 3: Queue 経由の非同期大量 recompute（Queue fan-out）— 新規未タスク候補

| 項目 | 内容 |
| --- | --- |
| 理由 | 本タスクは同期 chunk + CPU budget exhausted 時の再呼び出し（status=`running` 継続 + cursor 保存）で完結する。影響件数が CPU budget を**恒常的に**超える運用実績が出た場合のみ Cloudflare Queue fan-out 化が必要になる。現時点では運用実績がなく前提が成立しない |
| 既存 unassigned-task の有無 | なし（新規候補） |
| formalize 方針 | 運用実績（CPU budget 恒常超過）が観測された時点で新規 unassigned-task として起票する。現時点では候補として記録するのみ（先行起票しない）。起票時のトリガ条件: `schema_alias_recompute_jobs` で `status=running` のまま完了しない job が継続的に発生する運用ログ |
| CONST_007 該当 | 将来拡張（初回価値と分離） |

## fold-state sync（原典 unassigned-task）

`docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` は状態語彙セクションを持たないため、メタ情報の `ステータス` と canonical workflow セクションで fold-state を同期済み:

- `ステータス`: `consumed_via_issue_836_recompute_trigger_spec`
- `canonical_workflow`: `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/`
- canonical workflow セクション: CLOSED Issue #836 は reopen せず、最新コード実態に合わせて `recompute = response_fields.stable_key` の reverse-backfill と再定義したことを記録

Issue #836 は CLOSED 維持・reopen しない。

## 検出ソース別まとめ

| ソース | 確認結果 |
| --- | --- |
| 元タスク仕様書「含まない」（index.md L103-108） | bulk(006) / 通知(007) / Queue fan-out / 派生集計 view を明示分離 |
| Phase 3/10 レビュー MINOR 指摘 | なし（本仕様書段階） |
| Phase 11 手動テスト発見事項 | runtime_pending（実行後に再確認） |
| コードコメント TODO/FIXME | 仕様書段階のためなし |

## 新規起票件数

- 即時新規起票: **0 件**（既存 followup に吸収 + Queue fan-out は運用実績待ち）
- 記録のみの将来候補: **1 件**（Queue fan-out）

重複起票を避けつつ、Queue fan-out のトリガ条件を current gap として明文化した。
