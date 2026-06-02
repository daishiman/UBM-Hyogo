# Phase 11 Evidence Index — publish-state-backfill-admin-ui

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 11 / 13 |
| visualEvidence | VISUAL_ON_EXECUTION |
| runtime evidence | **PENDING_RUNTIME_EVIDENCE（staging user-gated）** |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| created | 2026-06-01 |

## evidence 区分とステータス

| Classification | Path | Status |
|----------------|------|--------|
| evidence index | `outputs/phase-11/main.md` | present |
| manual test plan | `outputs/phase-11/manual-test-plan.md` | present |
| interaction states | `outputs/phase-11/interaction-states.md` | present |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |
| manual smoke log | `outputs/phase-11/manual-smoke-log.md` | present |
| link checklist | `outputs/phase-11/link-checklist.md` | present |
| screenshot (backfill-panel-initial) | `outputs/phase-11/screenshots/backfill-panel-initial.png` | pending |
| screenshot (backfill-dry-run-result) | `outputs/phase-11/screenshots/backfill-dry-run-result.png` | pending |
| screenshot (backfill-apply-result) | `outputs/phase-11/screenshots/backfill-apply-result.png` | pending |
| screenshot (backfill-error) | `outputs/phase-11/screenshots/backfill-error.png` | pending |

## runtime evidence についての注記

- 本タスクは admin UI（`/admin/sync-status` の backfill パネル）であり、描画には **admin login（staging）が必須**。
- screenshot 取得は CONST_002 により **user-gated**。本サイクルでは静的 png を取得しない。
- backfill endpoint は proxy の `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` server-only 注入に依存（NO-GO-1）。
  注入は **Task B に集約**されており、Task B 完了後の staging でのみ runtime 描画が成立する。
- したがって本 evidence は deterministic plan evidence（計画 + 期待描画の定義）であり、verdict は **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**。実 png は後続 staging で取得（status=pending）。

## 検証済み（jsdom 単体テスト）

| TC | 状態（ST） | spec |
|----|-----------|------|
| TC-A1 | ST-2（dry-run 結果） | `BackfillPublishStatePanel.spec.tsx` |
| TC-A2 / TC-A7 | ST-4（apply 結果 + onApplied） | 同上 |
| TC-A2b | ST-3（apply disabled） | 同上 |
| TC-A2c | apply confirm キャンセル no-op | 同上 |
| TC-A3 | ST-2（skipped 内訳行） | 同上 |
| TC-A4 | ST-7（pending 両ボタン disabled） | 同上 |
| TC-A5 | ST-5（HTTP error alert） | 同上 |
| TC-A6 | ST-6（parseError alert） | 同上 |
