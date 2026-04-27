# Phase 2: 設計

## アーキテクチャ概要

リポジトリ層は `apps/api/src/repository/` 配下に配置する。テーブル単位で 1:1 のモジュールを作り、横断的な処理は `_shared/` に集約する。

## ディレクトリ構造

```
apps/api/src/repository/
├── _shared/
│   ├── brand.ts        # @ubm-hyogo/shared からの branded type re-export
│   ├── db.ts           # D1 抽象 interface と DbCtx
│   ├── sql.ts          # 共通 SQL ヘルパー
│   └── builder.ts      # ビュー組み立て（PublicMemberProfile 等）
├── members.ts           # member_identities CRUD
├── identities.ts        # email <-> member_id 検索
├── status.ts            # member_status CRUD
├── responses.ts         # member_responses CRUD
├── responseSections.ts  # response_sections read
├── responseFields.ts    # response_fields read
├── fieldVisibility.ts   # member_field_visibility CRUD
├── memberTags.ts        # member_tags + tag_definitions read-only
├── __fixtures__/
│   ├── members.fixture.ts  # テストデータ定義
│   └── d1mock.ts           # in-memory D1 モック
└── __tests__/
    ├── _setup.ts
    ├── brand.test.ts
    ├── members.test.ts
    ├── identities.test.ts
    ├── status.test.ts
    ├── responses.test.ts
    ├── responseSections.test.ts
    ├── responseFields.test.ts
    ├── fieldVisibility.test.ts
    ├── memberTags.test.ts
    └── builder.test.ts
```

## 型設計

### D1 抽象 interface（db.ts）

```typescript
interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

interface DbCtx {
  readonly db: D1Db;
}
```

### Row 型定義

各リポジトリモジュールで D1 から取得される生データの Row 型を定義する。

```typescript
// members.ts / identities.ts
interface MemberIdentityRow {
  member_id: string;
  response_email: string;
  current_response_id: string;
  first_response_id: string;
  last_submitted_at: string;
  created_at: string;
  updated_at: string;
}

// status.ts
interface MemberStatusRow {
  member_id: string;
  public_consent: string;
  rules_consent: string;
  publish_state: string;
  is_deleted: number;
  hidden_reason: string | null;
  last_notified_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

// responses.ts
interface MemberResponseRow {
  response_id: string;
  form_id: string;
  revision_id: string;
  schema_hash: string;
  response_email: string | null;
  submitted_at: string;
  edit_response_url: string | null;
  answers_json: string;
  raw_answers_json: string;
  extra_fields_json: string;
  unmapped_question_ids_json: string;
  search_text: string;
}
```

## データフロー

```
Request
  └── Hono Handler (apps/api/src/)
        └── Repository 関数 (apps/api/src/repository/)
              ├── _shared/db.ts (DbCtx)
              │     └── D1Db interface
              │           └── Cloudflare D1 (本番) / MockD1 (テスト)
              └── _shared/builder.ts
                    ├── members.ts
                    ├── status.ts
                    ├── responses.ts
                    ├── responseFields.ts
                    ├── fieldVisibility.ts
                    └── memberTags.ts
```

## 公開 API 設計方針

- 全関数のシグネチャは `(c: DbCtx, ...args) => Promise<Result | null>` パターン
- upsert のみ write を許可（partial update 禁止）
- 削除は論理削除のみ（member_status.is_deleted + deleted_members INSERT）
