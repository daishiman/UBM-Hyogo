# 2026-06-09 member data source precedence and profile session fix

`docs/30-workflows/completed-tasks/member-data-source-precedence-and-profile-session-fix/` を `implemented_local_runtime_pending / implementation / VISUAL` として同期。

- `member_field_overrides` と `member_identities.seed_source/seed_imported_at` を D1 正本へ追加。
- Sheets seed を `member_responses` / `response_fields` へ合流し、実シートラベルと consent 実値を mapper に反映。
- 表示合成は L1 管理者確定編集 > L2 Form 本人再回答 > L3 Sheets 初回 seed。
- admin field override endpoint と admin drawer editing UI を追加。
- `/profile` は `/me/profile` の auth failure を login redirect へ fail-safe 化。
- system specs、workflow Phase 12 strict 7、artifact inventory、quick-reference/resource-map/task-workflow-active を同一 wave で更新。
- Remote D1 apply、staging deploy、authenticated visual capture、commit/push/PR は user-gated。
