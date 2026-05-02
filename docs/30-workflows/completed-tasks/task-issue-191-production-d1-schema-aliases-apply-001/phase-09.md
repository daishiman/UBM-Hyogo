# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

apply 実行前に、リポジトリ側の静的検査と local D1 再検証を完了し、production apply 準備が整っていることを保証する。

## 実行タスク

- migration file / required columns / required indexes / wrapper policy を静的検査する。
- local D1 の schema_aliases table / indexes を再確認する。
- repo typecheck / lint を実行し、operation spec 追加で既存品質を落としていないことを確認する。

## 実行する検査

### 1. 静的検査

```bash
# S-1: migration ファイル存在
ls apps/api/migrations/0008_create_schema_aliases.sql

# S-2: 必須 column 含有
rg -n "id\s+TEXT PRIMARY KEY|stable_key|alias_question_id|alias_label|source|created_at|resolved_by|resolved_at" \
  apps/api/migrations/0008_create_schema_aliases.sql

# S-3: 必須 index 含有
rg -n "idx_schema_aliases_stable_key|idx_schema_aliases_revision_stablekey_unique|idx_schema_aliases_revision_question_unique" \
  apps/api/migrations/0008_create_schema_aliases.sql

# S-4: wrangler 直叩き禁止確認
rg -n "wrangler d1 migrations apply" \
  docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/

# S-5: production env 識別子確認
rg -n "ubm-hyogo-db-prod|env\.production" apps/api/wrangler.toml
```

### 2. local D1 再検証

Local PRAGMA is not a canonical check in this workflow because `apps/api/wrangler.toml` has no `[env.development]` section. Phase 9 records DDL static evidence; production PRAGMA is reserved for Phase 13 after approval.

### 3. リポジトリ側 typecheck / lint（既存タスクの回帰確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

注: テスト実行は `task-issue-191-schema-aliases-implementation-001` の Phase 9 で完了済み。本タスクでは回帰しないことを typecheck / lint のみで確認する。

## 評価

| 検査 | 期待 | 結果記録先 |
| --- | --- | --- |
| 静的検査 | S-1〜S-5 全て PASS | `outputs/phase-11/static-checks.md` |
| local D1 | column 9 / index 3 が確認できる | `outputs/phase-11/local-pragma-evidence.md` |
| typecheck / lint | exit 0 | `outputs/phase-11/typecheck-lint.md` |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| test strategy | `phase-04.md` | S/L verification ID |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | static checks |
| wrapper policy | `scripts/cf.sh` | Cloudflare CLI 実行経路 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| quality result | `phase-09.md` | 実行コマンド / expected output / evidence path |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 11 | Phase 9 の結果を NON_VISUAL evidence として保存 | `outputs/phase-11/*.md` |
| Phase 10 | Design GO の判定材料にする | `phase-10.md` |

## 完了条件

- [ ] 静的検査 5 件が全て PASS
- [ ] local D1 evidence が取得できる
- [ ] typecheck / lint が PASS
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 10: GO/NO-GO
