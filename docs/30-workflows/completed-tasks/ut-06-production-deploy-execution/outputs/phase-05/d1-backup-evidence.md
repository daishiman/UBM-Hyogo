# Phase 5: D1 本番バックアップ証跡 (AC-7)

> **ステータス: NOT EXECUTED (未実行)**
> **理由:** 本タスク (UT-06) はドキュメントのみ作成モード。`wrangler d1 export --env production` は本番影響を伴うため未発火。

## 1. バックアップ取得方針

- 本番不可逆操作 (D1 マイグレーション適用) の前に必ず取得する **必須前置き** とする (AC-7)。
- 初回適用時はテーブル未作成のため空 export になることを許容する。その場合は本ファイルにその旨を明記する。
- バックアップファイルの保管場所は `outputs/phase-05/backup-<timestamp>.sql` を一次保管。長期保管は別途 R2 / 1Password Environments / 外部ストレージで検討 (UT-08 / 後続タスク)。
- 機密性: バックアップ SQL には実データが含まれる可能性があるため、本リポジトリにコミットせず `.gitignore` 等で除外することを推奨。

## 2. 取得コマンド (プリセット)

```bash
# 実行直前に timestamp を確定
TS=$(date +%Y%m%d-%H%M%S)

# 本番 D1 を SQL エクスポート
bash scripts/cf.sh d1 export <DB_NAME> \
  --env production \
  --output "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"

# サイズ・行数を確認
wc -l "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
ls -la "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
```

## 3. 取得記録テンプレ (AC-7 必須)

| 項目 | 値 |
| --- | --- |
| 取得日時 | TBD (YYYY-MM-DD HH:MM:SS JST) |
| 取得実施者 | TBD |
| wrangler バージョン | TBD |
| 対象 D1 database (binding 名) | DB |
| 対象 D1 database_name | TBD (例: `ubm-hyogo-production`) |
| 対象 D1 database_id | (Cloudflare Dashboard 管理・本ファイルには記載しない) |
| バックアップファイルパス | `outputs/phase-05/backup-<timestamp>.sql` |
| ファイルサイズ (bytes) | TBD |
| 行数 (`wc -l`) | TBD |
| 初回空 export 判定 | TBD (YES / NO) |
| ハッシュ (sha256) | TBD (`shasum -a 256 backup-<ts>.sql`) |
| 保管場所 (一次) | リポジトリ outputs/phase-05/ (gitignore 検討要) |
| 保管場所 (長期) | TBD (R2 / 1Password / 別ストレージ) |
| アクセス制限 | delivery 担当・運用責任者のみ |

## 4. 検証手順

取得後に以下を確認:

1. ファイルが生成されている (`ls -la`)
2. SQL 構文が壊れていない (`head -n 50 backup-<ts>.sql` で先頭スキーマ DDL を目視)
3. 想定テーブル数 (Phase 4 preflight-checklist の事前確認結果と整合) — 初回時は 0
4. 機密マスキングは不要 (内部利用のみ)。ただしリポジトリ公開先での扱いに注意

## 5. 初回デプロイ時の特殊扱い

本タスクは Wave 1 の初回 go-live。マイグレーション未適用 = テーブル未存在のため:

- `wrangler d1 export` は空 (またはほぼ空) の SQL を返すことが想定される
- 「空 export でも証跡として記録する」方針で OK (AC-7 は「取得・保管場所記録」が要件、内容は問わない)
- マイグレーション失敗時のリストアは「テーブル DROP 相当の SQL を別途用意」が必要 (rollback-runbook.md A-3 に記載)

## 6. リストア手順 (Phase 6 異常系シナリオ A-3 用)

```bash
# バックアップから手動リストア
bash scripts/cf.sh d1 execute <DB_NAME> \
  --env production \
  --file "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-<timestamp>.sql"

# 再実行確認
bash scripts/cf.sh d1 execute <DB_NAME> \
  --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

詳細は `outputs/phase-02/rollback-runbook.md` の D1 セクション参照。
