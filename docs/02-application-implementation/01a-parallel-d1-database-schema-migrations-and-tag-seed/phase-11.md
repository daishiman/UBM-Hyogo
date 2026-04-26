# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 11 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 10 (最終レビュー) |
| 下流 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

migration apply / table 列挙 / seed 確認 / 制約 trigger / 無料枠表示 を手動で smoke し、evidence を outputs/phase-11/ に保存。

## 実行タスク

1. smoke 5 手順抽出
2. evidence path 確定
3. wrangler 出力 placeholder
4. outputs

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/migration-runbook.md | step |
| 必須 | outputs/phase-04/migration-tests.md | command |

## 実行手順

### 5 手順 → evidence

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 12 | implementation-guide |
| 13 | PR description |

## 多角的チェック観点（不変条件参照）

- **#5**: apps/web/wrangler.toml grep 結果 evidence
- **#15**: attendance 重複 INSERT の error evidence

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | smoke 抽出 | 11 | pending |
| 2 | evidence path | 11 | pending |
| 3 | placeholder | 11 | pending |
| 4 | outputs | 11 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-11/main.md |
| evidence | outputs/phase-11/migrations-apply.log |
| evidence | outputs/phase-11/tables.log |
| evidence | outputs/phase-11/seed-count.log |
| evidence | outputs/phase-11/constraint-violation.log |
| evidence | outputs/phase-11/wrangler-info.log |
| evidence | outputs/phase-11/web-no-binding.grep |
| メタ | artifacts.json |

## 完了条件

- [ ] 5 evidence placeholder

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-11/ 配下 6 evidence 配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 12
- 引き継ぎ事項: evidence path
- ブロック条件: 未配置

## Manual Evidence

### 1. migrations apply

```bash
$ wrangler d1 migrations apply ubm-hyogo-staging --local
# 期待: 4 migration applied
```

evidence: `outputs/phase-11/migrations-apply.log`

### 2. tables 列挙

```bash
$ wrangler d1 execute ubm-hyogo-staging --local --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
# 期待: 19 行
```

evidence: `outputs/phase-11/tables.log`

### 3. seed 件数

```bash
$ wrangler d1 execute ubm-hyogo-staging --local --command \
  "SELECT category, COUNT(*) FROM tag_definitions GROUP BY category;"
# 期待: 6 行
```

evidence: `outputs/phase-11/seed-count.log`

### 4. constraint trigger

```bash
$ wrangler d1 execute ubm-hyogo-staging --local --command \
  "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1','s1','test'); INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1','s1','test');"
# 期待: 2 回目で UNIQUE constraint failed
```

evidence: `outputs/phase-11/constraint-violation.log`

### 5. wrangler info（無料枠表示）

```bash
$ wrangler d1 info ubm-hyogo-staging
# 期待: storage / reads / writes 表示
```

evidence: `outputs/phase-11/wrangler-info.log`

### 6. apps/web に binding ないこと

```bash
$ grep -c "d1_databases" apps/web/wrangler.toml
# 期待: 0
```

evidence: `outputs/phase-11/web-no-binding.grep`
