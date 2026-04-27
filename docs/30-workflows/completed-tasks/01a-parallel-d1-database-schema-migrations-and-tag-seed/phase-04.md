# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 4 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 3 (設計レビュー) |
| 下流 Phase | 5 (実装ランブック) |
| 状態 | completed |

## 目的

migration apply / rollback / schema 整合 / seed / 重複制約の 5 軸でテスト戦略を確定する。本タスクは API を持たないため contract test / authorization test は対象外、代わりに「DDL 完全性」「制約動作」を検証する。

## 実行タスク

1. verify suite を確定（migration apply / schema object set / index count / seed count / constraint test）
2. test fixture（最小 row 投入）の placeholder
3. authz test placeholder（このタスクでは N/A、binding 配置のみ確認）
4. AC ↔ test 対応表
5. outputs/phase-04/migration-tests.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | DDL |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 制約 |

## 実行手順

### ステップ 1: verify suite
### ステップ 2: fixture
### ステップ 3: AC matrix
### ステップ 4: outputs

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の sanity check |
| Phase 7 | AC matrix |
| Phase 9 | 無料枠 test |

## 多角的チェック観点（不変条件参照）

- **#15**: `INSERT INTO member_attendance VALUES ('m1','s1',...); INSERT INTO member_attendance VALUES ('m1','s1',...);` の 2 回目が UNIQUE 違反になる test
- **#7**: `member_responses.response_id` と `member_identities.member_id` が別 column であることを SELECT で確認
- **#5**: `apps/web/wrangler.toml` に D1 binding がない grep test
- **#1**: schema_questions に stable_key column が存在する PRAGMA test

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite | 4 | completed | 5 軸 |
| 2 | fixture | 4 | completed | 最小行 |
| 3 | AC ↔ test | 4 | completed | 9 件 |
| 4 | outputs | 4 | completed | outputs/phase-04/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略総合 |
| ドキュメント | outputs/phase-04/migration-tests.md | command + expected |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] 5 軸すべて command 確定
- [ ] AC-1〜AC-9 が test に紐付き

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-04/main.md と migration-tests.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 5
- 引き継ぎ事項: test command → runbook
- ブロック条件: AC matrix 未完成

## Verify Suite 設計

### 1. migration apply

| 対象 | コマンド | 期待 |
| --- | --- | --- |
| local | `wrangler d1 migrations apply ubm-hyogo-db-staging --local` | exit 0、4 migration |
| remote (CI) | deployment workflowで実行 | placeholder |

### 2. schema object set

```bash
wrangler d1 execute ubm-hyogo-db-staging --local --command \
  "SELECT COUNT(*) AS n FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations';"
# expected: 19 (member_identities/member_status/member_responses/response_sections/response_fields/member_field_visibility/member_tags/tag_definitions/tag_assignment_queue/schema_versions/schema_questions/schema_diff_queue/meeting_sessions/member_attendance/admin_users/admin_member_notes/deleted_members/magic_tokens/sync_jobs)
```

### 3. index count

```bash
wrangler d1 execute ubm-hyogo-db-staging --local --command \
  "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';"
# expected: >= 7
```

### 4. seed count

```bash
wrangler d1 execute ubm-hyogo-db-staging --local --command \
  "SELECT category, COUNT(*) AS n FROM tag_definitions GROUP BY category;"
# expected: 6 行 (business / skill / interest / region / role / status)
```

### 5. constraint test

| ケース | コマンド | 期待 |
| --- | --- | --- |
| attendance 重複 | INSERT 2 回目 | `UNIQUE constraint failed: member_attendance.member_id, member_attendance.session_id` |
| identity email 重複 | 同 email で 2 回 INSERT | `UNIQUE constraint failed: member_identities.response_email` |
| tag_definitions code 重複 | 同 code で 2 回 INSERT | `UNIQUE constraint failed: tag_definitions.code` |

## AC ↔ test 対応表

| AC | テスト |
| --- | --- |
| AC-1 | migration apply local |
| AC-2 | migration apply remote |
| AC-3 | schema object set = 19 |
| AC-4 | index count >= 7 |
| AC-5 | seed category count = 6 |
| AC-6 | attendance 重複 test |
| AC-7 | Phase 9 free-tier-estimate.md |
| AC-8 | grep wrangler.toml |
| AC-9 | migration ファイル名 NNNN_*.sql |

## Authz テスト

このタスクでは N/A。`apps/web/wrangler.toml` に D1 binding がないことを Phase 6 / 11 で grep 確認。
