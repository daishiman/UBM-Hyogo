# DDL 同期テンプレ — database-schema.md 反映用

> 由来: UT-04 skill-feedback-report に基づく改善（2026-04-29）。`database-schema.md` v1.3.0 から責務分離。複数テーブル系タスクで DDL を本ファミリへ反映する際、テーブル別セクション分割と制約一覧を機械的に書ける雛形。

## テーブル別セクション分割テンプレ

新規テーブルを追加する際は、以下の小節構造で記述する。

```markdown
### <table_name>

| 項目 | 値 |
| --- | --- |
| 用途 | <ビジネス上の役割を 1 行> |
| 主キー | <PK 列名> |
| FK | <参照先テーブル.列 / なし> |
| インデックス | <index_name (col1, col2)> |
| 制約 | <NOT NULL / UNIQUE / CHECK / FK ON DELETE 等> |
| 備考 | <由来 migration / WAL 注意 / PRAGMA 依存等> |
```

## 制約一覧表テンプレ

各テーブル節末尾に以下の表を添えると、migration 追加時の差分レビューが容易になる。

| 制約名 | 種別 | 対象カラム | 参照先 | 動作 | 由来 migration |
| --- | --- | --- | --- | --- | --- |
| `<constraint_name>` | PK / UNIQUE / FK / CHECK / NOT NULL | `<col>` | `<table.col>` | CASCADE / RESTRICT / SET NULL / N/A | `apps/api/migrations/0007_*.sql` |

## 運用メモ

- `PRAGMA foreign_keys = ON;` は migration 先頭またはアプリ起動時 health check で常時保証する（D1 はセッション単位で OFF が既定）。
- 連番は `0007_<verb>_<target>.sql` 以降を維持。dev / main 並行開発時の番号衝突は UT-04 実装フェーズの runbook で調整する。
- DDL 追加は `bash scripts/cf.sh d1 migrations apply <DB> --env <env>` で適用し、出力ログは workflow の `outputs/phase-11/manual-smoke-log.md` に転記する。

## 関連ドキュメント

- [database-schema.md](./database-schema.md) — テーブル定義本体
- [deployment-cloudflare.md](./deployment-cloudflare.md) — Wrangler D1 migration 手順
- [lessons-learned/lessons-learned-ut-04-d1-schema-design-2026-04.md](../lessons-learned/lessons-learned-ut-04-d1-schema-design-2026-04.md) — UT-04 教訓集
