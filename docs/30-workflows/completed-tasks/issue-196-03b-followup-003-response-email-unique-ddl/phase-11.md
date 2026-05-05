# Phase 11: 手動 smoke test (NON_VISUAL)

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 11 |
| status | `implemented-local-static-evidence-pass / d1-migration-list-pending` |

## 目的

NON_VISUAL smoke evidence の container と実行コマンドを定義する。

## 実行タスク

- grep / diff / quality gate / migration list evidence の保存先を定義する。
- 未実行段階では placeholder として扱う。

## 参照資料

- `phase-04.md`
- `phase-06.md`
- `phase-07.md`

## 統合テスト連携

typecheck / lint と SQL semantic diff は取得済み。production D1 migration list は Phase 13 承認時に取得する。

## 状態

`gate defined / pending follow-up execution`

本仕様書は実装差分と静的 evidence を取得済みであり、以下の evidence container は実体化済みである。

## 期待 evidence container

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | smoke test 全体結果サマリー（Token 値・PII を含めない） |
| `outputs/phase-11/grep-spec.md` | `grep "正本 UNIQUE" database-schema.md` の出力 |
| `outputs/phase-11/grep-0001.md` | `grep "正本 UNIQUE\|UNIQUE は付与しない" 0001_init.sql` の出力 |
| `outputs/phase-11/diff-0001-0005.md` | 0001 / 0005 の文言整合 diff |
| `outputs/phase-11/sql-semantic-diff.md` | SQL 行差分が空であることの evidence |
| `outputs/phase-11/quality-gates.md` | typecheck / lint / build の exit code 記録 |
| `outputs/phase-11/migration-list.md` | `cf.sh d1 migrations list` 出力（applied 状態確認） |

production D1 migration list のみ user-gated evidence として残す。

## 実行コマンド一式（コピペ用）

```bash
# AC-1
grep -n "正本 UNIQUE" .claude/skills/aiworkflow-requirements/references/database-schema.md \
  | tee outputs/phase-11/grep-spec.md

# AC-2 / AC-3
grep -nE "正本 UNIQUE|UNIQUE は付与しない" apps/api/migrations/0001_init.sql \
  | tee outputs/phase-11/grep-0001.md

# AC-4
diff <(grep -E "正本 UNIQUE|再宣言" apps/api/migrations/0001_init.sql) \
     <(grep -E "正本 UNIQUE|再宣言" apps/api/migrations/0005_response_sync.sql) \
  | tee outputs/phase-11/diff-0001-0005.md || true

# AC-5
git diff main -- apps/api/migrations/0001_init.sql \
  | grep -E '^[+-][^-+]' | grep -vE '^[+-]\s*--' | grep -vE '^[+-]\s*$' \
  | tee outputs/phase-11/sql-semantic-diff.md
test ! -s outputs/phase-11/sql-semantic-diff.md && echo "OK: no semantic diff"

# AC-6
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/quality-gates.md
mise exec -- pnpm lint 2>&1 | tee -a outputs/phase-11/quality-gates.md

# AC-7
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  2>&1 | tee outputs/phase-11/migration-list.md
```

## 完了条件

- [x] 全 evidence container の宣言が記載されている
- [x] 実行コマンド一式が再現可能な形で記録されている
- [x] 実体 placeholder は配置済みで、実測値は実装フォロー時まで PENDING として扱う

## 成果物

- `outputs/phase-11/main.md`: 本 smoke test 計画のコピー（実行時に実測サマリーへ更新）
