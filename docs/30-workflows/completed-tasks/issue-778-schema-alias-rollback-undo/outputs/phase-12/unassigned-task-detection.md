# Phase 12 output: unassigned task detection

[実装区分: 実装仕様書]

## 本タスクから明示分離した followup（CONST_007 例外）

### followup-003: schema diff history view（独立 UI screen）

- 分離理由: 完全な history view は別 route + nav 追加が必要で、scope 2 倍以上に肥大化
- 実施時期目安: next sprint
- 実施場所: 既存 `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md`
- 本タスクとの関係: SchemaDiffPanel 内蔵 HistoryPane を後で history view に吸収できるよう `<HistoryPane>` 内部 component で実装する縮退案を本タスクで採用

### followup-005: rollback 後の集計再実行

- 分離理由: 集計バッチ仕様の合意未済（集計 view が複数候補）
- 実施時期目安: 集計 view 仕様確定後
- 実施場所: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md`
- 本タスクとの関係: rollback modal で「再集計要否 warning」を表示するのみ、再集計実行は本タスク外

### followup-006: bulk rollback

- 分離理由: race condition 設計負荷が rollback 単体の倍以上
- 実施時期目安: rollback 単体運用が安定したあと
- 実施場所: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`

### followup-007: rollback notification

- 分離理由: 通知チャネル（Slack / email）仕様の合意未済
- 実施時期目安: notification policy 確定後
- 実施場所: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md`

## fold-state sync（原典 unassigned-task）

`docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md` の状態語彙セクションに以下を追記:

```
| consumed_via_issue_778_rollback_undo_spec | 2026-05-19 | 本タスクは docs/30-workflows/issue-778-schema-alias-rollback-undo/ で消化済み。Phase 12 同期完了 |
```

## 新規発生

本レビューサイクルで追加の未タスク化は行わない。検出候補は以下の通り同サイクル内で処理済み、または既存 followup に吸収済み。

| 候補 | 判定 | 理由 |
| --- | --- | --- |
| 既存 resolve audit と rollback audit の紐付け補助 | 同サイクル内で実装済み | `schema_diff.alias_assigned.after_json.aliasId` を `relatedAuditId` 検索対象に追加 |
| rollback 済 alias の再 resolve UI 警告 | followup-003 / history view に吸収 | rollback 本体の成立条件ではなく、履歴閲覧 UI の拡張判断 |
| 集計 view の `deleted_at` 再点検 | followup-005 に吸収 | rollback 後 recompute trigger / 集計再実行設計の一部として扱う |
