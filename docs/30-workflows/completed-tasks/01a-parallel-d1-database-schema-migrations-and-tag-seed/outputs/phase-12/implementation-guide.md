# Implementation Guide: D1 Database Schema Migrations and Tag Seed

## Part 1: 中学生レベルの説明

名簿を紙で管理していると、名前、出欠、連絡先、タグ、変更履歴が別々の場所に散らばり、あとで探すのが大変になります。このタスクは、その紙の束を決まった棚と引き出しに分けて、誰が見ても同じ場所から情報を取り出せるようにする作業です。

今回作ったものは、会員情報、回答、出欠、タグ、管理メモ、ログを入れるための箱です。タグは最初から41個入れておきます。画面を変える作業ではないため、スクリーンショットは不要です。

## Part 2: 開発者向け詳細

### TypeScript Contract

```ts
export interface D1MigrationBinding {
  binding: "DB";
  database_name: "ubm-hyogo-db-staging" | "ubm-hyogo-db-prod";
  database_id: string;
  migrations_dir: "migrations";
}

export type TagCategory = "business" | "skill" | "interest" | "region" | "role" | "status";

export interface TagDefinitionSeed {
  tag_id: string;
  code: string;
  label: string;
  category: TagCategory;
  active: 0 | 1;
}
```

### API / CLI Signatures

```bash
wrangler d1 migrations apply ubm-hyogo-db-staging --env staging --local
wrangler d1 migrations apply ubm-hyogo-db-staging --env staging --remote
wrangler d1 migrations apply ubm-hyogo-db-prod --remote
```

### Migration Files

| File | Responsibility |
| --- | --- |
| `apps/api/migrations/0001_init.sql` | form schema, responses, identities, field visibility, `members` view |
| `apps/api/migrations/0002_admin_managed.sql` | status, attendance, tag tables, notes, deleted members |
| `apps/api/migrations/0003_auth_support.sql` | admin users, magic tokens, sync jobs, `audit_log` |
| `apps/api/migrations/0004_seed_tags.sql` | 6 categories / 41 `tag_definitions` rows |

### Error Handling and Edge Cases

| Case | Handling |
| --- | --- |
| Duplicate tag seed | `INSERT OR IGNORE` keeps migration idempotent |
| Duplicate attendance | `PRIMARY KEY (member_id, session_id)` rejects duplicates |
| Form schema drift | `schema_questions.stable_key` and `schema_diff_queue` preserve abstraction |
| Apps/web D1 access | D1 binding remains in `apps/api/wrangler.toml` only |
| D1 contention | Runtime retry/backoff remains downstream UT-09 responsibility |

### Constants and Parameters

| Name | Value |
| --- | --- |
| D1 binding | `DB` |
| Staging DB | `ubm-hyogo-db-staging` |
| Production DB | `ubm-hyogo-db-prod` |
| Migration directory | `migrations` |
| Seed category count | 6 |
| Seed row count | 41 |

### Screenshot Reference

N/A. Phase 11 evidence is stored in `outputs/phase-11/main.md`; no UI/UX surface changed.
