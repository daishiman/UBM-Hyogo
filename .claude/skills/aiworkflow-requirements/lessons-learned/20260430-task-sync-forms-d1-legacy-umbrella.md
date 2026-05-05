# task-sync-forms-d1-legacy-umbrella-001 Lessons Learned

## L-LEGACY-UT09-001: stale hit 0 を仮定しない

Phase 12 の Step 2 を N/A にする前に、`Google Sheets API`、単一 `/admin/sync`、`sync_audit` のような旧語を実測検索する。hit がある場合は削除ではなく `current drift` / `historical allowed` / `superseded backlog` に分類する。

## L-LEGACY-UT09-002: legacy umbrella は direct 残責務 0 件を表で固定する

旧タスクを閉じる場合、後継タスク名だけでは不十分。schema / response / endpoint / cron / data boundary の責務移管表を置き、direct 実装を増やさない根拠を残す。

## L-LEGACY-UT09-003: `spec_created` と Phase status を混同しない

docs-only close-out では workflow root の `metadata.workflow_state` を `completed` へ上げない。Phase 12 の作業状態は `phases[12].status=completed_with_followups` で表現し、実装完了と誤読される状態を避ける。

## 5分解決カード

| 症状 | 最短確認 | 対応 |
| --- | --- | --- |
| 旧 Sheets sync を current と誤読しそう | `rg -n "Google Sheets API|/admin/sync\\b|sync_audit" .claude/skills/aiworkflow-requirements/references` | current / historical / superseded に分類してから修正 |
| Phase 12 が PASS WITH FOLLOW-UPS のまま残る | `phase12-task-spec-compliance-check.md` の same-wave sync 表を見る | 同期済み項目と別チケット項目を分離し、結論を事実に合わせる |
