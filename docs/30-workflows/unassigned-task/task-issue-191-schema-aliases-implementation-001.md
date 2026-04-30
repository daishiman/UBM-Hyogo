# task-issue-191-schema-aliases-implementation-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | High |
| Source | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Type | implementation |
| GitHub Issue | #298 |

## 1. なぜこのタスクが必要か（Why）

Issue #191 で、07b alias assignment workflow は `schema_questions.stableKey` を直接更新せず、`schema_aliases` を正本書き込み先にする方針へ確定した。現状は `spec_created / docs_only` の仕様化までで、実 D1 migration、repository、07b 配線、03a lookup fallback は未実装である。

## 2. 何を達成するか（What）

- `apps/api/migrations/<NNNN>_create_schema_aliases.sql` を追加する。
- `schemaAliasesRepository.lookup/insert/update` を実装する。
- `POST /admin/schema/aliases` の HTTP 契約は維持し、内部書き込み先を `schema_aliases` へ変更する。
- 03a は `schema_aliases` first、alias miss の場合のみ `schema_questions.stable_key` fallback とする。
- 07b は alias insert と `schema_diff_queue.status='resolved'` 更新を同一 transaction / D1 batch で行う。

## 3. どのように実行するか（How）

既存 `apps/api` の D1 repository / route pattern を再利用する。07b route では `questionId` / `aliasQuestionId` の命名を正規化し、`schema_aliases` に 1 行を INSERT してから対応する diff queue を resolved に進める。03a sync は alias lookup の transient error を alias miss と扱わず、sync failure + retry へ倒す。

## 4. 実行手順

1. 既存 07b route と request body 名を確認する。
2. 最新 migration 番号を確認し、`schema_aliases` DDL と `idx_schema_aliases_stable_key` を追加する。
3. `schemaAliasesRepository` と contract tests を追加する。
4. 07b write path を `schema_aliases` INSERT に差し替える。
5. 03a stableKey resolution を alias-first に変更する。
6. `UPDATE schema_questions SET stable_key` が実行経路にないことを静的検査で確認する。

## 5. 完了条件チェックリスト

- [ ] Local D1 migration apply が成功する。
- [ ] `PRAGMA table_info(schema_aliases)` で issue-191 columns が確認できる。
- [ ] 07b resolve が `schema_aliases` に 1 行 INSERT し、`schema_questions` を更新しない。
- [ ] 03a sync が alias row を優先して stableKey を解決する。
- [ ] duplicate alias / fallback hit / fallback miss / transient lookup failure の tests がある。
- [ ] D1 access は `apps/api` 配下に閉じている。

## 6. 検証方法

```bash
mise exec -- pnpm --filter @repo/api test
rg -n "UPDATE schema_questions SET stable_key|stableKey.*schema_questions" apps packages
```

必要に応じて local D1 で次を確認する。

```sql
PRAGMA table_info(schema_aliases);
PRAGMA index_list(schema_aliases);
```

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| `POST /admin/schema/aliases` の path を変えて下流 UI / tests を壊す | endpoint は維持し、write target だけを変更する |
| transient lookup error を fallback miss と誤扱いする | infrastructure error は sync failure + retry として扱う |
| `schema_questions.stable_key` 直更新が残る | direct update guard task と静的検査を同 wave で参照する |

## 8. 参照情報

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/`

## 9. 備考

`schema_questions.stable_key` fallback の廃止はこのタスクに含めない。移行後の運用統計が揃った後、`task-issue-191-schema-questions-fallback-retirement-001.md` で扱う。

## 苦戦箇所【記入必須】

苦戦箇所は「route contract と write target の分離」である。route 名を改善したくなるが、07b 既存契約と UI wiring を壊さないため、HTTP path は維持し、内部保存先だけを `schema_aliases` に差し替える。

## スコープ（含む/含まない）

含む: D1 migration、repository、07b write wiring、03a alias-first lookup、contract tests。

含まない: fallback retirement、本番 D1 apply、endpoint path rename、apps/web からの D1 直接参照。
