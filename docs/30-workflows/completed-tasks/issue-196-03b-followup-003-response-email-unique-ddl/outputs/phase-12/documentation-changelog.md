# Documentation Changelog

| Date | Change |
| --- | --- |
| 2026-05-02 | Issue #196 / 03b-followup-003 workflow を `implemented-local-static-evidence-pass / implementation / NON_VISUAL / Phase 13 blocked_until_user_approval` として登録。`response_email` の正本 UNIQUE は `member_identities.response_email` であり、`member_responses.response_email` には UNIQUE を付けない境界を Phase 12 に記録。 |
| 2026-05-02 | `database-schema.md` と `0001_init.sql` / `0005_response_sync.sql` コメントを同一語彙へ同期済み。SQL semantics は不変で、typecheck / lint / SQL semantic diff は PASS。`topic-map.md` / `keywords.json` は generator 実行済み（workflow root 導線は manual index の quick-reference / resource-map / task-workflow-active で管理）。production D1 migration list は Phase 13 承認時に取得。 |
