# Phase 2 出力: 設計（issue-191）

Phase 1 で確定した要件・AC・Ownership を入力に、`schema_aliases` の DDL、apps/api 配下の module 配置、03a 互換 path、07b 書き込み path を確定する。

## env / dependency matrix

| 種別 | 値 |
| --- | --- |
| Runtime | Cloudflare Workers (apps/api) |
| DB | Cloudflare D1 binding（既存流用） |
| Migration tool | `wrangler d1 migrations`（`scripts/cf.sh` ラッパー経由必須） |
| 新規依存 npm | なし（既存 D1 アクセス層を踏襲） |
| 新規 secret | なし |

## module 設計

| パス（提案） | 役割 | 種別 |
| --- | --- | --- |
| `apps/api/migrations/<NNNN>_create_schema_aliases.sql` | DDL | 新規 |
| `apps/api/src/repositories/schemaAliases.ts` | repository（lookup/insert/update） | 新規 |
| `apps/api/src/repositories/schemaQuestions.ts` | `findStableKeyById(questionId)` 追加 | 既存 patch |
| `apps/api/src/services/sync/resolveStableKey.ts` | lookup 順序ロジック | 新規 |
| `apps/api/src/services/admin/aliasAssignment.ts` | 07b 書き込み先切替 | 既存 patch |
| `apps/api/test/repositories/schemaAliases.contract.test.ts` | 契約テスト | 新規 |

## 構造図

`outputs/phase-02/schema-aliases-er.mermaid` 参照。

## DDL 案

`outputs/phase-02/ddl-draft.sql` 参照。8 カラム（id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at） + UNIQUE(alias_question_id) + INDEX(stable_key)。

### カラム設計理由

| カラム | 理由 |
| --- | --- |
| `id` | ULID（時系列ソート / 監査用） |
| `stable_key` | 03a lookup の正規キー、INDEX 高速化 |
| `alias_question_id` | Google Forms 生 ID。UNIQUE で重複防止 |
| `alias_label` | 解決時点 question label snapshot（不変条件 #1 遵守証跡） |
| `source` | 'manual' / 'auto' / 'migration' の出自区別 |
| `created_at` / `resolved_at` | 監査ログ |
| `resolved_by` | 07b の admin user id。manual resolve では必須、migration source のみ nullable |

## 03a 互換 path（lookup 順序）

```
resolveStableKey(questionId, questionLabel):
  1. row = schemaAliasesRepository.lookup(questionId)
     → hit: return { stableKey: row.stable_key, source: 'aliases' }
  2. fallback = schemaQuestionsRepository.findStableKeyById(questionId)
     → hit: return { stableKey: fallback, source: 'questions_fallback' }
  3. return null  // caller が schema_diff_queue に unresolved enqueue
```

両 hit 時は aliases 優先。移行終端条件: `schema_questions.stable_key IS NOT NULL` の全行が `schema_aliases` にも存在する状態へ到達後、Phase 12 ドキュメントで fallback 廃止を予告。

## 07b 書き込み path

```
assignAlias(diffQueueRow, stableKey, adminUserId):
  schemaAliasesRepository.insert({
    id: ulid(),
    stable_key: stableKey,
    alias_question_id: diffQueueRow.question_id,
    alias_label: diffQueueRow.question_label,
    source: 'manual',
    resolved_by: adminUserId,
    resolved_at: now()
  })
  schemaDiffQueueRepository.markResolved(diffQueueRow.id)
  // schema_questions への UPDATE は禁止
```

## 不変条件マッピング

| 不変条件 | 適合方法 |
| --- | --- |
| #1 | alias を専用テーブル分離、コードに stableKey 直書きなし |
| #5 | 全 repository / service を `apps/api/src/` に閉じる |
| #14 | 07b workflow からのみ書き込み、03a は read-only |

## 次 Phase（3: 設計レビュー）への引き渡し

- DDL / module 配置 / lookup 順序 / 07b 書き込み path
- open: id 採番方式（ULID / UUID）→ Phase 3 alternative 比較
