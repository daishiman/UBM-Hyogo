# task-issue-191-production-d1-schema-aliases-apply-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | High |
| Source | task-issue-191-schema-aliases-implementation-001 |
| Type | production-operation |
| GitHub Issue | #359 |

## 1. なぜこのタスクが必要か（Why）

`schema_aliases` は local migration と実装 wiring まで完了しているが、production D1 への migration apply はユーザー承認が必要な別 operation として残っている。production D1 に table がない状態で 07b `POST /admin/schema/aliases` の write path を本番へ出すと、alias 解決が実行時エラーになる。

## 2. 何を達成するか（What）

- `apps/api/migrations/0008_create_schema_aliases.sql` を production D1 に適用する。
- production D1 で `schema_aliases` table と required indexes が存在することを確認する。
- 適用前後の evidence を残し、`task-issue-191-schema-aliases-implementation-001` の Phase 12 evidence と接続する。
- apply 実施後も fallback retirement と direct update guard は別タスクとして維持する。

## 3. どのように実行するか（How）

ユーザー承認後に Cloudflare D1 production database へ migration apply を行う。適用前に dry-run 相当の migration inventory と backup / rollback 方針を確認し、適用後に `PRAGMA table_info(schema_aliases)` と `PRAGMA index_list(schema_aliases)` を取得する。schema_aliases の本番 table 作成だけを扱い、コード deploy や fallback 廃止は同時実行しない。

## 4. 実行手順

1. `task-issue-191-schema-aliases-implementation-001` が completed であることを確認する。
2. production D1 database 名、account、binding、対象 environment を確認する。
3. `apps/api/migrations/0008_create_schema_aliases.sql` の内容を再確認する。
4. migration apply 前の table/index inventory を取得する。
5. ユーザー承認後に production D1 migration apply を実行する。
6. `schema_aliases` table、unique/index、column shape を確認する。
7. evidence と正本仕様の production apply 状態を更新する。

## 5. 完了条件チェックリスト

- [ ] ユーザー承認が記録されている。
- [ ] production D1 apply 前の inventory が保存されている。
- [ ] `schema_aliases` table が production D1 に存在する。
- [ ] `idx_schema_aliases_stable_key` と alias question id uniqueness が確認されている。
- [ ] apply 後 evidence が workflow outputs または runbook に保存されている。
- [ ] `.claude/skills/aiworkflow-requirements/references/database-schema.md` の production apply 状態が更新されている。

## 6. 検証方法

```sql
PRAGMA table_info(schema_aliases);
PRAGMA index_list(schema_aliases);
```

期待: `id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` が存在し、stable key 検索 index と alias question id uniqueness が確認できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| production D1 に誤った environment で apply する | account/database/environment を apply 前 evidence に記録し、ユーザー承認後にのみ実行する |
| migration apply と code deploy を混同する | このタスクは D1 apply のみに限定し、deploy は別の承認ゲートで扱う |
| schema shape が local evidence と drift する | apply 後に PRAGMA evidence を取得し、Phase 12 implementation guide と照合する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/outputs/phase-11/d1-schema-evidence.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 9. 備考

fallback retirement は `task-issue-191-schema-questions-fallback-retirement-001`、direct stableKey update guard は `task-issue-191-direct-stable-key-update-guard-001` で扱う。

## 苦戦箇所【記入必須】

苦戦箇所は「実装完了」と「production D1 反映完了」を分ける判断である。local migration と repository tests が PASS でも、production D1 apply は不可逆性とユーザー影響があるため Phase 13 相当の承認ゲートを越えない限り完了扱いにできない。

## スコープ（含む/含まない）

含む: production D1 migration apply、前後 inventory、PRAGMA evidence、正本仕様の production apply 状態更新。

含まない: code deploy、fallback retirement、direct update guard、07b endpoint path rename、apps/web UI 変更。
