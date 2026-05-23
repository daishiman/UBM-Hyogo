# Phase 9: local 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | spec_created |

## 目的

local 環境で AC-1〜AC-11 を機械的に確認する。

## チェックリスト

| AC | 検証コマンド / 手順 | 結果 |
| --- | --- | --- |
| AC-1 | `pnpm --filter @ubm/web test -- SchemaDiffPanel` | spec all pass |
| AC-2 | `pnpm --filter @ubm/api test -- schema.rollback` | A-01/A-06 pass |
| AC-3 | local d1 で rollback 実行 → `SELECT * FROM audit_log WHERE action='schema_alias.rollback'` | 1 行 / `after_json.relatedAuditId` 非 NULL |
| AC-4 | local dev server で modal 表示確認 | 影響件数 + warning |
| AC-5 | `PRAGMA table_info(schema_aliases)` | `deleted_at` / `deleted_by` / `version` 列存在 |
| AC-6 | `git diff docs/00-getting-started-manual/specs/11-admin-management.md` | 追記済 |
| AC-7 | `git diff docs/00-getting-started-manual/specs/01-api-schema.md` | 追記済 |
| AC-8 | `pnpm verify-design-tokens` | pass |
| AC-9 | `find apps -name "*.test.ts*"` (新規分) | 0 件 |
| AC-10 | A-02 (version mismatch) spec pass | A-02 pass |
| AC-11 | `rg "DB\." apps/web/src` | 0 件 (web から D1 直アクセス無し) |

## 検証コマンドまとめ

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
mise exec -- pnpm --filter @ubm/web test
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
rg "FROM schema_aliases" apps/api/src --type ts | rg -v "deleted_at"  # 0 件
```

## 完了条件

- [ ] 全 AC が pass
- [ ] verify-pr-ready.sh pass

## 次 Phase

- 次: 10（リファクタ）
