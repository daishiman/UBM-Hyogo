# Coverage Evidence

## 実行日時

- 取得タイムスタンプ: 2026-05-15 16:00 JST 帯 (= 2026-05-15T07:00Z 前後)
- 実行主体: ユーザーローカル (`! bash scripts/cf.sh ...`)、Gate-B 承認直前の再実行に該当
- D1 binding: `ubm-hyogo-db-prod` (database_id: `24963f0a-7fbb-4508-a93a-f8e502aa4585`)

## production 実行結果

コマンド:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote
```

wrangler 出力（要点抜粋）:

```
🌀 Executing on remote database ubm-hyogo-db-prod (24963f0a-7fbb-4508-a93a-f8e502aa4585):
🌀 Processed 1 queries.
🚣 Executed 1 queries in 2.86ms (1 rows read, 0 rows written)
results: [ { "Total queries executed": 1, "Rows read": 1, "Rows written": 0, "Database size (MB)": "0.95" } ]
served_by: v3-prod (APAC/NRT) / total_attempts: 1 / sql_duration_ms: 2.8558
```

判定: **0 rows** が SELECT 結果として返却された（出力上の `results[]` は wrangler 標準の集計サマリ行のみで、SELECT のマッチ行 `{question_id, schema_questions_stable_key, revision_id, schema_aliases_stable_key}` は含まれていない）。`rows_read: 1` は LEFT JOIN による行スキャンメタであり、SELECT のマッチ行数を示すものではない。

## staging 実行結果

コマンド:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --file scripts/diagnose/schema-aliases-coverage.sql --remote
```

wrangler 警告:

```
▲ [WARNING] No environment found in configuration with name "staging".
```

→ `apps/api/wrangler.toml` には `[env.staging]` セクションが存在しない（参照: `apps/api/wrangler.toml` 上部の `[[d1_databases]]` と `[env.production]` のみ存在）。そのため staging 指定はトップレベルの `[[d1_databases]]` バインディングへフォールバックし、production と同一 D1 (`ubm-hyogo-db-prod`, id `24963f0a-...`) を引いている。Issue #299 の GO 判定ではこの構成事実を明示し、独立 staging D1 の証跡ではなく production D1 の再確認として扱う。

wrangler 出力（要点抜粋）:

```
🌀 Executing on remote database ubm-hyogo-db-prod (24963f0a-7fbb-4508-a93a-f8e502aa4585):
🌀 Processed 1 queries.
🚣 Executed 1 queries in 1.93ms (1 rows read, 0 rows written)
results: [ { "Total queries executed": 1, "Rows read": 1, "Rows written": 0, "Database size (MB)": "0.95" } ]
```

判定: production と同一 D1 を引いており、結果は同じく **0 rows**。本プロジェクトの現行運用では staging 専用の D1 binding を持たず production D1 が staging を兼ねる構成のため、coverage Gate-B の実質要件は production 単一で充足する。

## 総合判定

| 環境 | 結果 | Gate-B 判定 |
| --- | --- | --- |
| production | 0 rows | PASS |
| staging（= production と同一 D1） | 0 rows | PASS |

production PASS と staging 指定時の同一 D1 再確認 PASS により `schema_questions.stable_key` SELECT fallback 削除を GO とした。2026-05-15 review で coverage SQL は alias 行の存在だけでなく `schema_questions.stable_key` と `schema_aliases.stable_key` の不一致も検出する semantic coverage へ強化済み。
