# Lessons Learned: UT-02A Attendance Profile Integration（2026-05）

## L-UT02A-001: workflow state は実装差分と同一 wave で昇格する

`spec_created` のまま実装と tests を追加すると、正本 inventory と後続タスク選定が未着手扱いになる。実装 close-out では root / outputs `artifacts.json`、legacy stub、親 unassigned、resource-map、quick-reference、task-workflow-active を同一 wave で `implemented / Phase 1-12 completed / Phase 13 pending_user_approval` へ揃える。

## L-UT02A-002: schema 名は migration 実体を優先する

設計ドラフトに `held_at` / `deleted_at` / `meeting_session_id` が残っていても、実 migration が `held_on` / `session_id` / no `deleted_at` の場合は実体を正本化する。削除 meeting 除外は `deleted_at` ではなく `meeting_sessions` INNER JOIN の不一致除外として扱う。

## L-UT02A-003: optional provider fallback は互換性、完了証跡ではない

`attendanceProvider` 未注入時の `attendance: []` は 02a 互換 fallback に限定する。完了判定は route wiring tests と Phase 11 NON_VISUAL evidence で provider 注入経路を確認する。

## L-UT02A-004: D1 read aggregator は chunk と deterministic ordering をセットで記録する

`findByMemberIds()` のような batch read は bind 上限対策（80-id chunk）、join 方針、重複正規化、sort order を仕様書と tests に同時固定する。
