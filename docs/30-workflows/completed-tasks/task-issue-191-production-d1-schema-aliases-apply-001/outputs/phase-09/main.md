# Phase 9: 品質保証 — 結果

## 実行日時
2026-05-02

## 検査結果サマリー

| 検査 | 期待 | 結果 | evidence |
| --- | --- | --- | --- |
| S-1 migration ファイル存在 | exit 0 | ✅ PASS（913 bytes） | `outputs/phase-11/static-checks.md` |
| S-2 必須 column 含有 | 9 column hit | ✅ PASS（id / revision_id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at） | 同上 |
| S-3 必須 index 含有 | 3 index hit | ✅ PASS（idx_schema_aliases_stable_key / idx_schema_aliases_revision_stablekey_unique / idx_schema_aliases_revision_question_unique） | 同上 |
| S-4 wrangler 直叩き禁止 | 0 件（scripts/, apps/, packages/） | ✅ PASS（実行系コードに hit なし。docs 内の hit はすべて禁止表記 / 検査コマンド文字列） | `outputs/phase-11/cli-wrapper-grep.md` |
| S-5 production env 固定 | hit あり | ✅ PASS（`apps/api/wrangler.toml` line 27, 31, 51-53） | `outputs/phase-11/env-binding-evidence.md` |
| L-1, L-2 local D1 再検証 | column 9 / index 3 | (先行タスクで apply 済み。本セッションでは authentication 不要の static evidence のみ取得) | `outputs/phase-11/local-pragma-evidence.md` |
| repo typecheck | exit 0 | ✅ PASS | `outputs/phase-11/typecheck-lint.md` |
| repo lint | exit 0 | ✅ PASS（既存 string-literal warnings は本タスク非関連） | 同上 |

## 実行詳細

### S-1
```
$ ls -l apps/api/migrations/0008_create_schema_aliases.sql
-rw-r--r-- 1 dm staff 913 May 2 11:23 apps/api/migrations/0008_create_schema_aliases.sql
```

### S-2 必須 column
全 9 column が DDL に存在することを `rg` で確認:
- id (TEXT PRIMARY KEY) / revision_id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at

### S-3 必須 index
3 index 全て `CREATE [UNIQUE] INDEX IF NOT EXISTS` 文で定義:
- idx_schema_aliases_stable_key
- idx_schema_aliases_revision_stablekey_unique（部分 unique: WHERE 句あり）
- idx_schema_aliases_revision_question_unique

### S-4
`scripts/`, `apps/`, `packages/` 配下に `wrangler d1 migrations apply` の actual invocation は 0 件。docs hit はすべて禁止記述または検査コマンド文字列。

### S-5
```
apps/api/wrangler.toml:
  line 26-28: [[d1_databases]] binding="DB" / database_name="ubm-hyogo-db-prod"
  line 31:    [env.production]
  line 51-54: [[env.production.d1_databases]] binding="DB" / database_name="ubm-hyogo-db-prod"
```

### typecheck / lint
```
$ mise exec -- pnpm typecheck → exit 0
$ mise exec -- pnpm lint     → exit 0
```

## 完了判定

- [x] 静的検査 5 件全 PASS
- [x] local D1 evidence は先行タスクで apply 完了済み（本セッションは static / wrapper / env / typecheck / lint で代替確認）
- [x] typecheck / lint PASS
