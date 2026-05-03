# Phase 6: 異常系設計 — 結果

## 実行日時
2026-05-02

## 異常系マトリクス

| ID | 状況 | 検知 | 一次対応 | rollback / 復旧 |
| --- | --- | --- | --- | --- |
| E-1 | `bash scripts/cf.sh whoami` 失敗 | exit code != 0 | apply 経路停止。`op` 認証 / 1Password Vault の `CLOUDFLARE_API_TOKEN` を確認 | 再実行のみ（state 変化なし） |
| E-2 | apply 前 inventory で `schema_aliases` 既存 | `tables-before.txt` に hit | 状態調査。本タスクの apply は実行せず Phase 13 で報告 | 必要に応じてユーザーへエスカレーション |
| E-3 | `migrations apply` 中ネットワーク失敗 | log にエラー + non-zero exit | 即 `migrations list` 再実行で apply 状態確認。partial apply 判定 | partial の場合も rollback / re-apply は追加承認まで実行しない |
| E-4 | apply 後 PRAGMA で必須 column 不一致 | `pragma-table-info.txt` に欠損 | apply 失敗扱い。migration ファイル drift 調査 | 下記 rollback DDL を追加承認後にのみ実行 |
| E-8 | 誤 env apply | log の environment 表示 | 停止し state を記録して報告 | `DROP TABLE` / re-apply は追加承認後のみ |
| E-9 | target 以外の pending migration | `migrations-list-before.txt` | apply せず NO-GO | state 変化なし |
| E-5 | apply 後 PRAGMA で index 数 ≠ 3 | `pragma-index-list.txt` 行数不一致 | 不足 index 原因調査 | E-4 と同 |
| E-6 | `migrations list` に applied 反映なし | `migrations-list-after.txt` 未反映 | Cloudflare eventual consistency 考慮し 30 秒後再取得。改善なければサポートチケット | state 変化があれば手動 sync |
| E-7 | ユーザー承認テキスト未記録 | `outputs/phase-13/user-approval.md` 不在 | apply 経路を中断 | 再承認取得 |
| E-8 | 誤って `--env production` 以外で apply | log の environment 表示 | 即 staging から `DROP TABLE schema_aliases;` 実行 | env 識別子再確認後に正しい env で再 apply |

## Rollback DDL（参照用 / 追加承認後にのみ実行）

```sql
-- E-4 / E-5 / E-8 共通 rollback
DROP INDEX IF EXISTS idx_schema_aliases_revision_question_unique;
DROP INDEX IF EXISTS idx_schema_aliases_revision_stablekey_unique;
DROP INDEX IF EXISTS idx_schema_aliases_stable_key;
DROP TABLE IF EXISTS schema_aliases;
```

## エスカレーション基準

- partial apply / state drift / index 欠損が解決できない場合 → ユーザー即報告し `completed` に移行しない
- migration は `IF NOT EXISTS` で冪等のため再実行は安全。ただし PRAGMA 結果が期待値と一致するまで `completed` に進めない

## 完了判定

- [x] E-1〜E-9 が検知 / 一次対応 / rollback まで定義済み
- [x] rollback DDL が実行可能な形で記載済み
